"""FastAPI application for the authenticated local evaluation panel."""
from __future__ import annotations

import time
import base64
import binascii
import struct
import zlib
from collections import defaultdict, deque
from pathlib import Path
from threading import Lock
from urllib.parse import unquote

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..datasets.json_loader import SuiteValidationError
from .auth import AuthStore
from .service import RunBusyError


class ConnectionBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    adapter: str = Field(max_length=20)
    base_url: str = Field(max_length=2048)
    api_token: str = Field(default="", max_length=4096)

class LoginBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=1024)
    remember: bool = False


class AvatarBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    image: str = Field(max_length=350_000)


def decode_avatar(encoded: str) -> bytes:
    """Accept the small, non-interlaced RGB/RGBA PNG produced by the photo editor."""
    image = base64.b64decode(encoded, validate=True)
    if len(image) < 33 or len(image) > 262_144 or image[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("invalid PNG")
    offset, chunks, ended = 8, [], False
    while offset + 12 <= len(image):
        size = struct.unpack(">I", image[offset:offset + 4])[0]
        kind = image[offset + 4:offset + 8]
        end = offset + 8 + size
        if end + 4 > len(image) or binascii.crc32(image[offset + 4:end]) != struct.unpack(">I", image[end:end + 4])[0]:
            raise ValueError("invalid chunk")
        if offset == 8:
            if kind != b"IHDR" or size != 13:
                raise ValueError("missing header")
            width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", image[offset + 8:end])
            if not (1 <= width <= 256 and 1 <= height <= 256) or depth != 8 or color not in (2, 6) or compression or filtering or interlace:
                raise ValueError("unsupported image")
        if kind == b"IDAT":
            chunks.append(image[offset + 8:end])
        offset = end + 4
        if kind == b"IEND":
            ended = size == 0 and offset == len(image)
            break
    if not ended or not chunks:
        raise ValueError("incomplete image")
    stride = width * (4 if color == 6 else 3) + 1
    decoder = zlib.decompressobj()
    pixels = decoder.decompress(b"".join(chunks), stride * height + 1)
    if not decoder.eof or decoder.unused_data or len(pixels) != stride * height or any(pixels[row * stride] > 4 for row in range(height)):
        raise ValueError("invalid pixels")
    return image


class LoginThrottle:
    def __init__(self):
        self._lock = Lock()
        self._failures: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    def allowed(self, address: str, username: str) -> bool:
        now = time.monotonic()
        keys = ((address, "*"), (address, username.strip().casefold()))
        with self._lock:
            for key in keys:
                attempts = self._failures[key]
                while attempts and attempts[0] <= now - 900:
                    attempts.popleft()
                if len(attempts) >= 8:
                    return False
            return True

    def failed(self, address: str, username: str):
        with self._lock:
            now = time.monotonic()
            self._failures[(address, "*")].append(now)
            self._failures[(address, username.strip().casefold())].append(now)

    def succeeded(self, address: str, username: str):
        with self._lock:
            self._failures.pop((address, "*"), None)
            self._failures.pop((address, username.strip().casefold()), None)


def create_app(service, suite, adapter_name, ui_directory, port, auth_store: AuthStore):
    ui_root = Path(ui_directory).resolve()
    expected_host = f"127.0.0.1:{port}"
    expected_origin = f"http://{expected_host}"
    throttle = LoginThrottle()
    app = FastAPI(title="NexoLab API", docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def secure_local_requests(request: Request, call_next):
        if request.headers.get("host") != expected_host:
            return JSONResponse({"error": "invalid_host"}, status_code=403)
        origin = request.headers.get("origin")
        if origin and origin != expected_origin:
            return JSONResponse({"error": "invalid_origin"}, status_code=403)
        path = request.url.path
        mutation = request.method in {"POST", "PUT", "PATCH", "DELETE"}
        if mutation and request.headers.get("x-nexolab-request") != "1":
            return JSONResponse({"error": "request_header_required"}, status_code=403)
        try:
            content_length = int(request.headers.get("content-length", "0"))
        except ValueError:
            return JSONResponse({"error": "invalid_request"}, status_code=400)
        limit = 2_000_000 if path in {"/api/suites", "/api/suites/validate"} else 360_000 if path == "/api/profile/avatar" else 65_536
        if content_length > limit:
            return JSONResponse({"error": "request_too_large"}, status_code=413)

        public_auth_paths = {
            "/api/auth/login", "/api/auth/session", "/api/auth/logout",
        }
        if path.startswith("/api/") and path not in public_auth_paths:
            user = auth_store.get_session_user(request.cookies.get(AuthStore.SESSION_COOKIE))
            if not user or user["role"] != "admin":
                return JSONResponse({"error": "authentication_required"}, status_code=401)
            request.state.user = user

        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; "
            "script-src 'self'; frame-ancestors 'none'; base-uri 'none'"
        )
        response.headers["Referrer-Policy"] = "same-origin"
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request: Request, exc: StarletteHTTPException):
        error = exc.detail if isinstance(exc.detail, str) else "invalid_request"
        return JSONResponse({"error": error}, status_code=exc.status_code, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, _exc: RequestValidationError):
        return JSONResponse({"error": "invalid_request"}, status_code=400)

    @app.exception_handler(FileNotFoundError)
    async def missing_resource(_request: Request, _exc: FileNotFoundError):
        return JSONResponse({"error": "not_found"}, status_code=404)

    @app.exception_handler(SuiteValidationError)
    async def invalid_suite(_request: Request, exc: SuiteValidationError):
        return JSONResponse({"valid": False, "errors": exc.errors, "warnings": exc.warnings}, status_code=422)

    @app.exception_handler(RunBusyError)
    async def busy_run(_request: Request, _exc: RunBusyError):
        return JSONResponse({"error": "run_in_progress"}, status_code=409)

    @app.exception_handler(OSError)
    async def storage_error(_request: Request, _exc: OSError):
        return JSONResponse({"error": "storage_error"}, status_code=500)

    @app.get("/api/auth/session")
    def session(request: Request):
        user = auth_store.get_session_user(request.cookies.get(AuthStore.SESSION_COOKIE))
        if not user or user["role"] != "admin":
            return {"authenticated": False, "user": None}
        return {"authenticated": True, "user": {"username": user["username"], "role": user["role"]}}

    @app.get("/api/profile")
    def profile(request: Request):
        return {"has_avatar": auth_store.get_avatar(request.state.user["id"]) is not None}

    @app.get("/api/profile/avatar")
    def avatar(request: Request):
        image = auth_store.get_avatar(request.state.user["id"])
        if image is None:
            raise HTTPException(404, "not_found")
        return Response(content=image, media_type="image/png")

    @app.put("/api/profile/avatar")
    def save_avatar(body: AvatarBody, request: Request):
        try:
            image = decode_avatar(body.image)
        except (ValueError, binascii.Error, struct.error, zlib.error):
            raise HTTPException(400, "invalid_avatar") from None
        auth_store.set_avatar(request.state.user["id"], image)
        return {"has_avatar": True}

    @app.delete("/api/profile/avatar")
    def delete_avatar(request: Request):
        auth_store.set_avatar(request.state.user["id"], None)
        return {"has_avatar": False}

    @app.post("/api/auth/login")
    def login(body: LoginBody, request: Request, response: Response):
        address = request.client.host if request.client else "unknown"
        if not throttle.allowed(address, body.username):
            return JSONResponse({"error": "too_many_attempts"}, status_code=429)
        user = auth_store.authenticate(body.username, body.password)
        if not user or user["role"] != "admin":
            throttle.failed(address, body.username)
            return JSONResponse({"error": "invalid_credentials"}, status_code=401)
        throttle.succeeded(address, body.username)
        token, ttl = auth_store.create_session(user["id"], body.remember)
        response.set_cookie(
            key=AuthStore.SESSION_COOKIE,
            value=token,
            max_age=ttl if body.remember else None,
            path="/",
            httponly=True,
            secure=False,  # The CLI server binds to loopback over HTTP.
            samesite="lax",
        )
        return {"authenticated": True, "user": {"username": user["username"], "role": user["role"]}}

    @app.post("/api/auth/logout")
    def logout(request: Request, response: Response):
        auth_store.revoke_session(request.cookies.get(AuthStore.SESSION_COOKIE))
        response.delete_cookie(AuthStore.SESSION_COOKIE, path="/", httponly=True, samesite="lax")
        return {"authenticated": False}

    @app.get("/api/connection")
    def connection_status():
        return service.connection_status()

    @app.put("/api/connection")
    def update_connection(body: ConnectionBody):
        try:
            return service.update_connection(body.adapter, body.base_url, body.api_token)
        except ValueError:
            raise HTTPException(400, "invalid_connection") from None
    @app.get("/api/info")
    def info():
        current = service.suite_snapshot()
        return {"suite": current["suite"] if current else suite,
                "suite_key": current["suite_key"] if current else None,
                "adapter": adapter_name}

    @app.get("/api/suites")
    def list_suites():
        return service.list_suites()

    @app.get("/api/suites/template")
    def suite_template():
        if service.suite_repository is None:
            raise FileNotFoundError()
        return service.suite_repository.template()

    @app.get("/api/suites/{suite_key}")
    def read_suite(suite_key: str):
        if not suite_key or "/" in suite_key or "\\" in suite_key or suite_key == "select":
            raise FileNotFoundError()
        return service.read_suite(unquote(suite_key))

    @app.get("/api/runs")
    def list_runs():
        return service.list_runs()

    @app.get("/api/compare")
    def compare(baseline: str, candidate: str):
        if not baseline or not candidate:
            raise HTTPException(400, "invalid_request")
        return service.compare(baseline, candidate)

    @app.get("/api/runs/{run_id}/reviews.json")
    def review_history(run_id: str):
        data = service.read(run_id)
        return {"schema_version": 2, "run_id": run_id,
                "reviews": data["reviews"], "history": data["review_history"]}

    @app.get("/api/runs/{run_id}/{filename}")
    def download_report(run_id: str, filename: str):
        if filename not in {"report.json", "report.csv", "report.md"}:
            raise FileNotFoundError()
        data = service.read(run_id)
        if filename == "report.csv" and data["state"] != "completed":
            raise FileNotFoundError()
        content_type = (
            "application/json" if filename.endswith(".json") else
            "text/markdown; charset=utf-8" if filename.endswith(".md") else
            "text/csv; charset=utf-8"
        )
        return FileResponse(
            service.directory(run_id) / filename,
            media_type=content_type,
            filename=f"{run_id}-{filename}",
        )

    @app.get("/api/runs/{run_id}")
    def read_run(run_id: str):
        return service.read(run_id)

    @app.post("/api/suites/validate")
    def validate_suite(payload: dict = Body(...)):
        return service.validate_suite(payload)

    @app.post("/api/suites/select")
    def select_suite(payload: dict = Body(...)):
        if set(payload) != {"suite_key"}:
            raise HTTPException(400, "invalid_request")
        return service.select_suite(payload["suite_key"])

    @app.post("/api/suites", status_code=201)
    def create_suite(payload: dict = Body(...)):
        diagnostics = service.validate_suite(payload)
        if not diagnostics["valid"]:
            return JSONResponse(diagnostics, status_code=422)
        return {"suite_key": service.create_suite(payload)}

    @app.post("/api/runs", status_code=202)
    def start_run(payload: dict = Body(...)):
        if payload != {}:
            raise HTTPException(400, "invalid_configuration_or_request")
        return {"run_id": service.start()}

    @app.put("/api/suites/{suite_key}")
    def update_suite(suite_key: str, payload: dict = Body(...)):
        diagnostics = service.validate_suite(payload)
        if not diagnostics["valid"]:
            return JSONResponse(diagnostics, status_code=422)
        return {"suite_key": service.update_suite(unquote(suite_key), payload)}

    @app.put("/api/runs/{run_id}/reviews/{case_id}")
    def save_review(run_id: str, case_id: str, payload: dict | None = Body(...)):
        service.save_review(run_id, unquote(case_id), payload)
        saved = service.read(run_id)
        return {"reviews": saved["reviews"], "review_history": saved["review_history"]}

    @app.get("/{path:path}")
    def static_file(path: str):
        if path.startswith("api/"):
            raise FileNotFoundError()
        relative = path or "index.html"
        if any(part.startswith(".") for part in Path(relative).parts):
            raise FileNotFoundError()
        target = (ui_root / relative).resolve()
        if not target.is_relative_to(ui_root) or not target.is_file():
            raise FileNotFoundError()
        return FileResponse(target)

    return app
