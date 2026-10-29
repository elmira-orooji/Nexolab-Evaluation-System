"""Automatic RAG evaluation with deterministic metrics and an optional DeepEval judge."""
from __future__ import annotations

import math
import os
from typing import Any

from ..domain.models import RagResponse, TestCase


def _unique_document_ids(items: list[dict[str, Any]]) -> set[str]:
    return {
        value for item in items
        if isinstance(item, dict)
        for value in [item.get("document_id") or item.get("doc_id") or item.get("documentId")]
        if isinstance(value, str) and value
    }


def _score_case(case: TestCase, response: RagResponse, semantic: bool) -> dict[str, Any]:
    expected = set(case.expected_document_ids)
    retrieved = _unique_document_ids(response.sources)
    cited = _unique_document_ids(response.citations)
    metrics: list[dict[str, Any]] = []

    if expected:
        retrieved_hits = len(expected & retrieved)
        metrics.append({"name": "document_recall", "score": round(retrieved_hits / len(expected), 4),
                        "reason": f"{retrieved_hits}/{len(expected)} expected documents were retrieved",
                        "kind": "deterministic"})
        cited_hits = len(expected & cited)
        precision = cited_hits / len(cited) if cited else 0.0
        recall = cited_hits / len(expected)
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        metrics.extend([
            {"name": "citation_precision", "score": round(precision, 4),
             "reason": f"{cited_hits}/{len(cited)} cited documents are expected sources", "kind": "deterministic"},
            {"name": "citation_recall", "score": round(recall, 4),
             "reason": f"{cited_hits}/{len(expected)} expected documents are cited", "kind": "deterministic"},
            {"name": "citation_f1", "score": round(f1, 4),
             "reason": "Harmonic mean of citation precision and recall", "kind": "deterministic"},
        ])

    if semantic:
        metrics.extend(_deepeval_metrics(case, response))
    return {"engine": "deepeval" if semantic else "nexolab", "metrics": metrics}


class DeterministicEvaluationEngine:
    """Local, repeatable source and citation metrics; no external model calls."""

    name = "nexolab"

    def evaluate(self, case: TestCase, response: RagResponse) -> dict[str, Any]:
        return _score_case(case, response, semantic=False)


class DeepEvalEvaluationEngine(DeterministicEvaluationEngine):
    """Local retrieval metrics plus opt-in DeepEval semantic judges."""

    name = "deepeval"

    def evaluate(self, case: TestCase, response: RagResponse) -> dict[str, Any]:
        return _score_case(case, response, semantic=True)


def make_evaluation_engine():
    if semantic_evaluation_enabled():
        return DeepEvalEvaluationEngine()
    return DeterministicEvaluationEngine()


def _deepeval_metrics(case: TestCase, response: RagResponse) -> list[dict[str, Any]]:
    """Use DeepEval only after explicit opt-in; never expose judge exceptions or data."""
    try:
        from deepeval.metrics import AnswerCorrectnessMetric, FaithfulnessMetric
        from deepeval.test_case import LLMTestCase
    except ImportError:
        return [{"name": "semantic_evaluation", "score": None,
                 "reason": "DeepEval is not installed; install the evaluation extra.", "kind": "unavailable"}]

    contexts = [source["content"] for source in response.sources
                if isinstance(source, dict) and isinstance(source.get("content"), str)]
    try:
        test_case = LLMTestCase(input=case.question, actual_output=response.answer,
                                expected_output=case.reference_answer, retrieval_context=contexts)
        judges = [("answer_correctness", AnswerCorrectnessMetric())]
        if contexts:
            judges.append(("faithfulness", FaithfulnessMetric()))
    except Exception:
        return [{"name": "semantic_evaluation", "score": None,
                 "reason": "The semantic judge could not be initialized.", "kind": "unavailable"}]
    metrics: list[dict[str, Any]] = []
    for name, judge in judges:
        try:
            judge.measure(test_case)
            score = judge.score
            numeric_score = float(score) if score is not None else None
            if numeric_score is None or not math.isfinite(numeric_score):
                raise ValueError("Invalid metric score")
            metrics.append({"name": name, "score": round(max(0.0, min(1.0, numeric_score)), 4),
                            "reason": str(judge.reason or "")[:1000], "kind": "llm_judge"})
        except Exception:
            # Provider errors may include prompts, private content, or credentials.
            metrics.append({"name": name, "score": None,
                            "reason": "The semantic judge could not score this response.", "kind": "unavailable"})
    return metrics


def semantic_evaluation_enabled() -> bool:
    return os.environ.get("NEXOLAB_EVALUATION_ENGINE", "").strip().lower() == "deepeval"
