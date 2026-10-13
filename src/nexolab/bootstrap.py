"""Composition root: the only module choosing concrete infrastructure."""
import hashlib
import json
import uuid
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


def run(suite_path, config_path, output_root):
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
    EvaluationRunner(adapter, JsonRunStore(output / "report.json")).execute(evaluation)
    CsvExporter(output / "report.csv").export(evaluation)
    return output, evaluation.error_count
