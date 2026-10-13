import csv
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from http.client import IncompleteRead
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest.mock import patch

from nexolab.adapters import AdapterError, NexoraAdapter
from nexolab.runner import load_json, run, validate_suite

ROOT = Path(__file__).resolve().parents[1]


class Tests(unittest.TestCase):
    def test_fixture_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            output, errors = run(ROOT / 'datasets/persian.synthetic.json', ROOT / 'configs/fixture.json', directory)
            report = load_json(output / 'report.json')
            self.assertEqual(errors, 0)
            self.assertEqual(len(report['results']), 5)
            self.assertIn('finished_at', report)
            self.assertTrue(all(r['duration_ms'] >= 0 for r in report['results']))
            with (output / 'report.csv').open(encoding='utf-8-sig', newline='') as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(len(rows), 5)
            self.assertEqual(rows[0]['answer'], report['results'][0]['response']['answer'])
            self.assertEqual(rows[0]['answer_correct'], '')

    def test_validation(self):
        suite = load_json(ROOT / 'datasets/persian.synthetic.json')
        suite['cases'][0]['expected_document_ids'] = ['absent']
        with self.assertRaises(ValueError):
            validate_suite(suite)

    def test_http_contract_and_errors(self):
        captured = []
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_POST(self):
                payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                captured.append((self.path, self.headers.get('Authorization'), payload))
                if payload['question'] == 'خطا':
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(b'secret-echo')
                else:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(json.dumps({'answer':'پاسخ', 'sources':[{'content':'متن'}], 'citations':[], 'grounded':True}).encode())
        server = HTTPServer(('127.0.0.1', 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            with patch.dict(os.environ, {'NEXORA_TOKEN':'test-only-token'}):
                adapter = NexoraAdapter({'base_url':f'http://127.0.0.1:{server.server_port}', 'request':{'limit':5}})
                self.assertEqual(adapter.answer({'question':'پرسش', 'request':{'limit':2}})['answer'], 'پاسخ')
                self.assertEqual(captured[0], ('/api/v1/rag/answer', 'Bearer test-only-token', {'limit':2, 'question':'پرسش'}))
                with self.assertRaises(AdapterError) as context:
                    adapter.answer({'question':'خطا'})
                self.assertEqual(context.exception.status, 401)
                self.assertNotIn('secret', str(context.exception))
        finally:
            server.shutdown()
            server.server_close()
            worker.join()

    def test_continue_after_case_error(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch('nexolab.runner.FixtureAdapter.answer', side_effect=AdapterError('transport_error')):
                output, errors = run(ROOT / 'datasets/persian.synthetic.json', ROOT / 'configs/fixture.json', directory)
            self.assertEqual(errors, 5)
            self.assertEqual(len(load_json(output / 'report.json')['results']), 5)

    def test_credentials_rejected_in_config(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / 'config.json'
            config.write_text('{"adapter":"fixture","token":"secret"}')
            with self.assertRaises(ValueError):
                run(ROOT / 'datasets/persian.synthetic.json', config, directory)

    def test_invalid_response(self):
        with patch.dict(os.environ, {'NEXORA_TOKEN':'test-only-token'}):
            adapter = NexoraAdapter({'base_url':'http://localhost:8000'})
            with patch.object(adapter.opener, 'open') as mock:
                mock.return_value.__enter__.return_value.read.return_value = b'{"answer":"x"}'
                with self.assertRaises(AdapterError):
                    adapter.answer({'question':'پرسش'})

    def test_incomplete_response(self):
        with patch.dict(os.environ, {'NEXORA_TOKEN':'test-only-token'}):
            adapter = NexoraAdapter({'base_url':'http://localhost:8000'})
            with patch.object(adapter.opener, 'open', side_effect=IncompleteRead(b'partial')):
                with self.assertRaises(AdapterError) as context:
                    adapter.answer({'question':'پرسش'})
                self.assertEqual(context.exception.kind, 'transport_error')

    def test_invalid_suite_shapes(self):
        for suite in (None, [], {'schema_version':1, 'cases':['bad']}, {'schema_version':1, 'cases':[{'id':'a'}], 'documents':['bad']}):
            with self.assertRaises(ValueError):
                validate_suite(suite)


if __name__ == '__main__':
    unittest.main()
