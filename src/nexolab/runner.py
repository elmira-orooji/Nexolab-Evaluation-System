import csv
import hashlib
import json
import math
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from . import __version__
from .adapters import AdapterError, FixtureAdapter, NexoraAdapter

REQUEST_KEYS = {"limit", "document_id", "document_set_id", "document_ids", "filters"}


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_request(request):
    if not isinstance(request, dict) or request.keys() - REQUEST_KEYS:
        raise ValueError("Unsupported request settings")
    if "limit" in request and (type(request["limit"]) is not int or not 1 <= request["limit"] <= 8):
        raise ValueError("limit must be 1..8")
    for key in ("document_id", "document_set_id"):
        if request.get(key) is not None:
            uuid.UUID(request[key])
    if request.get("document_ids") is not None:
        ids = request["document_ids"]
        if not isinstance(ids, list) or len(ids) > 50:
            raise ValueError("document_ids must be a list of at most 50 UUIDs")
        for value in ids:
            uuid.UUID(value)
    filters = request.get("filters")
    if filters is not None and (not isinstance(filters, dict) or filters.keys() - {"authors", "languages", "source_types", "tags", "date_from", "date_to"}):
        raise ValueError("Unsupported filters")


def validate_suite(suite):
    if not isinstance(suite, dict):
        raise ValueError("Suite must be an object")
    if suite.get("schema_version") != 1 or not suite.get("cases"):
        raise ValueError("Expected schema_version=1 and nonempty cases")
    documents = suite.get("documents", [])
    if not isinstance(documents, list) or not all(isinstance(d, dict) and isinstance(d.get("id"), str) and isinstance(d.get("text"), str) for d in documents):
        raise ValueError("Invalid documents")
    if not isinstance(suite["cases"], list) or not all(isinstance(c, dict) and isinstance(c.get("id"), str) for c in suite["cases"]):
        raise ValueError("Invalid cases")
    doc_ids = [d["id"] for d in documents]
    if len(set(doc_ids)) != len(doc_ids):
        raise ValueError("Duplicate document IDs")
    seen = set()
    for case in suite["cases"]:
        if case["id"] in seen:
            raise ValueError("Duplicate case IDs")
        seen.add(case["id"])
        if not isinstance(case["question"], str) or not 2 <= len(case["question"]) <= 2000:
            raise ValueError("Question length must be 2..2000")
        if not isinstance(case["reference_answer"], str) or not isinstance(case["expected_document_ids"], list) or not all(isinstance(value, str) for value in case["expected_document_ids"]):
            raise ValueError("Invalid reference answer or expected documents")
        if set(case["expected_document_ids"]) - set(doc_ids):
            raise ValueError("Unknown reference document")
        validate_request(case.get("request", {}))


def run(suite_path, config_path, output_root):
    suite, config = load_json(suite_path), load_json(config_path)
    validate_suite(suite)
    if not isinstance(config, dict):
        raise ValueError("Config must be an object")
    if config.keys() - {"adapter", "base_url", "timeout_seconds", "request", "system_revision", "corpus_revision"}:
        raise ValueError("Unsupported config keys; credentials belong in the environment")
    validate_request(config.get("request", {}))
    timeout = config.get("timeout_seconds", 60)
    if type(timeout) not in (int, float) or not math.isfinite(timeout) or timeout <= 0:
        raise ValueError("timeout_seconds must be positive and finite")
    if config.get("adapter") not in ("fixture", "nexora"):
        raise ValueError("adapter must be fixture or nexora")
    adapter = FixtureAdapter() if config["adapter"] == "fixture" else NexoraAdapter(config)
    run_id = str(uuid.uuid4())
    output = Path(output_root) / run_id
    output.mkdir(parents=True, exist_ok=False)
    canonical = json.dumps(suite, ensure_ascii=False, sort_keys=True).encode("utf-8")
    report = {"schema_version": 1, "run_id": run_id, "started_at": datetime.now(timezone.utc).isoformat(),
              "nexolab_version": __version__, "suite_sha256": hashlib.sha256(canonical).hexdigest(),
              "settings": config, "suite": suite, "results": []}
    for case in suite["cases"]:
        started_at = datetime.now(timezone.utc).isoformat()
        start = time.perf_counter()
        result = {"case_id": case["id"], "question": case["question"], "started_at": started_at,
                  "request": {**config.get("request", {}), **case.get("request", {}), "question": case["question"]},
                  "response": None, "error": None, "manual_review": {"answer_correct": None, "sources_correct": None, "notes": ""}}
        try:
            result["response"] = adapter.answer(case)
        except AdapterError as exc:
            result["error"] = {"kind": exc.kind, "http_status": exc.status}
        result["duration_ms"] = round((time.perf_counter() - start) * 1000, 3)
        report["results"].append(result)
        # Checkpoint after every case so completed work survives an interruption.
        (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    report["finished_at"] = datetime.now(timezone.utc).isoformat()
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    with (output / "report.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        fields = ["case_id", "question", "reference_answer", "expected_document_ids", "answer", "sources", "citations", "duration_ms", "error", "settings", "answer_correct", "sources_correct", "notes"]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for case, result in zip(suite["cases"], report["results"]):
            response = result["response"] or {}
            row = {"case_id": case["id"], "question": case["question"], "reference_answer": case["reference_answer"],
                   "answer": response.get("answer", ""), "duration_ms": result["duration_ms"]}
            for key, value in {"expected_document_ids": case["expected_document_ids"], "sources": response.get("sources", []), "citations": response.get("citations", []), "error": result["error"], "settings": {**config, "effective_request": result["request"]}}.items():
                row[key] = json.dumps(value, ensure_ascii=False)
            # Spreadsheet formula injection protection; JSON remains the exact record.
            writer.writerow({k: "'" + v if isinstance(v, str) and v.lstrip().startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
    return output, sum(r["error"] is not None for r in report["results"])
