import json
from pathlib import Path
import math
import os
from dataclasses import dataclass
from .domain.validation import validate_request
from .domain.models import JsonObject


@dataclass(frozen=True)
class RunConfig:
    settings: JsonObject

    @classmethod
    def load(cls, path):
        config = json.loads(Path(path).read_text(encoding="utf-8"))
        if not isinstance(config, dict):
            raise ValueError("Config must be an object")
        allowed = {"adapter", "base_url", "timeout_seconds", "request", "system_revision", "corpus_revision"}
        if config.keys() - allowed:
            raise ValueError("Unsupported config keys; credentials belong in the environment")
        validate_request(config.get("request", {}))
        timeout = config.get("timeout_seconds", 60)
        if type(timeout) not in (int, float) or not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("timeout_seconds must be positive and finite")
        if config.get("adapter") not in ("fixture", "nexora"):
            raise ValueError("adapter must be fixture or nexora")
        if config["adapter"] == "nexora" and not isinstance(config.get("base_url"), str):
            raise ValueError("Nexora base_url must be a string")
        return cls(config)


def nexora_token() -> str:
    token = os.environ.get("NEXORA_TOKEN")
    if not token:
        raise ValueError("NEXORA_TOKEN is required")
    return token
