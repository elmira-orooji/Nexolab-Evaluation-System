"""Load and validate versioned JSON evaluation suites."""
import json
import re
import unicodedata
from pathlib import Path

from ...domain.models import EvaluationSuite, TestCase
from ...domain.validation import validate_request

DIFFICULTIES = {"easy", "medium", "hard"}
SUITE_VERSION = re.compile(r"^\d+\.\d+\.\d+$")
SUITE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")


class SuiteValidationError(ValueError):
    def __init__(self, errors, warnings=()):
        self.errors = list(errors)
        self.warnings = list(warnings)
        super().__init__("; ".join(f"{item['path']}: {item['message']}" for item in self.errors))


def load_json(path: str | Path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _normalized_question(value):
    text = unicodedata.normalize("NFKC", value).replace("ي", "ی").replace("ك", "ک")
    return " ".join(text.split()).casefold()


def inspect_suite(suite) -> dict:
    """Return all actionable validation errors and quality warnings for a suite."""
    errors, warnings = [], []

    def add(target, code, path, message):
        target.append({"code": code, "path": path, "message": message})

    if not isinstance(suite, dict):
        add(errors, "invalid_type", "$", "مجموعه باید یک شیء JSON باشد.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    if type(suite.get("schema_version")) is not int or suite.get("schema_version") != 1:
        add(errors, "unsupported_schema", "schema_version", "نسخهٔ قالب باید عدد ۱ باشد.")
    suite_id = suite.get("id")
    if not isinstance(suite_id, str) or not suite_id.strip():
        add(errors, "missing_id", "id", "شناسهٔ مجموعه الزامی است.")
    elif not SUITE_ID.fullmatch(suite_id):
        add(errors, "invalid_id", "id", "شناسه باید با حرف یا عدد لاتین آغاز شود و فقط شامل حروف لاتین، عدد، نقطه، خط تیره یا زیرخط باشد.")
    version = suite.get("version")
    if version is None:
        add(warnings, "missing_version", "version", "نسخهٔ مجموعه ثبت نشده است؛ پیشنهاد می‌شود از قالب X.Y.Z استفاده شود.")
    elif not isinstance(version, str) or not SUITE_VERSION.fullmatch(version):
        add(errors, "invalid_version", "version", "نسخه باید با قالب X.Y.Z مانند 1.0.0 نوشته شود.")
    description = suite.get("description")
    if description is not None and (not isinstance(description, str) or len(description) > 2000):
        add(errors, "invalid_description", "description", "توضیح مجموعه باید رشته و حداکثر ۲۰۰۰ نویسه باشد.")

    documents = suite.get("documents", [])
    if not isinstance(documents, list):
        add(errors, "invalid_documents", "documents", "فهرست اسناد معتبر نیست.")
        documents = []
    document_ids = {}
    document_texts = {}
    for index, document in enumerate(documents):
        path = f"documents[{index}]"
        if not isinstance(document, dict):
            add(errors, "invalid_document", path, "هر سند باید یک شیء باشد.")
            continue
        doc_id = document.get("id")
        if not isinstance(doc_id, str) or not doc_id.strip():
            add(errors, "missing_document_id", f"{path}.id", "شناسهٔ سند الزامی است.")
        elif doc_id in document_ids:
            add(errors, "duplicate_document_id", f"{path}.id", f"شناسهٔ سند با {document_ids[doc_id]} تکراری است.")
        else:
            document_ids[doc_id] = f"documents[{index}].id"
        text = document.get("text")
        if not isinstance(text, str) or not text.strip():
            add(errors, "missing_document_text", f"{path}.text", "متن سند خالی یا نامعتبر است.")
        else:
            normalized_text = _normalized_question(text)
            if normalized_text in document_texts:
                add(warnings, "duplicate_document_text", f"{path}.text", f"متن سند با {document_texts[normalized_text]} تکراری است.")
            else:
                document_texts[normalized_text] = f"documents[{index}].text"
        title = document.get("title")
        if title is not None and (not isinstance(title, str) or len(title) > 300):
            add(errors, "invalid_document_title", f"{path}.title", "عنوان سند باید رشته و حداکثر ۳۰۰ نویسه باشد.")

    cases = suite.get("cases")
    if not isinstance(cases, list) or not cases:
        add(errors, "empty_cases", "cases", "مجموعه باید دست‌کم یک پرسش آزمون داشته باشد.")
        cases = []
    case_ids, questions = {}, {}
    for index, case in enumerate(cases):
        path = f"cases[{index}]"
        if not isinstance(case, dict):
            add(errors, "invalid_case", path, "هر مورد آزمون باید یک شیء باشد.")
            continue
        case_id = case.get("id")
        if not isinstance(case_id, str) or not case_id.strip():
            add(errors, "missing_case_id", f"{path}.id", "شناسهٔ پرسش الزامی است.")
        elif case_id in case_ids:
            add(errors, "duplicate_case_id", f"{path}.id", f"شناسهٔ پرسش با {case_ids[case_id]} تکراری است.")
        else:
            case_ids[case_id] = f"cases[{index}].id"

        question = case.get("question")
        if not isinstance(question, str) or not 2 <= len(question.strip()) <= 2000:
            add(errors, "invalid_question", f"{path}.question", "پرسش باید پس از حذف فاصله‌های ابتدا و انتها ۲ تا ۲۰۰۰ نویسه باشد.")
        else:
            normalized_question = _normalized_question(question)
            if normalized_question in questions:
                add(warnings, "duplicate_question", f"{path}.question", f"پرسش با {questions[normalized_question]} تکراری است.")
            else:
                questions[normalized_question] = f"cases[{index}].question"

        reference = case.get("reference_answer")
        if not isinstance(reference, str) or not reference.strip():
            add(errors, "missing_reference_answer", f"{path}.reference_answer", "پاسخ مرجع الزامی است؛ موردهای بدون پاسخ باید نبود اطلاعات را صریح ثبت کنند.")
        expected = case.get("expected_document_ids")
        if not isinstance(expected, list) or not all(isinstance(value, str) and value.strip() for value in expected):
            add(errors, "invalid_expected_documents", f"{path}.expected_document_ids", "شناسه‌های سند مرجع باید فهرستی از رشته‌های غیرخالی باشند.")
        else:
            if len(set(expected)) != len(expected):
                add(errors, "duplicate_expected_document", f"{path}.expected_document_ids", "شناسهٔ سند مرجع در همین فهرست تکرار شده است.")
            for doc_id in sorted(set(expected) - set(document_ids)):
                add(errors, "unknown_expected_document", f"{path}.expected_document_ids", f"سند مرجع «{doc_id}» در مجموعه وجود ندارد.")

        category = case.get("category")
        if category is None:
            add(warnings, "missing_category", f"{path}.category", "موضوع برای این پرسش تعیین نشده است.")
        elif not isinstance(category, str) or not category.strip() or len(category) > 80:
            add(errors, "invalid_category", f"{path}.category", "موضوع باید رشته‌ای غیرخالی و حداکثر ۸۰ نویسه باشد.")
        difficulty = case.get("difficulty")
        if difficulty is None:
            add(warnings, "missing_difficulty", f"{path}.difficulty", "سطح دشواری برای این پرسش تعیین نشده است.")
        elif not isinstance(difficulty, str) or difficulty not in DIFFICULTIES:
            add(errors, "invalid_difficulty", f"{path}.difficulty", "سطح دشواری باید easy، medium یا hard باشد.")
        tags = case.get("tags", [])
        if not isinstance(tags, list) or not all(isinstance(tag, str) and tag.strip() and len(tag) <= 40 for tag in tags):
            add(errors, "invalid_tags", f"{path}.tags", "برچسب‌ها باید فهرستی از رشته‌های غیرخالی و حداکثر ۴۰ نویسه باشند.")
        elif len(set(tags)) != len(tags):
            add(warnings, "duplicate_tag", f"{path}.tags", "در فهرست برچسب‌ها مقدار تکراری وجود دارد.")
        guidance = case.get("review_guidance")
        if guidance is not None and (not isinstance(guidance, str) or len(guidance) > 2000):
            add(errors, "invalid_review_guidance", f"{path}.review_guidance", "راهنمای ارزیابی باید رشته و حداکثر ۲۰۰۰ نویسه باشد.")
        try:
            validate_request(case.get("request", {}))
        except (ValueError, TypeError):
            add(errors, "invalid_request", f"{path}.request", "تنظیم درخواست باید یک شیء JSON باشد.")

    if cases and not any(isinstance(case, dict) and isinstance(case.get("category"), str) for case in cases):
        add(warnings, "no_categories", "cases", "هیچ موضوعی برای تفکیک پرسش‌ها ثبت نشده است.")
    return {"valid": not errors, "errors": errors, "warnings": warnings}


def validate_suite(suite) -> None:
    diagnostics = inspect_suite(suite)
    if diagnostics["errors"]:
        raise SuiteValidationError(diagnostics["errors"], diagnostics["warnings"])


def load_suite(path: str | Path) -> EvaluationSuite:
    snapshot = load_json(path)
    validate_suite(snapshot)
    cases = tuple(TestCase(c["id"], c["question"], c["reference_answer"], tuple(c["expected_document_ids"]),
                           c.get("request", {}), c.get("category", "عمومی"), c.get("difficulty", "medium"),
                           tuple(c.get("tags", []))) for c in snapshot["cases"])
    return EvaluationSuite(cases, snapshot)
