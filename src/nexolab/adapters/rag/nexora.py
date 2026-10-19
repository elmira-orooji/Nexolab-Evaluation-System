"""Nexora HTTP adapter for the verified /api/v1/rag/answer contract."""
import json
import math
import socket
import uuid
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from http.client import HTTPException, IncompleteRead
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from ...domain.errors import AdapterError
from ...domain.models import JsonObject, RagResponse, TestCase
from .nexora_validation import validate_request

MAX_RETRY_AFTER_SECONDS = 86_400


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _retry_after_seconds(value: str | None) -> float | None:
    """Parse Retry-After without trusting arbitrary upstream values."""
    if not value:
        return None
    try:
        seconds = float(value)
    except ValueError:
        try:
            when = parsedate_to_datetime(value)
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
            seconds = (when - datetime.now(timezone.utc)).total_seconds()
        except (TypeError, ValueError, OverflowError):
            return None
    if not math.isfinite(seconds):
        return None
    return round(min(MAX_RETRY_AFTER_SECONDS, max(0, seconds)), 3)


def _redact_secret(value, secret: str):
    """Prevent an upstream echo from writing the configured bearer token to reports."""
    if isinstance(value, str):
        return value.replace(secret, "[REDACTED]") if secret else value
    if isinstance(value, list):
        return [_redact_secret(item, secret) for item in value]
    if isinstance(value, dict):
        return {
            (key.replace(secret, "[REDACTED]") if isinstance(key, str) and secret else key):
            _redact_secret(item, secret)
            for key, item in value.items()
        }
    return value


def _valid_uuid(value) -> bool:
    if not isinstance(value, str):
        return False
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


def _valid_score(value) -> bool:
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def _valid_ocr_provenance(value) -> bool:
    return value is None or (
        isinstance(value, dict)
        and all(isinstance(key, str) and isinstance(item, str) for key, item in value.items())
    )


def _valid_source(source) -> bool:
    return (
        isinstance(source, dict)
        and _valid_uuid(source.get("chunk_id"))
        and _valid_uuid(source.get("document_id"))
        and isinstance(source.get("filename"), str)
        and type(source.get("chunk_index")) is int
        and source["chunk_index"] >= 0
        and isinstance(source.get("content"), str)
        and _valid_score(source.get("score"))
        and _valid_ocr_provenance(source.get("ocr_provenance"))
        and (source.get("visual_query") is None or isinstance(source["visual_query"], str))
    )


def _valid_citation(citation) -> bool:
    return (
        isinstance(citation, dict)
        and type(citation.get("id")) is int
        and _valid_uuid(citation.get("chunk_id"))
        and _valid_uuid(citation.get("document_id"))
        and isinstance(citation.get("filename"), str)
        and type(citation.get("chunk_index")) is int
        and citation["chunk_index"] >= 0
        and isinstance(citation.get("excerpt"), str)
        and _valid_score(citation.get("score"))
        and (citation.get("page") is None or type(citation["page"]) is int)
        and (citation.get("section") is None or isinstance(citation["section"], str))
        and _valid_ocr_provenance(citation.get("ocr_provenance"))
    )


def _valid_response(data) -> bool:
    return (
        isinstance(data, dict)
        and _valid_uuid(data.get("response_id"))
        and isinstance(data.get("question"), str)
        and isinstance(data.get("answer"), str)
        and isinstance(data.get("answer_basis"), str)
        and data["answer_basis"] in {"sources", "general", "hybrid"}
        and type(data.get("grounded")) is bool
        and isinstance(data.get("sources"), list)
        and all(_valid_source(source) for source in data["sources"])
        and isinstance(data.get("citations"), list)
        and all(_valid_citation(citation) for citation in data["citations"])
    )


class NexoraAdapter:
    def __init__(self, base_url: str, token: str, timeout_seconds: float = 60):
        base = base_url.rstrip("/")
        parsed = urlsplit(base)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
            raise ValueError("base_url must be an origin without credentials, path or query")
        if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1", "::1"):
            raise ValueError("Remote Nexora connections require HTTPS")
        if not isinstance(timeout_seconds, (int, float)) or isinstance(timeout_seconds, bool) or not math.isfinite(timeout_seconds) or timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive and finite")
        if not isinstance(token, str) or not token.strip():
            raise ValueError("NEXORA_TOKEN is required")
        self.url = base + "/api/v1/rag/answer"
        self.token = token.strip()
        self.timeout_seconds = timeout_seconds
        self.opener = build_opener(NoRedirect())

    def redact(self, value):
        """Mask the exact bearer token anywhere in a report or export value."""
        return _redact_secret(value, self.token)

    def answer(self, case: TestCase, request: JsonObject) -> RagResponse:
        validate_request({key: value for key, value in request.items() if key != "question"})
        safe_request = self.redact(request)
        req = Request(
            self.url,
            data=json.dumps(safe_request, ensure_ascii=False).encode("utf-8"),
            headers={
                "Authorization": "Bearer " + self.token,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with self.opener.open(req, timeout=self.timeout_seconds) as response:
                data = json.load(response)
        except HTTPError as exc:
            # Never read or persist upstream error bodies; they can echo credentials.
            status_code = exc.code
            retry_after = _retry_after_seconds(exc.headers.get("Retry-After")) if status_code == 429 else None
            exc.close()
            if status_code == 401:
                raise AdapterError("authentication_error", status_code) from None
            if status_code == 403:
                raise AdapterError("authorization_error", status_code) from None
            if status_code == 429:
                raise AdapterError("rate_limited", status_code, retry_after) from None
            raise AdapterError("http_error", status_code) from None
        except IncompleteRead:
            raise AdapterError("incomplete_response") from None
        except (socket.timeout, TimeoutError):
            raise AdapterError("timeout_error") from None
        except URLError as exc:
            if isinstance(exc.reason, (socket.timeout, TimeoutError)):
                raise AdapterError("timeout_error") from None
            raise AdapterError("transport_error") from None
        except (OSError, HTTPException):
            raise AdapterError("transport_error") from None
        except (ValueError, UnicodeError):
            raise AdapterError("invalid_json") from None

        if not _valid_response(data):
            raise AdapterError("invalid_response")
        safe_data = self.redact(data)
        return RagResponse(
            safe_data["answer"], safe_data["sources"], safe_data["citations"],
            safe_data["grounded"], safe_data,
        )
