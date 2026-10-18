import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

from nexolab.adapters.web.server import make_server
from nexolab.adapters.web.service import EvaluationService, RunBusyError
from nexolab.adapters.datasets.json_loader import load_suite
from nexolab.bootstrap import prepare_run

ROOT = Path(__file__).resolve().parents[1]
SUITE = ROOT / "datasets/persian.synthetic.json"
CONFIG = ROOT / "configs/fixture.json"


class WebTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.service = EvaluationService(Path(self.temporary.name), lambda: prepare_run(SUITE, CONFIG, self.temporary.name))
        self.server = make_server(self.service, load_suite(SUITE).snapshot, "fixture", ROOT / "ui", 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temporary.cleanup()

    def request(self, path, body=None, method="GET", headers=None):
        request = Request(self.origin + path, method=method,
                          data=json.dumps(body).encode() if method != "GET" else None,
                          headers=headers if headers is not None else {"Content-Type": "application/json", "X-NexoLab-Request": "1"})
        with urlopen(request, timeout=5) as response:
            return response.status, response.read()

    def wait_run(self, run_id):
        for _ in range(100):
            data = self.service.read(run_id)
            if data["state"] != "running":
                return data
            time.sleep(.01)
        self.fail("Run did not finish")

    def test_execute_review_download_and_reload(self):
        status, body = self.request("/api/runs", {}, "POST")
        self.assertEqual(status, 202)
        run_id = json.loads(body)["run_id"]
        result = self.wait_run(run_id)
        self.assertEqual(result["state"], "completed")
        self.assertEqual(len(result["report"]["results"]), 5)
        report_file = Path(self.temporary.name) / run_id / "report.json"
        original = report_file.read_bytes()
        review = {"answer_correct": True, "sources_correct": False, "notes": "بررسی دستی"}
        self.request(f"/api/runs/{run_id}/reviews/fa-001", review, "PUT")
        self.assertEqual(report_file.read_bytes(), original)
        reloaded = EvaluationService(Path(self.temporary.name), self.service.prepare)
        self.assertEqual(reloaded.read(run_id)["reviews"]["fa-001"]["notes"], "بررسی دستی")
        _, body = self.request(f"/api/runs/{run_id}/reviews.json")
        self.assertEqual(json.loads(body)["run_id"], run_id)
        self.assertIn(b'case_id', self.request(f"/api/runs/{run_id}/report.csv")[1])
        self.request(f"/api/runs/{run_id}/reviews/fa-001", None, "PUT")
        self.assertEqual(self.service.read(run_id)["reviews"], {})
        self.assertEqual(len(json.loads(self.request('/api/runs')[1])), 1)

    def test_cross_origin_and_unmarked_mutation_rejected(self):
        for headers in ({"Content-Type": "application/json"},
                        {"Content-Type": "application/json", "X-NexoLab-Request": "1", "Origin": "https://untrusted.example"}):
            with self.assertRaises(HTTPError) as context:
                self.request('/api/runs', {}, 'POST', headers)
            self.assertEqual(context.exception.code, 403)
            context.exception.close()

    def test_arbitrary_config_and_paths_rejected(self):
        for path, body, method in [('/api/runs', {"config": "private.json"}, 'POST'),
                                   ('/api/runs/not-a-uuid', None, 'GET'),
                                   ('/../pyproject.toml', None, 'GET')]:
            with self.assertRaises(HTTPError) as context:
                self.request(path, body, method)
            self.assertIn(context.exception.code, (400, 404))
            context.exception.close()

    def test_bad_reviews_and_per_run_isolation(self):
        first = self.service.start(); self.wait_run(first)
        second = self.service.start(); self.wait_run(second)
        with self.assertRaises(ValueError):
            self.service.save_review(first, 'fa-001', {"answer_correct": "true"})
        self.service.save_review(first, 'fa-001', {"answer_correct": True, "sources_correct": True, "notes": ""})
        self.assertEqual(self.service.read(second)["reviews"], {})

    def test_worker_failure_and_busy_state(self):
        gate = threading.Event()
        original = self.service.prepare
        def prepare():
            prepared = original()
            def fail():
                gate.wait(2)
                raise OSError("private-token-value")
            prepared.execute = fail
            return prepared
        self.service.prepare = prepare
        run_id = self.service.start()
        with self.assertRaises(RunBusyError):
            self.service.start()
        gate.set()
        result = self.wait_run(run_id)
        self.assertEqual(result["state"], "failed")
        self.assertNotIn('private-token-value', json.dumps(result))

    def test_nexora_contract_through_web_execution(self):
        requests = []
        class Nexora(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_POST(self):
                payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                requests.append((self.path, self.headers['Authorization'], payload))
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps({'answer': 'actual upstream answer', 'sources': [{'filename': 'source.txt', 'content': 'evidence'}], 'citations': [], 'grounded': True}).encode())
        upstream = HTTPServer(('127.0.0.1', 0), Nexora)
        thread = threading.Thread(target=upstream.serve_forever, daemon=True); thread.start()
        config = Path(self.temporary.name) / 'nexora.json'
        config.write_text(json.dumps({'adapter': 'nexora', 'base_url': f'http://127.0.0.1:{upstream.server_port}', 'request': {'limit': 2}}))
        self.service.prepare = lambda: prepare_run(SUITE, config, self.temporary.name)
        try:
            with patch.dict(os.environ, {'NEXORA_TOKEN': 'test-session-secret'}):
                run_id = json.loads(self.request('/api/runs', {}, 'POST')[1])['run_id']
                result = self.wait_run(run_id)
            self.assertEqual(result['state'], 'completed')
            self.assertEqual(len(requests), 5)
            self.assertEqual(requests[0][0:2], ('/api/v1/rag/answer', 'Bearer test-session-secret'))
            self.assertEqual(requests[0][2]['limit'], 2)
            self.assertEqual(result['report']['results'][0]['response']['sources'][0]['content'], 'evidence')
            self.assertNotIn('test-session-secret', json.dumps(result))
        finally:
            upstream.shutdown(); upstream.server_close(); thread.join()
