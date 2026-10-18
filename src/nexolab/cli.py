import argparse
import json
import sys
from .bootstrap import run


def main():
    parser = argparse.ArgumentParser(description="Run Persian RAG cases and save manual-review reports")
    parser.add_argument("--suite", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", default="runs")
    parser.add_argument("--serve", action="store_true", help="Serve the local evaluation UI and API")
    parser.add_argument("--port", type=int, default=8013)
    parser.add_argument("--ui-directory", default="ui")
    args = parser.parse_args()
    try:
        if args.serve:
            from .web import serve
            serve(args.suite, args.config, args.output, args.port, args.ui_directory)
            return 0
        output, errors = run(args.suite, args.config, args.output)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print("Invalid input or configuration (" + type(exc).__name__ + "). Check README.", file=sys.stderr)
        return 2
    print(json.dumps({"output": str(output), "errors": errors}))
    return 1 if errors else 0
