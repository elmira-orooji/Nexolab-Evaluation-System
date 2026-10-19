import csv
import json
from pathlib import Path
from ...domain.models import EvaluationRun

FIELDS = ["case_id", "category", "difficulty", "tags", "question", "reference_answer", "expected_document_ids", "answer",
          "sources", "citations", "duration_ms", "error", "settings",
          "answer_correct", "sources_correct", "notes"]


def spreadsheet_safe(value):
    if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


class CsvExporter:
    def __init__(self, path: Path, redact=None):
        self.path = path
        self.redact = redact

    def export(self, run: EvaluationRun) -> None:
        cases = {case.id: case for case in run.suite.cases}
        with self.path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            for result in run.results:
                case = cases[result.case_id]
                response = result.response
                row = {"case_id": case.id, "category": case.category, "difficulty": case.difficulty,
                       "tags": json.dumps(case.tags, ensure_ascii=False),
                       "question": case.question,
                       "reference_answer": case.reference_answer,
                       "answer": response.answer if response else "", "duration_ms": result.duration_ms}
                values = {"expected_document_ids": case.expected_document_ids,
                          "sources": response.sources if response else [],
                          "citations": response.citations if response else [],
                          "error": result.to_record()["error"],
                          "settings": {**run.settings, "effective_request": result.request}}
                row.update({key: json.dumps(value, ensure_ascii=False) for key, value in values.items()})
                if self.redact is not None:
                    row = self.redact(row)
                writer.writerow({key: spreadsheet_safe(value) for key, value in row.items()})
