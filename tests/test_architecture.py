import ast
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1] / "src" / "nexolab"


class ArchitectureTests(unittest.TestCase):
    def test_core_has_no_infrastructure_imports(self):
        forbidden = {"adapters", "bootstrap", "config", "cli", "urllib", "csv", "pathlib", "os"}
        for layer in ("domain", "application"):
            for path in (ROOT / layer).glob("*.py"):
                tree = ast.parse(path.read_text(encoding="utf-8"))
                for node in ast.walk(tree):
                    modules = []
                    if isinstance(node, ast.Import):
                        modules = [alias.name for alias in node.names]
                    elif isinstance(node, ast.ImportFrom):
                        modules = [node.module or ""]
                    for module in modules:
                        self.assertFalse(set(module.split(".")) & forbidden, f"{path.name}: {module}")
