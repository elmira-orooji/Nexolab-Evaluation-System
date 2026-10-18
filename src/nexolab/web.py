"""Composition root for the local web interface."""
from pathlib import Path

from .adapters.datasets.json_loader import load_suite
from .adapters.web.server import make_server
from .adapters.web.service import EvaluationService
from .bootstrap import prepare_run
from .config import RunConfig


def serve(suite_path, config_path, output_root, port=8013, ui_directory="ui"):
    suite = load_suite(suite_path).snapshot
    settings = RunConfig.load(config_path).settings
    if not (Path(ui_directory) / "index.html").is_file():
        raise ValueError("UI directory missing; run from repository root or pass --ui-directory")
    service = EvaluationService(Path(output_root), lambda: prepare_run(suite_path, config_path, output_root))
    server = make_server(service, suite, settings["adapter"], ui_directory, port)
    print(f"NexoLab: http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
