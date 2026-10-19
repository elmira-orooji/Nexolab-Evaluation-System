"""Deterministic, model-free comparison of two persisted evaluation reports."""
import json
from typing import Any


def _source_keys(result: dict[str, Any]) -> list[str]:
    response = result.get("response") or {}
    sources = response.get("sources", [])
    citations = response.get("citations", [])
    return [json.dumps(item, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            for item in [*sources, *citations]]


def compare_reports(baseline: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    """Compare matching case results without assigning quality scores."""
    baseline_results = {item["case_id"]: item for item in baseline.get("results", [])}
    candidate_results = {item["case_id"]: item for item in candidate.get("results", [])}
    shared_ids = sorted(baseline_results.keys() & candidate_results.keys())
    cases = []
    for case_id in shared_ids:
        before, after = baseline_results[case_id], candidate_results[case_id]
        before_response, after_response = before.get("response") or {}, after.get("response") or {}
        before_error, after_error = before.get("error"), after.get("error")
        before_sources, after_sources = _source_keys(before), _source_keys(after)
        cases.append({
            "case_id": case_id,
            "answer_changed": before_response.get("answer") != after_response.get("answer"),
            "sources_changed": before_sources != after_sources,
            "error_changed": before_error != after_error,
            "baseline": {"answer": before_response.get("answer"), "source_count": len(before_sources),
                         "error": before_error, "duration_ms": before.get("duration_ms")},
            "candidate": {"answer": after_response.get("answer"), "source_count": len(after_sources),
                          "error": after_error, "duration_ms": after.get("duration_ms")},
            "duration_delta_ms": round(after.get("duration_ms", 0) - before.get("duration_ms", 0), 3),
        })

    baseline_suite = baseline.get("suite_sha256")
    candidate_suite = candidate.get("suite_sha256")
    baseline_config = (baseline.get("provenance") or {}).get("config_sha256")
    candidate_config = (candidate.get("provenance") or {}).get("config_sha256")
    return {
        "schema_version": 1,
        "baseline_run_id": baseline.get("run_id"),
        "candidate_run_id": candidate.get("run_id"),
        "same_suite": bool(baseline_suite and baseline_suite == candidate_suite),
        "same_config": bool(baseline_config and baseline_config == candidate_config),
        "baseline_suite_sha256": baseline_suite,
        "candidate_suite_sha256": candidate_suite,
        "baseline_config_sha256": baseline_config,
        "candidate_config_sha256": candidate_config,
        "baseline_system_revision": (baseline.get("settings") or {}).get("system_revision"),
        "candidate_system_revision": (candidate.get("settings") or {}).get("system_revision"),
        "baseline_corpus_revision": (baseline.get("settings") or {}).get("corpus_revision"),
        "candidate_corpus_revision": (candidate.get("settings") or {}).get("corpus_revision"),
        "shared_case_count": len(shared_ids),
        "baseline_only_case_ids": sorted(baseline_results.keys() - candidate_results.keys()),
        "candidate_only_case_ids": sorted(candidate_results.keys() - baseline_results.keys()),
        "answer_changes": sum(case["answer_changed"] for case in cases),
        "source_changes": sum(case["sources_changed"] for case in cases),
        "error_changes": sum(case["error_changed"] for case in cases),
        "baseline_errors": sum(item.get("error") is not None for item in baseline_results.values()),
        "candidate_errors": sum(item.get("error") is not None for item in candidate_results.values()),
        "cases": cases,
    }
