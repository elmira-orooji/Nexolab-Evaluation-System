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

from nexolab.domain.errors import AdapterError
from nexolab.domain.models import CaseError, CaseResult, TestCase
from nexolab.adapters.rag.nexora import NexoraAdapter
from nexolab.runner import load_json, run, validate_suite

ROOT = Path(__file__).resolve().parents[1]


def valid_nexora_response(question="پرسش", answer="پاسخ"):
    chunk_id = "a8599eb2-0474-4317-b2ad-77011f071bf5"
    return {
        "response_id": chunk_id, "question": question, "answer": answer,
        "answer_basis": "sources", "grounded": True,
        "sources": [{"chunk_id": chunk_id, "document_id": chunk_id,
                     "filename": "policy.pdf", "chunk_index": 0,
                     "content": "شاهد", "score": 0.9}],
        "citations": [{"id": 1, "chunk_id": chunk_id, "document_id": chunk_id,
                       "filename": "policy.pdf", "chunk_index": 0,
                       "excerpt": "شاهد", "score": 0.9}],
    }


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
            self.assertEqual(rows[0]['category'], 'منابع انسانی')
            self.assertEqual(rows[0]['difficulty'], 'easy')
            self.assertIn('استخراج مستقیم', rows[0]['tags'])
            self.assertEqual(rows[0]['answer_correct'], '')

    def test_validation(self):
        suite = load_json(ROOT / 'datasets/persian.synthetic.json')
        suite['cases'][0]['expected_document_ids'] = ['absent']
        with self.assertRaises(ValueError):
            validate_suite(suite)

    def test_suite_inspection_collects_duplicate_and_incomplete_items(self):
        suite = load_json(ROOT / 'datasets/persian.synthetic.json')
        suite['cases'][1]['id'] = suite['cases'][0]['id']
        suite['cases'][1]['question'] = suite['cases'][0]['question']
        suite['cases'][2]['reference_answer'] = ''
        from nexolab.adapters.datasets.json_loader import inspect_suite
        diagnostics = inspect_suite(suite)
        errors = {item['code'] for item in diagnostics['errors']}
        warnings = {item['code'] for item in diagnostics['warnings']}
        self.assertFalse(diagnostics['valid'])
        self.assertIn('duplicate_case_id', errors)
        self.assertIn('missing_reference_answer', errors)
        self.assertIn('duplicate_question', warnings)

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
                elif payload['question'] == 'دسترسی':
                    self.send_response(403)
                    self.end_headers()
                elif payload['question'] == 'محدودیت':
                    self.send_response(429)
                    self.send_header('Retry-After', '17')
                    self.end_headers()
                else:
                    self.send_response(200)
                    self.end_headers()
                    answer = 'token=test-only-token' if payload['question'] == 'محرمانه' else 'پاسخ'
                    self.wfile.write(json.dumps(valid_nexora_response(payload['question'], answer)).encode())
        server = HTTPServer(('127.0.0.1', 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            with patch.dict(os.environ, {'NEXORA_TOKEN':'test-only-token'}):
                adapter = NexoraAdapter(f'http://127.0.0.1:{server.server_port}', 'test-only-token')
                self.assertEqual(adapter.answer(TestCase('a', 'پرسش', '', ()), {'question':'پرسش', 'limit':2}).answer, 'پاسخ')
                self.assertEqual(captured[0], ('/api/v1/rag/answer', 'Bearer test-only-token', {'limit':2, 'question':'پرسش'}))
                with self.assertRaises(AdapterError) as context:
                    adapter.answer(TestCase('a', 'خطا', '', ()), {'question':'خطا'})
                self.assertEqual(context.exception.kind, 'authentication_error')
                self.assertEqual(context.exception.status, 401)
                self.assertNotIn('secret', str(context.exception))
                with self.assertRaises(AdapterError) as context:
                    adapter.answer(TestCase('a', 'دسترسی', '', ()), {'question':'دسترسی'})
                self.assertEqual(context.exception.kind, 'authorization_error')
                with self.assertRaises(AdapterError) as context:
                    adapter.answer(TestCase('a', 'محدودیت', '', ()), {'question':'محدودیت'})
                self.assertEqual((context.exception.kind, context.exception.status,
                                  context.exception.retry_after_seconds), ('rate_limited', 429, 17.0))
                redacted = adapter.answer(TestCase('a', 'محرمانه', '', ()), {'question':'محرمانه'})
                self.assertNotIn('test-only-token', json.dumps(redacted.raw))
                self.assertIn('[REDACTED]', redacted.answer)
        finally:
            server.shutdown()
            server.server_close()
            worker.join()

    def test_continue_after_case_error(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch('nexolab.bootstrap.FixtureAdapter.answer', side_effect=AdapterError('transport_error')):
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
            adapter = NexoraAdapter('http://localhost:8000', 'test-only-token')
            with patch.object(adapter.opener, 'open') as mock:
                mock.return_value.__enter__.return_value.read.return_value = b'{"answer":"x"}'
                with self.assertRaises(AdapterError):
                    adapter.answer(TestCase('a', 'پرسش', '', ()), {'question':'پرسش'})

    def test_incomplete_response(self):
        with patch.dict(os.environ, {'NEXORA_TOKEN':'test-only-token'}):
            adapter = NexoraAdapter('http://localhost:8000', 'test-only-token')
            with patch.object(adapter.opener, 'open', side_effect=IncompleteRead(b'partial')):
                with self.assertRaises(AdapterError) as context:
                    adapter.answer(TestCase('a', 'پرسش', '', ()), {'question':'پرسش'})
                self.assertEqual(context.exception.kind, 'incomplete_response')

    def test_timeout_is_a_safe_case_error(self):
        adapter = NexoraAdapter('http://localhost:8000', 'test-only-token')
        with patch.object(adapter.opener, 'open', side_effect=TimeoutError('secret timeout detail')):
            with self.assertRaises(AdapterError) as context:
                adapter.answer(TestCase('a', 'پرسش', '', ()), {'question': 'پرسش'})
        self.assertEqual(context.exception.kind, 'timeout_error')
        self.assertNotIn('secret timeout detail', str(context.exception))

    def test_rate_limit_wait_hint_is_saved_in_the_report_record(self):
        result = CaseResult('a', 'پرسش', '2026-01-01T00:00:00+00:00', {}, 123.0,
                            None, CaseError('rate_limited', 429, 17.0))
        self.assertEqual(result.to_record()['error'], {
            'kind': 'rate_limited', 'http_status': 429, 'retry_after_seconds': 17.0,
        })

    def test_incomplete_contract_fields_are_rejected(self):
        adapter = NexoraAdapter('http://localhost:8000', 'test-only-token')
        for changes in ({'response_id': None}, {'answer_basis': 'unknown'},
                        {'sources': [{'filename': 'missing required fields'}]},
                        {'citations': [None]}):
            payload = {**valid_nexora_response(), **changes}
            with patch.object(adapter.opener, 'open') as mock:
                mock.return_value.__enter__.return_value.read.return_value = json.dumps(payload).encode()
                with self.subTest(changes=changes), self.assertRaises(AdapterError) as context:
                    adapter.answer(TestCase('a', 'پرسش', '', ()), {'question': 'پرسش'})
            self.assertEqual(context.exception.kind, 'invalid_response')

    def test_invalid_source_items(self):
        adapter = NexoraAdapter('http://localhost:8000', 'test-only-token')
        with patch.object(adapter.opener, 'open') as mock:
            mock.return_value.__enter__.return_value.read.return_value = b'{"answer":"x","sources":[null],"citations":[],"grounded":true}'
            with self.assertRaises(AdapterError) as context:
                adapter.answer(TestCase('a', 'question', '', ()), {'question': 'question'})
            self.assertEqual(context.exception.kind, 'invalid_response')

    def test_invalid_suite_shapes(self):
        for suite in (None, [], {'schema_version':1, 'cases':['bad']}, {'schema_version':1, 'cases':[{'id':'a'}], 'documents':['bad']}):
            with self.assertRaises(ValueError):
                validate_suite(suite)


if __name__ == '__main__':
    unittest.main()
