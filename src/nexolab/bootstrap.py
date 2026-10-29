"""Composition root: the only module choosing concrete infrastructure."""
import hashlib
import json
import os
import platform
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path

from . import __version__
from .adapters.datasets.json_loader import load_suite
from .adapters.rag.fixture import FixtureAdapter
from .adapters.rag.nexora import NexoraAdapter
from .adapters.rag.nexora_validation import validate_request
from .adapters.reports.csv_exporter import CsvExporter
from .adapters.reports.json_store import JsonRunStore
from .application.run_evaluation import EvaluationRunner, utc_now
from .application.evaluators import make_evaluation_engine
from .application.readable_report import render_markdown
from .config import RunConfig, nexora_token
from .domain.models import EvaluationRun


@dataclass
class PreparedRun:
    evaluation: EvaluationRun
    runner: EvaluationRunner
    exporter: CsvExporter
    output: Path
    redact: object = None

    def execute(self):
        self.runner.execute(self.evaluation)
        self.exporter.export(self.evaluation)
        record = self.evaluation.to_record()
        previous = self._previous_report(record)
        readable = render_markdown(record, previous)
        if self.redact is not None:
            readable = self.redact(readable)
        temporary = self.output / "report.md.tmp"
        temporary.write_text(readable, encoding="utf-8")
        temporary.replace(self.output / "report.md")
        return self.output, self.evaluation.error_count

    def _previous_report(self, current):
        candidates = []
        for path in self.output.parent.iterdir():
            if path == self.output or path.is_symlink() or not path.is_dir():
                continue
            try:
                candidate = json.loads((path / "report.json").read_text(encoding="utf-8"))
                if (not isinstance(candidate, dict)
                        or not isinstance(candidate.get("settings"), dict)
                        or not isinstance(candidate.get("results"), list)
                        or any(not isinstance(item, dict) or not isinstance(item.get("case_id"), str)
                               for item in candidate["results"])):
                    continue
                if (candidate.get("finished_at") and (path / "report.csv").is_file()
                        and isinstance(candidate.get("started_at"), str)
                        and candidate["started_at"] < current.get("started_at", "")
                        and candidate.get("suite_sha256") == current.get("suite_sha256")
                        and candidate["settings"].get("adapter") == (current.get("settings") or {}).get("adapter")):
                    candidates.append(candidate)
            except (OSError, ValueError, TypeError):
                continue
        return max(candidates, key=lambda item: item.get("started_at", ""), default=None)


def prepare_run(suite_path, config_path, output_root, settings_override=None, token_override=None):
    suite = load_suite(suite_path)
    settings = dict(settings_override) if settings_override is not None else RunConfig.load(config_path).settings
    if settings["adapter"] == "fixture":
        adapter = FixtureAdapter()
    else:
        validate_request(settings.get("request", {}))
        for case in suite.cases:
            validate_request(case.request)
        adapter = NexoraAdapter(settings["base_url"], token_override if token_override is not None else nexora_token(), settings.get("timeout_seconds", 60))
    run_id = str(uuid.uuid4())
    output = Path(output_root) / run_id
    output.mkdir(parents=True, exist_ok=False)
    canonical = json.dumps(suite.snapshot, ensure_ascii=False, sort_keys=True).encode("utf-8")
    config_canonical = json.dumps(settings, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    provenance = {
        "config_sha256": hashlib.sha256(config_canonical).hexdigest(),
        "python_version": platform.python_version(),
        "platform": sys.platform,
        "source_revision": os.environ.get("NEXOLAB_REVISION") or None,
    }
    evaluation = EvaluationRun(run_id, utc_now(), __version__, hashlib.sha256(canonical).hexdigest(), settings, suite,
                               provenance=provenance)
    redact = getattr(adapter, "redact", None)
    store = JsonRunStore(output / "report.json", redact=redact)
    store.save(evaluation)
    return PreparedRun(evaluation, EvaluationRunner(adapter, store, evaluator=make_evaluation_engine()),
                       CsvExporter(output / "report.csv", redact=redact), output, redact)


def run(suite_path, config_path, output_root):
    return prepare_run(suite_path, config_path, output_root).execute()
