"""Composition root: the only module choosing concrete infrastructure."""
import hashlib
import json
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
from .config import RunConfig, nexora_token
from .domain.models import EvaluationRun


@dataclass
class PreparedRun:
    evaluation: EvaluationRun
    runner: EvaluationRunner
    exporter: CsvExporter
    output: Path

    def execute(self):
        self.runner.execute(self.evaluation)
        self.exporter.export(self.evaluation)
        return self.output, self.evaluation.error_count


def prepare_run(suite_path, config_path, output_root):
    suite = load_suite(suite_path)
    settings = RunConfig.load(config_path).settings
    if settings["adapter"] == "fixture":
        adapter = FixtureAdapter()
    else:
        validate_request(settings.get("request", {}))
        for case in suite.cases:
            validate_request(case.request)
        adapter = NexoraAdapter(settings["base_url"], nexora_token(), settings.get("timeout_seconds", 60))
    run_id = str(uuid.uuid4())
    output = Path(output_root) / run_id
    output.mkdir(parents=True, exist_ok=False)
    canonical = json.dumps(suite.snapshot, ensure_ascii=False, sort_keys=True).encode("utf-8")
    evaluation = EvaluationRun(run_id, utc_now(), __version__, hashlib.sha256(canonical).hexdigest(), settings, suite)
    store = JsonRunStore(output / "report.json")
    store.save(evaluation)
    return PreparedRun(evaluation, EvaluationRunner(adapter, store), CsvExporter(output / "report.csv"), output)


def run(suite_path, config_path, output_root):
    return prepare_run(suite_path, config_path, output_root).execute()
