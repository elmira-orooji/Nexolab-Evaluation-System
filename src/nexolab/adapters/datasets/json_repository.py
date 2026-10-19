"""Allowlisted filesystem repository for user-managed JSON evaluation suites."""
import json
import re
from pathlib import Path

from .json_loader import SuiteValidationError, inspect_suite, load_json, validate_suite

SAFE_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")


class JsonSuiteRepository:
    def __init__(self, root: Path):
        self.root = Path(root).resolve()

    def path_for(self, suite_key: str) -> Path:
        if not isinstance(suite_key, str) or not SAFE_KEY.fullmatch(suite_key) or suite_key in {".", ".."}:
            raise ValueError("Invalid suite key")
        path = self.root / f"{suite_key}.json"
        if path.is_symlink() or not path.resolve().is_relative_to(self.root):
            raise ValueError("Invalid suite path")
        return path

    def validate(self, snapshot):
        return inspect_suite(snapshot)

    def get(self, suite_key):
        path = self.path_for(suite_key)
        if not path.is_file():
            raise FileNotFoundError("Unknown suite")
        snapshot = load_json(path)
        validate_suite(snapshot)
        duplicate = next((item for item in self.list() if item["suite_key"] == suite_key
                          and any(error["code"] == "duplicate_suite_id" for error in item["errors"])), None)
        if duplicate:
            raise SuiteValidationError(duplicate["errors"], duplicate["warnings"])
        return snapshot

    def list(self):
        items = []
        if not self.root.is_dir():
            return items
        for path in sorted(self.root.glob("*.json"), key=lambda item: item.name.casefold()):
            if path.name == "template.json" or path.is_symlink() or not path.is_file():
                continue
            suite_key = path.stem
            try:
                snapshot = load_json(path)
                diagnostics = inspect_suite(snapshot)
            except (OSError, UnicodeError, json.JSONDecodeError):
                snapshot = {}
                diagnostics = {"valid": False, "errors": [{"code": "invalid_json", "path": "$", "message": "فایل JSON قابل خواندن نیست."}], "warnings": []}
            items.append({
                "suite_key": suite_key,
                "id": snapshot.get("id") if isinstance(snapshot, dict) else None,
                "version": snapshot.get("version") if isinstance(snapshot, dict) else None,
                "description": snapshot.get("description", "") if isinstance(snapshot, dict) else "",
                "case_count": len(snapshot.get("cases", [])) if isinstance(snapshot, dict) and isinstance(snapshot.get("cases"), list) else 0,
                "document_count": len(snapshot.get("documents", [])) if isinstance(snapshot, dict) and isinstance(snapshot.get("documents"), list) else 0,
                "valid": diagnostics["valid"],
                "errors": diagnostics["errors"],
                "warnings": diagnostics["warnings"],
                "is_template": path.name == "template.json",
            })
        identifiers = {}
        for index, item in enumerate(items):
            if item["id"]:
                identifiers.setdefault(item["id"], []).append(index)
        for suite_id, indexes in identifiers.items():
            if len(indexes) > 1:
                for index in indexes:
                    item = items[index]
                    item["valid"] = False
                    item["errors"].append({"code": "duplicate_suite_id", "path": "id",
                                           "message": f"شناسهٔ مجموعه در چند فایل تکرار شده است: {suite_id}"})
        return items

    def template(self):
        template_path = self.path_for("template")
        if not template_path.is_file():
            return {"schema_version": 1, "id": "new-suite", "version": "1.0.0", "description": "",
                    "documents": [], "cases": [{"id": "case-1", "category": "عمومی", "difficulty": "medium",
                                                  "tags": [], "question": "", "reference_answer": "",
                                                  "expected_document_ids": [], "request": {}}]}
        snapshot = load_json(template_path)
        validate_suite(snapshot)
        return snapshot

    def create(self, snapshot):
        validate_suite(snapshot)
        suite_id = snapshot.get("id")
        if any(item["id"] == suite_id for item in self.list()):
            raise FileExistsError("Suite ID already exists")
        path = self.path_for(suite_id)
        if path.exists():
            raise FileExistsError("Suite already exists")
        self._write(path, snapshot)
        return suite_id

    def update(self, suite_key, snapshot):
        path = self.path_for(suite_key)
        if not path.is_file():
            raise FileNotFoundError("Unknown suite")
        validate_suite(snapshot)
        new_key = snapshot["id"]
        if any(item["suite_key"] != suite_key and item["id"] == new_key for item in self.list()):
            raise FileExistsError("Suite ID already exists")
        new_path = self.path_for(new_key)
        if new_key != suite_key:
            if new_path.exists():
                raise FileExistsError("Suite ID already exists")
            self._write(new_path, snapshot)
            path.unlink()
            return new_key
        self._write(path, snapshot)
        return suite_key

    @staticmethod
    def _write(path, snapshot):
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(f".{path.name}.tmp")
        try:
            temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temporary.replace(path)
        finally:
            if temporary.exists():
                temporary.unlink()
