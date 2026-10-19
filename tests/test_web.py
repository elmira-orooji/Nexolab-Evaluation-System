import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
import os
import shutil
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

from nexolab.adapters.web.server import make_server
from nexolab.adapters.web.service import EvaluationService, RunBusyError
from nexolab.adapters.datasets.json_loader import load_suite
from nexolab.adapters.datasets.json_repository import JsonSuiteRepository
from nexolab.bootstrap import prepare_run

ROOT = Path(__file__).resolve().parents[1]
SUITE = ROOT / "datasets/persian.synthetic.json"
CONFIG = ROOT / "configs/fixture.json"


class WebTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.suite_root = Path(self.temporary.name) / "datasets"
        self.suite_root.mkdir()
        shutil.copyfile(SUITE, self.suite_root / SUITE.name)
        repository = JsonSuiteRepository(self.suite_root)
        self.service = EvaluationService(Path(self.temporary.name) / "runs",
                                         lambda selected_path: prepare_run(selected_path, CONFIG, Path(self.temporary.name) / "runs"),
                                         repository, SUITE.stem)
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
        readable = self.request(f"/api/runs/{run_id}/report.md")[1].decode("utf-8")
        self.assertIn("گزارش اجرای ارزیابی", readable)
        self.assertIn("بدون منبع یا استناد", readable)
        report_file = Path(self.temporary.name) / "runs" / run_id / "report.json"
        original = report_file.read_bytes()
        review = {"correctness": 4, "relevance": 3, "source_adequacy": 2,
                  "citation_quality": 1, "reviewer": "ارزیاب یک", "notes": "بررسی دستی"}
        saved = json.loads(self.request(f"/api/runs/{run_id}/reviews/fa-001", review, "PUT")[1])
        self.assertEqual(report_file.read_bytes(), original)
        reloaded = EvaluationService(Path(self.temporary.name) / "runs", self.service.prepare)
        self.assertEqual(reloaded.read(run_id)["reviews"]["fa-001"]["notes"], "بررسی دستی")
        self.assertEqual(len(reloaded.read(run_id)["review_history"]["fa-001"]), 1)
        self.assertEqual(saved["reviews"]["fa-001"]["reviewer"], "ارزیاب یک")
        self.request(f"/api/runs/{run_id}/reviews/fa-001", {**review, "correctness": 2}, "PUT")
        _, body = self.request(f"/api/runs/{run_id}/reviews.json")
        self.assertEqual(json.loads(body)["run_id"], run_id)
        self.assertEqual(len(json.loads(body)["history"]["fa-001"]), 2)
        self.assertEqual([event["revision"] for event in json.loads(body)["history"]["fa-001"]], [1, 2])
        self.assertIn(b'case_id', self.request(f"/api/runs/{run_id}/report.csv")[1])
        self.request(f"/api/runs/{run_id}/reviews/fa-001", None, "PUT")
        self.assertEqual(self.service.read(run_id)["reviews"], {})
        events = self.service.read(run_id)["review_history"]["fa-001"]
        self.assertEqual(len(events), 3)
        self.assertEqual(events[-1]["action"], "cleared")
        self.assertEqual(events[-1]["revision"], 3)
        self.assertEqual(len(json.loads(self.request('/api/runs')[1])), 1)
        second_id = self.service.start()
        second = self.wait_run(second_id)
        self.assertEqual(second["state"], "completed")
        second_summary = (Path(self.temporary.name) / "runs" / second_id / "report.md").read_text(encoding="utf-8")
        self.assertIn(run_id, second_summary)
        self.assertIn("پاسخ‌های تغییرکرده", second_summary)
        comparison = json.loads(self.request(f"/api/compare?baseline={run_id}&candidate={second_id}")[1])
        self.assertTrue(comparison["same_suite"])
        self.assertTrue(comparison["same_config"])
        self.assertEqual(comparison["shared_case_count"], 5)
        self.assertEqual(len(comparison["cases"]), 5)

    def test_compare_requires_two_valid_completed_runs(self):
        with self.assertRaises(ValueError):
            self.service.compare("not-a-uuid", "also-invalid")
        run_id = self.service.start()
        self.assertEqual(self.wait_run(run_id)["state"], "completed")
        with self.assertRaises(ValueError):
            self.service.compare(run_id, "not-a-uuid")

    def test_suite_validation_and_crud_select_the_next_run(self):
        listed = json.loads(self.request("/api/suites")[1])
        self.assertTrue(any(item["suite_key"] == SUITE.stem and item["active"] for item in listed))
        source = json.loads(SUITE.read_text(encoding="utf-8"))
        invalid = json.loads(json.dumps(source))
        invalid["cases"][1]["id"] = invalid["cases"][0]["id"]
        invalid["cases"][1]["question"] = " "
        diagnostics = json.loads(self.request("/api/suites/validate", invalid, "POST")[1])
        codes = {item["code"] for item in diagnostics["errors"]}
        self.assertFalse(diagnostics["valid"])
        self.assertIn("duplicate_case_id", codes)
        self.assertIn("invalid_question", codes)

        created = json.loads(json.dumps(source))
        created["id"] = "managed-suite"
        created["version"] = "1.1.0"
        status, body = self.request("/api/suites", created, "POST")
        self.assertEqual(status, 201)
        self.assertEqual(json.loads(body)["suite_key"], "managed-suite")
        saved = json.loads(self.request("/api/suites/managed-suite")[1])
        self.assertEqual(saved["version"], "1.1.0")
        saved["description"] = "ویرایش‌شده"
        self.assertEqual(self.request("/api/suites/managed-suite", saved, "PUT")[0], 200)
        selected = json.loads(self.request("/api/suites/select", {"suite_key": "managed-suite"}, "POST")[1])
        self.assertEqual(selected["suite"]["description"], "ویرایش‌شده")
        run_id = json.loads(self.request("/api/runs", {}, "POST")[1])["run_id"]
        run = self.wait_run(run_id)["report"]
        self.assertEqual(run["suite"]["id"], "managed-suite")
        self.assertEqual(run["suite"]["version"], "1.1.0")

    def test_duplicate_suite_ids_across_files_are_reported_and_unselectable(self):
        alias = self.suite_root / "alias.json"
        shutil.copyfile(SUITE, alias)
        listed = json.loads(self.request("/api/suites")[1])
        duplicates = [item for item in listed if item["id"] == "persian-synthetic-v1"]
        self.assertEqual(len(duplicates), 2)
        self.assertTrue(all(not item["valid"] for item in duplicates))
        self.assertTrue(all(any(error["code"] == "duplicate_suite_id" for error in item["errors"]) for item in duplicates))
        with self.assertRaises(HTTPError) as context:
            self.request("/api/suites/select", {"suite_key": SUITE.stem}, "POST")
        self.assertEqual(context.exception.code, 422)
        context.exception.close()

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
        valid = {"correctness": 4, "relevance": 4, "source_adequacy": 3,
                 "citation_quality": 2, "reviewer": "ارزیاب", "notes": ""}
        self.service.save_review(first, 'fa-001', valid)
        self.assertEqual(self.service.read(second)["reviews"], {})

    def test_review_dimensions_and_reviewer_are_validated(self):
        run_id = self.service.start(); self.wait_run(run_id)
        valid = {"correctness": 4, "relevance": 4, "source_adequacy": 3,
                 "citation_quality": 2, "reviewer": "ارزیاب", "notes": ""}
        for key, value in (("correctness", 5), ("relevance", True), ("source_adequacy", 0),
                           ("citation_quality", "4"), ("reviewer", "  ")):
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                self.service.save_review(run_id, 'fa-001', {**valid, key: value})

    def test_worker_failure_and_busy_state(self):
        gate = threading.Event()
        original = self.service.prepare
        def prepare(suite_path):
            prepared = original(suite_path)
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
        suite_path = self.suite_root / SUITE.name
        suite = json.loads(suite_path.read_text(encoding="utf-8"))
        suite["cases"][0]["question"] = "پرسش محرمانه test-session-secret برای ماسک"
        suite_path.write_text(json.dumps(suite, ensure_ascii=False), encoding="utf-8")
        class Nexora(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_POST(self):
                payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                requests.append((self.path, self.headers['Authorization'], payload))
                self.send_response(200)
                self.end_headers()
                chunk_id = 'a8599eb2-0474-4317-b2ad-77011f071bf5'
                response = {'response_id': chunk_id, 'question': payload['question'],
                            'answer': 'actual upstream answer test-session-secret', 'answer_basis': 'sources',
                            'sources': [{'chunk_id': chunk_id, 'document_id': chunk_id,
                                         'filename': 'source.txt', 'chunk_index': 0,
                                         'content': 'evidence', 'score': 0.9}],
                            'citations': [], 'grounded': True}
                self.wfile.write(json.dumps(response).encode())
        upstream = HTTPServer(('127.0.0.1', 0), Nexora)
        thread = threading.Thread(target=upstream.serve_forever, daemon=True); thread.start()
        config = Path(self.temporary.name) / 'nexora.json'
        config.write_text(json.dumps({'adapter': 'nexora', 'base_url': f'http://127.0.0.1:{upstream.server_port}', 'request': {'limit': 2}}))
        self.service.prepare = lambda suite_path: prepare_run(suite_path, config, Path(self.temporary.name) / "runs")
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
            self.assertIn('[REDACTED]', json.dumps(result['report']))
            csv_report = self.request(f"/api/runs/{run_id}/report.csv")[1]
            self.assertNotIn(b'test-session-secret', csv_report)
            self.assertIn(b'[REDACTED]', csv_report)
            self.assertEqual(len(result['report']['provenance']['config_sha256']), 64)
            self.assertNotIn('test-session-secret', json.dumps(result['report']['provenance']))
        finally:
            upstream.shutdown(); upstream.server_close(); thread.join()
