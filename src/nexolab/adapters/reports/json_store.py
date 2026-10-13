import json
from pathlib import Path
from ...domain.models import EvaluationRun


class JsonRunStore:
    def __init__(self, path: Path):
        self.path = path

    def save(self, run: EvaluationRun) -> None:
        temporary = self.path.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(run.to_record(), ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self.path)
