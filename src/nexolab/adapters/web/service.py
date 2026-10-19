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
    def __init__(self, output_root: Path, prepare: Callable):
        self.output_root = Path(output_root)
        self.prepare = prepare
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
            prepared = self.prepare()
            prepared.runner.store = LockedRunStore(prepared.runner.store, self.lock)
            run_id = prepared.evaluation.run_id
            self.active_id = run_id
            self.states[run_id] = "running"
            threading.Thread(target=self._execute, args=(prepared,), daemon=True).start()
            return run_id

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
            return {"state": self.states.get(run_id, default), "report": report,
                    "reviews": self._reviews(directory)}

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

    def _reviews(self, directory):
        path = directory / "reviews.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def save_review(self, run_id, case_id, review):
        with self.lock:
            data = self.read(run_id)
            if case_id not in {result["case_id"] for result in data["report"]["results"]}:
                raise ValueError("Case has no result")
            if review is not None:
                if (not isinstance(review, dict) or set(review) != {"answer_correct", "sources_correct", "notes"}
                        or type(review["answer_correct"]) is not bool
                        or type(review["sources_correct"]) is not bool
                        or not isinstance(review["notes"], str) or len(review["notes"]) > 10000):
                    raise ValueError("Invalid review")
                review = {**review, "reviewed_at": utc_now()}
            reviews = data["reviews"]
            if review is None:
                reviews.pop(case_id, None)
            else:
                reviews[case_id] = review
            directory = self.directory(run_id)
            temporary = directory / "reviews.json.tmp"
            temporary.write_text(json.dumps(reviews, ensure_ascii=False, indent=2), encoding="utf-8")
            temporary.replace(directory / "reviews.json")
            return reviews
