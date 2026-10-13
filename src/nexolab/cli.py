import argparse
import json
import sys
from .runner import run


def main():
    parser = argparse.ArgumentParser(description="Run Persian RAG cases and save manual-review reports")
    parser.add_argument("--suite", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", default="runs")
    args = parser.parse_args()
    try:
        output, errors = run(args.suite, args.config, args.output)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print("Invalid input or configuration (" + type(exc).__name__ + "). Check README.", file=sys.stderr)
        return 2
    print(json.dumps({"output": str(output), "errors": errors}))
    return 1 if errors else 0
