import unittest

from nexolab.application.run_evaluation import EvaluationRunner
from nexolab.domain.errors import AdapterError
from nexolab.domain.models import CaseResult, EvaluationRun, EvaluationSuite, RagResponse, TestCase
from nexolab.domain.validation import validate_request


class MemoryStore:
    def __init__(self):
        self.snapshots = []

    def save(self, run):
        self.snapshots.append(run.to_record())


class AlternateAdapter:
    def __init__(self):
        self.requests = []

    def answer(self, case, request):
        self.requests.append(request)
        if case.id == "failed":
            raise AdapterError("unavailable")
        raw = {"answer": "independent service", "sources": [], "citations": [], "grounded": False}
        return RagResponse(raw["answer"], [], [], False, raw)


def evaluation():
    cases = (TestCase("failed", "first question", "", (), {"limit": 2}),
             TestCase("success", "second question", "", ()))
    return EvaluationRun("run", "start", "test", "hash", {"request": {"limit": 5}}, EvaluationSuite(cases, {}))


class ApplicationTests(unittest.TestCase):
    def test_normalized_response_preserves_original_payload(self):
        response = RagResponse("normalized", [], [], False, {"text": "original"})
        result = CaseResult("id", "question", "start", {}, 0, response, None)
        record = result.to_record()
        self.assertEqual(record["response"]["answer"], "normalized")
        self.assertEqual(record["raw_response"], {"text": "original"})

    def test_generic_request_accepts_other_service_options(self):
        validate_request({"top_k": 100, "index": "alternate"})

    def test_injected_adapter_store_and_clock(self):
        adapter, store = AlternateAdapter(), MemoryStore()
        ticks = iter((1.0, 1.125, 2.0, 2.250))
        result = EvaluationRunner(adapter, store, now=lambda: "fixed-time", timer=lambda: next(ticks)).execute(evaluation())
        self.assertEqual(result.error_count, 1)
        self.assertEqual(result.results[1].response.answer, "independent service")
        self.assertEqual([r.duration_ms for r in result.results], [125, 250])
        self.assertEqual([r["limit"] for r in adapter.requests], [2, 5])
        self.assertEqual([len(s["results"]) for s in store.snapshots], [0, 1, 2, 2])
        self.assertEqual(result.finished_at, "fixed-time")

    def test_storage_failure_stops_run(self):
        class FailingStore:
            def save(self, run):
                raise OSError("disk unavailable")
        adapter = AlternateAdapter()
        with self.assertRaises(OSError):
            EvaluationRunner(adapter, FailingStore()).execute(evaluation())
        self.assertEqual(adapter.requests, [])
