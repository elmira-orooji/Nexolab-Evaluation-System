import json
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from ...domain.errors import AdapterError
from ...domain.models import JsonObject, TestCase, RagResponse
from .nexora_validation import validate_request


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class NexoraAdapter:
    def __init__(self, base_url: str, token: str, timeout_seconds: float = 60):
        self.timeout_seconds = timeout_seconds
        base = base_url.rstrip("/")
        parsed = urlsplit(base)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
            raise ValueError("base_url must be an origin without credentials, path or query")
        if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1", "::1"):
            raise ValueError("Remote Nexora connections require HTTPS")
        self.url = base + "/api/v1/rag/answer"
        self.token = token
        if not self.token:
            raise ValueError("NEXORA_TOKEN is required")
        self.opener = build_opener(NoRedirect())

    def answer(self, case: TestCase, request: JsonObject) -> RagResponse:
        validate_request({key: value for key, value in request.items() if key != "question"})
        payload = request
        req = Request(self.url, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                      headers={"Authorization": "Bearer " + self.token, "Content-Type": "application/json", "Accept": "application/json"}, method="POST")
        try:
            with self.opener.open(req, timeout=self.timeout_seconds) as response:
                data = json.load(response)
        except HTTPError as exc:
            # Do not persist remote error bodies or request headers: they may echo secrets.
            status = exc.code
            exc.close()
            raise AdapterError("http_error", status) from None
        except (URLError, TimeoutError, OSError, HTTPException):
            raise AdapterError("transport_error") from None
        except (ValueError, UnicodeError):
            raise AdapterError("invalid_json") from None
        if not isinstance(data, dict) or not isinstance(data.get("answer"), str) or not isinstance(data.get("sources"), list) or not isinstance(data.get("citations"), list) or not isinstance(data.get("grounded"), bool):
            raise AdapterError("invalid_response")
        if not all(isinstance(item, dict) for item in data["sources"] + data["citations"]):
            raise AdapterError("invalid_response")
        return RagResponse(data["answer"], data["sources"], data["citations"], data["grounded"], data)
