"""Loopback-only HTTP adapter; no credentials or arbitrary file paths from clients."""
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from .service import RunBusyError


def make_server(service, suite, adapter_name, ui_directory, port=8013):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ui_directory), **kwargs)

        def log_message(self, *args):
            pass

        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def reject(self, error):
            # Drain small bodies before closing so Windows does not reset the response.
            length = self.headers.get("Content-Length", "0")
            if self.command in {"POST", "PUT"} and length.isdigit() and int(length) <= 65536:
                self.rfile.read(int(length))
            self.reply(403, {"error": error})

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'")
            super().end_headers()

        def allowed(self, mutation=False):
            expected = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host") != expected:
                self.reject("invalid_host")
                return False
            origin = self.headers.get("Origin")
            if origin and origin != f"http://{expected}":
                self.reject("invalid_origin")
                return False
            if mutation and self.headers.get("X-NexoLab-Request") != "1":
                self.reject("request_header_required")
                return False
            return True

        def reply(self, status, data):
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if not self.allowed():
                return
            path = urlsplit(self.path).path
            try:
                if path == "/api/info":
                    return self.reply(200, {"suite": suite, "adapter": adapter_name})
                if path == "/api/runs":
                    return self.reply(200, service.list_runs())
                parts = path.strip("/").split("/")
                if len(parts) in (3, 4) and parts[:2] == ["api", "runs"]:
                    run_id = parts[2]
                    data = service.read(run_id)
                    if len(parts) == 3:
                        return self.reply(200, data)
                    filename = parts[3]
                    if filename == "reviews.json":
                        return self.reply(200, {"schema_version": 1, "run_id": run_id, "reviews": data["reviews"]})
                    if filename not in {"report.json", "report.csv"}:
                        raise FileNotFoundError()
                    if filename == "report.csv" and data["state"] != "completed":
                        raise FileNotFoundError()
                    file = service.directory(run_id) / filename
                    with service.lock:
                        body = file.read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json" if filename.endswith("json") else "text/csv; charset=utf-8")
                    self.send_header("Content-Disposition", f'attachment; filename="{run_id}-{filename}"')
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    return self.wfile.write(body)
                if path.startswith("/api/"):
                    raise FileNotFoundError()
                # Serve assets only from the UI directory, never directory listings or dotfiles.
                relative = path.lstrip("/") or "index.html"
                target = Path(ui_directory) / relative
                if any(part.startswith(".") for part in Path(relative).parts) or not target.resolve().is_relative_to(Path(ui_directory).resolve()) or not target.is_file():
                    raise FileNotFoundError()
                return super().do_GET()
            except FileNotFoundError:
                self.reply(404, {"error": "not_found"})
            except ValueError:
                self.reply(400, {"error": "invalid_request"})
            except OSError:
                self.reply(500, {"error": "storage_error"})

        def body(self):
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 65536 or self.headers.get_content_type() != "application/json":
                raise ValueError("Invalid body")
            return json.loads(self.rfile.read(length))

        def do_POST(self):
            if not self.allowed(mutation=True):
                return
            try:
                if self.path != "/api/runs":
                    return self.reply(404, {"error": "not_found"})
                if self.body() != {}:
                    raise ValueError("Runs use server configuration only")
                self.reply(202, {"run_id": service.start()})
            except RunBusyError:
                self.reply(409, {"error": "run_in_progress"})
            except (ValueError, KeyError, TypeError):
                self.reply(400, {"error": "invalid_configuration_or_request"})
            except OSError:
                self.reply(500, {"error": "storage_error"})

        def do_PUT(self):
            if not self.allowed(mutation=True):
                return
            try:
                parts = self.path.strip("/").split("/")
                if len(parts) != 5 or parts[:2] != ["api", "runs"] or parts[3] != "reviews":
                    return self.reply(404, {"error": "not_found"})
                self.reply(200, service.save_review(parts[2], unquote(parts[4]), self.body()))
            except FileNotFoundError:
                self.reply(404, {"error": "not_found"})
            except (ValueError, KeyError, TypeError):
                self.reply(400, {"error": "invalid_review"})
            except OSError:
                self.reply(500, {"error": "storage_error"})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)
