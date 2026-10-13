"""Compatibility entry point; composition lives in bootstrap."""
from .bootstrap import run
from .adapters.datasets.json_loader import load_json, validate_suite

__all__ = ["run", "load_json", "validate_suite"]
