"""Adapter for the verified Nexora v1 non-streaming RAG contract."""
import json
import os
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


class AdapterError(Exception):
    def __init__(self, kind, status=None):
        self.kind, self.status = kind, status
        super().__init__(kind)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class FixtureAdapter:
    def answer(self, case):
        return {"answer": case["reference_answer"], "sources": [], "citations": [],
                "grounded": bool(case["expected_document_ids"]), "answer_basis": "sources"}


class NexoraAdapter:
    def __init__(self, config):
        self.config = config
        base = config["base_url"].rstrip("/")
        parsed = urlsplit(base)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
            raise ValueError("base_url must be an origin without credentials, path or query")
        if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1", "::1"):
            raise ValueError("Remote Nexora connections require HTTPS")
        self.url = base + "/api/v1/rag/answer"
        self.token = os.environ.get("NEXORA_TOKEN")
        if not self.token:
            raise ValueError("NEXORA_TOKEN is required")
        self.opener = build_opener(NoRedirect())

    def answer(self, case):
        payload = {**self.config.get("request", {}), **case.get("request", {}), "question": case["question"]}
        req = Request(self.url, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                      headers={"Authorization": "Bearer " + self.token, "Content-Type": "application/json", "Accept": "application/json"}, method="POST")
        try:
            with self.opener.open(req, timeout=self.config.get("timeout_seconds", 60)) as response:
                data = json.load(response)
        except HTTPError as exc:
            # Do not persist remote error bodies or request headers: they may echo secrets.
            raise AdapterError("http_error", exc.code) from None
        except (URLError, TimeoutError, OSError, HTTPException):
            raise AdapterError("transport_error") from None
        except (ValueError, UnicodeError):
            raise AdapterError("invalid_json") from None
        if not isinstance(data, dict) or not isinstance(data.get("answer"), str) or not isinstance(data.get("sources"), list) or not isinstance(data.get("citations"), list) or not isinstance(data.get("grounded"), bool):
            raise AdapterError("invalid_response")
        return data
