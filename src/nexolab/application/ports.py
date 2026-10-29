from typing import Protocol
from ..domain.models import EvaluationRun, JsonObject, RagResponse, TestCase


class RagAdapter(Protocol):
    def answer(self, case: TestCase, request: JsonObject) -> RagResponse: ...


class EvaluationEngine(Protocol):
    def evaluate(self, case: TestCase, response: RagResponse) -> JsonObject: ...


class RunStore(Protocol):
    def save(self, run: EvaluationRun) -> None: ...


class ReportExporter(Protocol):
    def export(self, run: EvaluationRun) -> None: ...
