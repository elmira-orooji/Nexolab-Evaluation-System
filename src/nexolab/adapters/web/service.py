"""Filesystem-backed job and review service for the local web adapter."""
import json
import threading
import uuid
from pathlib import Path
from collections.abc import Callable

from ...application.run_evaluation import utc_now
from ...application.compare_runs import compare_reports


class RunBusyError(Exception):
    pass


class LockedRunStore:
    """Serialize report reads and atomic replacements on Windows as well as POSIX."""

    def __init__(self, store, lock):
        self.store = store
        self.lock = lock

    def save(self, run):
        with self.lock:
            self.store.save(run)


class EvaluationService:
    def __init__(self, output_root: Path, prepare: Callable, suite_repository=None, active_suite_key=None):
        self.output_root = Path(output_root)
        self.prepare = prepare
        self.suite_repository = suite_repository
        self.active_suite_key = active_suite_key
        self.lock = threading.RLock()
        self.active_id = None
        self.states = {}

    def directory(self, run_id):
        if not isinstance(run_id, str) or str(uuid.UUID(run_id)) != run_id:
            raise ValueError("Invalid run ID")
        directory = self.output_root / run_id
        if directory.is_symlink() or not (directory / "report.json").is_file():
            raise FileNotFoundError("Unknown run")
        return directory

    def start(self):
        with self.lock:
            if self.active_id:
                raise RunBusyError()
            if self.suite_repository is None:
                prepared = self.prepare()
            else:
                suite_path = self.suite_repository.path_for(self.active_suite_key)
                prepared = self.prepare(suite_path)
            prepared.runner.store = LockedRunStore(prepared.runner.store, self.lock)
            run_id = prepared.evaluation.run_id
            self.active_id = run_id
            self.states[run_id] = "running"
            threading.Thread(target=self._execute, args=(prepared,), daemon=True).start()
            return run_id

    def list_suites(self):
        if self.suite_repository is None:
            return []
        with self.lock:
            return [{**item, "active": item["suite_key"] == self.active_suite_key}
                    for item in self.suite_repository.list()]

    def suite_snapshot(self):
        if self.suite_repository is None:
            return None
        with self.lock:
            return {"suite_key": self.active_suite_key,
                    "suite": self.suite_repository.get(self.active_suite_key)}

    def select_suite(self, suite_key):
        if self.suite_repository is None:
            raise ValueError("Suite management is unavailable")
        with self.lock:
            snapshot = self.suite_repository.get(suite_key)
            self.active_suite_key = suite_key
            return {"suite_key": suite_key, "suite": snapshot}

    def validate_suite(self, snapshot):
        if self.suite_repository is None:
            raise ValueError("Suite management is unavailable")
        return self.suite_repository.validate(snapshot)

    def create_suite(self, snapshot):
        if self.suite_repository is None:
            raise ValueError("Suite management is unavailable")
        with self.lock:
            return self.suite_repository.create(snapshot)

    def update_suite(self, suite_key, snapshot):
        if self.suite_repository is None:
            raise ValueError("Suite management is unavailable")
        with self.lock:
            new_key = self.suite_repository.update(suite_key, snapshot)
            if self.active_suite_key == suite_key:
                self.active_suite_key = new_key
            return new_key

    def read_suite(self, suite_key):
        if self.suite_repository is None:
            raise ValueError("Suite management is unavailable")
        return self.suite_repository.get(suite_key)

    def _execute(self, prepared):
        run_id = prepared.evaluation.run_id
        try:
            prepared.execute()
            state = "completed"
        except Exception:
            # Never expose exception strings: transport/configuration details can contain secrets.
            state = "failed"
        with self.lock:
            self.states[run_id] = state
            self.active_id = None

    def read(self, run_id):
        with self.lock:
            directory = self.directory(run_id)
            report = json.loads((directory / "report.json").read_text(encoding="utf-8"))
            if (not isinstance(report, dict) or report.get("run_id") != run_id
                    or not isinstance(report.get("results"), list)
                    or not isinstance(report.get("settings"), dict)
                    or not isinstance(report.get("suite"), dict)):
                raise ValueError("Invalid report")
            default = "completed" if report.get("finished_at") and (directory / "report.csv").exists() else "interrupted"
            reviews, review_history = self._review_state(directory)
            return {"state": self.states.get(run_id, default), "report": report,
                    "reviews": reviews, "review_history": review_history}

    def list_runs(self):
        items = []
        if not self.output_root.exists():
            return items
        for path in self.output_root.iterdir():
            try:
                data = self.read(path.name)
            except (ValueError, OSError, KeyError, TypeError):
                continue
            report = data["report"]
            items.append({"run_id": report["run_id"], "started_at": report["started_at"],
                          "state": data["state"], "adapter": report["settings"]["adapter"]})
        return sorted(items, key=lambda item: item["started_at"], reverse=True)

    def compare(self, baseline_id, candidate_id):
        baseline = self.read(baseline_id)
        candidate = self.read(candidate_id)
        if baseline["state"] != "completed" or candidate["state"] != "completed":
            raise ValueError("Only completed runs can be compared")
        return compare_reports(baseline["report"], candidate["report"])

    def _review_state(self, directory):
        path = directory / "reviews.json"
        if not path.exists():
            return {}, {}
        saved = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(saved, dict) and saved.get("schema_version") == 2:
            return saved.get("reviews", {}), saved.get("history", {})
        # Read existing v1 review files without losing their current assessments.
        return saved, {case_id: [{**review, "action": "reviewed"}]
                       for case_id, review in saved.items() if isinstance(review, dict)}

    def save_review(self, run_id, case_id, review):
        with self.lock:
            data = self.read(run_id)
            if case_id not in {result["case_id"] for result in data["report"]["results"]}:
                raise ValueError("Case has no result")
            reviews, history = data["reviews"], data["review_history"]
            if review is not None:
                required = {"correctness", "relevance", "source_adequacy", "citation_quality", "reviewer", "notes"}
                ratings = {"correctness", "relevance", "source_adequacy", "citation_quality"}
                if (not isinstance(review, dict) or set(review) != required
                        or any(type(review[key]) is not int or review[key] not in (1, 2, 3, 4) for key in ratings)
                        or not isinstance(review["reviewer"], str) or not review["reviewer"].strip()
                        or len(review["reviewer"].strip()) > 120
                        or not isinstance(review["notes"], str) or len(review["notes"]) > 10000):
                    raise ValueError("Invalid review")
                review = {**review, "reviewer": review["reviewer"].strip(),
                          "reviewed_at": utc_now(), "action": "reviewed"}
                reviews[case_id] = review
            else:
                review = {"reviewed_at": utc_now(), "action": "cleared"}
                reviews.pop(case_id, None)
            case_history = history.setdefault(case_id, [])
            review["revision"] = len(case_history) + 1
            case_history.append(review)
            directory = self.directory(run_id)
            temporary = directory / "reviews.json.tmp"
            saved = {"schema_version": 2, "reviews": reviews, "history": history}
            temporary.write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")
            temporary.replace(directory / "reviews.json")
            return reviews
