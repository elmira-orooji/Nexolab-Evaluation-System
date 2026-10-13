from ...domain.models import JsonObject, RagResponse, TestCase


class FixtureAdapter:
    def answer(self, case: TestCase, request: JsonObject) -> RagResponse:
        raw = {"answer": case.reference_answer, "sources": [], "citations": [],
               "grounded": bool(case.expected_document_ids), "answer_basis": "sources"}
        return RagResponse(raw["answer"], [], [], raw["grounded"], raw)
