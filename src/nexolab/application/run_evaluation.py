import time
from collections.abc import Callable
from datetime import datetime, timezone

from .ports import EvaluationEngine, RagAdapter, RunStore
from ..domain.errors import AdapterError
from ..domain.models import CaseError, CaseResult, EvaluationRun


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class EvaluationRunner:
    """Execute cases; adapters and persistence are injected by the caller."""

    def __init__(self, adapter: RagAdapter, store: RunStore,
                 now: Callable[[], str] = utc_now,
                 timer: Callable[[], float] = time.perf_counter,
                 evaluator: EvaluationEngine | None = None):
        self.adapter = adapter
        self.store = store
        self.now = now
        self.timer = timer
        self.evaluator = evaluator

    def execute(self, run: EvaluationRun) -> EvaluationRun:
        self.store.save(run)
        for case in run.suite.cases:
            request = {**run.settings.get("request", {}), **case.request, "question": case.question}
            started_at = self.now()
            start = self.timer()
            response, error = None, None
            try:
                response = self.adapter.answer(case, request)
            except AdapterError as exc:
                error = CaseError(exc.kind, exc.status, exc.retry_after_seconds)
            duration = round((self.timer() - start) * 1000, 3)
            automatic_evaluation = (self.evaluator.evaluate(case, response)
                                    if self.evaluator is not None and response is not None else None)
            run.results.append(CaseResult(case.id, case.question, started_at, request, duration,
                                          response, error, automatic_evaluation))
            # Storage failures propagate: they are failures of the run, not the RAG service.
            self.store.save(run)
        run.finished_at = self.now()
        self.store.save(run)
        return run
