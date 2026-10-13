from dataclasses import dataclass, field
from typing import Any

JsonObject = dict[str, Any]


@dataclass(frozen=True)
class TestCase:
    id: str
    question: str
    reference_answer: str
    expected_document_ids: tuple[str, ...]
    request: JsonObject = field(default_factory=dict)


@dataclass(frozen=True)
class EvaluationSuite:
    cases: tuple[TestCase, ...]
    snapshot: JsonObject


@dataclass(frozen=True)
class RagResponse:
    answer: str
    sources: list[JsonObject]
    citations: list[JsonObject]
    grounded: bool
    raw: JsonObject


@dataclass(frozen=True)
class CaseError:
    kind: str
    http_status: int | None


@dataclass(frozen=True)
class CaseResult:
    case_id: str
    question: str
    started_at: str
    request: JsonObject
    duration_ms: float
    response: RagResponse | None
    error: CaseError | None

    def to_record(self) -> JsonObject:
        return {
            "case_id": self.case_id, "question": self.question,
            "started_at": self.started_at, "request": self.request,
            "duration_ms": self.duration_ms,
            "response": {
                **self.response.raw,
                "answer": self.response.answer, "sources": self.response.sources,
                "citations": self.response.citations, "grounded": self.response.grounded,
            } if self.response else None,
            "raw_response": self.response.raw if self.response else None,
            "error": {"kind": self.error.kind, "http_status": self.error.http_status} if self.error else None,
            "manual_review": {"answer_correct": None, "sources_correct": None, "notes": ""},
        }


@dataclass
class EvaluationRun:
    run_id: str
    started_at: str
    nexolab_version: str
    suite_sha256: str
    settings: JsonObject
    suite: EvaluationSuite
    results: list[CaseResult] = field(default_factory=list)
    finished_at: str | None = None

    @property
    def error_count(self) -> int:
        return sum(result.error is not None for result in self.results)

    def to_record(self) -> JsonObject:
        record = {
            "schema_version": 1, "run_id": self.run_id, "started_at": self.started_at,
            "nexolab_version": self.nexolab_version, "suite_sha256": self.suite_sha256,
            "settings": self.settings, "suite": self.suite.snapshot,
            "results": [result.to_record() for result in self.results],
        }
        if self.finished_at is not None:
            record["finished_at"] = self.finished_at
        return record
