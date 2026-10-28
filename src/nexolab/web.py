"""Composition root for the local web interface."""
from pathlib import Path
import os

from .adapters.datasets.json_loader import load_suite
from .adapters.datasets.json_repository import JsonSuiteRepository
from .adapters.web.auth import AuthStore
from .adapters.web.fastapi_server import create_app
from .adapters.web.service import EvaluationService
from .bootstrap import prepare_run
from .config import RunConfig


def serve(suite_path, config_path, output_root, port=8013, ui_directory="ui"):
    suite = load_suite(suite_path).snapshot
    settings = RunConfig.load(config_path).settings
    if not (Path(ui_directory) / "index.html").is_file():
        raise ValueError("UI directory missing; run from repository root or pass --ui-directory")
    suite_path = Path(suite_path).resolve()
    repository = JsonSuiteRepository(suite_path.parent)
    connection = {"settings": dict(settings), "token": os.environ.get("NEXORA_TOKEN", "")}
    def prepare_configured(selected_path):
        return prepare_run(selected_path, config_path, output_root,
                           settings_override=connection["settings"], token_override=connection["token"])
    service = EvaluationService(Path(output_root), prepare_configured,
                                repository, suite_path.stem, connection)
    auth_store = AuthStore(Path(output_root) / ".nexolab-auth.sqlite3")
    auth_store.require_admin()
    app = create_app(service, suite, settings["adapter"], ui_directory, port, auth_store)
    import uvicorn
    print(f"NexoLab: http://127.0.0.1:{port}", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning", access_log=False,
                server_header=False)
