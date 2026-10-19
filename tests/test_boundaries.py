import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from nexolab.adapters.rag.nexora_validation import validate_request
from nexolab.adapters.reports.json_store import JsonRunStore
from nexolab.bootstrap import PreparedRun
from nexolab.domain.models import EvaluationRun, EvaluationSuite

ROOT = Path(__file__).resolve().parents[1]


class BoundaryTests(unittest.TestCase):
    def test_readable_report_skips_malformed_historical_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            malformed = ("[]", "null", '{"settings":null,"results":[]}',
                         '{"settings":{},"results":[null]}',
                         '{"settings":{},"results":[{"case_id":[]}]}')
            for index, content in enumerate(malformed):
                candidate = root / str(index)
                candidate.mkdir()
                (candidate / "report.json").write_text(content, encoding="utf-8")
                (candidate / "report.csv").write_text("case_id\n", encoding="utf-8")
            prepared = PreparedRun(None, None, None, root / "current")
            current = {"started_at": "2026-10-20T12:00:00+00:00", "suite_sha256": "suite",
                       "settings": {"adapter": "fixture"}}
            self.assertIsNone(prepared._previous_report(current))

    def test_nexora_rejects_invalid_service_options(self):
        for request in ({"limit": 9}, {"top_k": 5}, {"document_id": 123}, {"document_ids": [123]}):
            with self.assertRaises(ValueError):
                validate_request(request)

    def test_failed_checkpoint_preserves_previous_report(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "report.json"
            run = EvaluationRun("id", "start", "version", "hash", {}, EvaluationSuite((), {}))
            store = JsonRunStore(path)
            store.save(run)
            before = path.read_bytes()
            run.finished_at = "finished"
            with patch.object(Path, "write_text", side_effect=OSError("disk full")):
                with self.assertRaises(OSError):
                    store.save(run)
            self.assertEqual(path.read_bytes(), before)

    def test_cli_produces_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            completed = subprocess.run([
                sys.executable, "-m", "nexolab", "--suite", str(ROOT / "datasets/persian.synthetic.json"),
                "--config", str(ROOT / "configs/fixture.json"), "--output", directory,
            ], capture_output=True, text=True)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            output = Path(json.loads(completed.stdout)["output"])
            self.assertTrue((output / "report.csv").exists())
            report = json.loads((output / "report.json").read_text(encoding="utf-8"))
            self.assertEqual(len(report["results"]), 5)
            self.assertIn("raw_response", report["results"][0])
            self.assertEqual(len(report["suite_sha256"]), 64)
            self.assertEqual(len(report["provenance"]["config_sha256"]), 64)
            self.assertNotIn("token", json.dumps(report).lower())
