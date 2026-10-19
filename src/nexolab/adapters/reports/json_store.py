import json
from pathlib import Path
from ...domain.models import EvaluationRun


class JsonRunStore:
    def __init__(self, path: Path, redact=None):
        self.path = path
        self.redact = redact

    def save(self, run: EvaluationRun) -> None:
        temporary = self.path.with_suffix(".json.tmp")
        record = run.to_record()
        if self.redact is not None:
            record = self.redact(record)
        temporary.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self.path)
