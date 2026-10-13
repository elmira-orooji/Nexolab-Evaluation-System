import json
from pathlib import Path
from ...domain.models import EvaluationSuite, TestCase
from ...domain.validation import validate_request


def load_json(path: str | Path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_suite(suite) -> None:
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
        if not isinstance(case.get("question"), str) or not 2 <= len(case["question"]) <= 2000:
            raise ValueError("Question length must be 2..2000")
        references = case.get("expected_document_ids")
        if (not isinstance(case.get("reference_answer"), str)
                or not isinstance(references, list)
                or not all(isinstance(value, str) for value in references)):
            raise ValueError("Invalid reference answer or expected documents")
        if set(case["expected_document_ids"]) - set(doc_ids):
            raise ValueError("Unknown reference document")
        validate_request(case.get("request", {}))



def load_suite(path: str | Path) -> EvaluationSuite:
    snapshot = load_json(path)
    validate_suite(snapshot)
    cases = tuple(TestCase(c["id"], c["question"], c["reference_answer"], tuple(c["expected_document_ids"]), c.get("request", {})) for c in snapshot["cases"])
    return EvaluationSuite(cases, snapshot)
