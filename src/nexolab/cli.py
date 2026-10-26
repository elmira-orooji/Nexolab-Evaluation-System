import argparse
from getpass import getpass
import json
import sys
from pathlib import Path
from .bootstrap import run


def main():
    parser = argparse.ArgumentParser(description="Run Persian RAG cases and save manual-review reports")
    parser.add_argument("--suite")
    parser.add_argument("--config")
    parser.add_argument("--output", default="runs")
    parser.add_argument("--serve", action="store_true", help="Serve the local evaluation UI and API")
    parser.add_argument("--create-admin", action="store_true", help="Create the first administrator account")
    parser.add_argument("--username", help="Administrator username for --create-admin")
    parser.add_argument("--port", type=int, default=8013)
    parser.add_argument("--ui-directory", default="ui")
    args = parser.parse_args()
    try:
        if args.create_admin:
            if args.serve or args.suite or args.config:
                parser.error("--create-admin cannot be combined with --serve, --suite, or --config")
            from .adapters.web.auth import AuthStore
            username = args.username or input("نام کاربری مدیر: ").strip()
            password = getpass("رمز عبور مدیر (حداقل ۱۲ نویسه): ")
            confirmation = getpass("تکرار رمز عبور: ")
            if password != confirmation:
                print("رمزهای عبور یکسان نیستند.", file=sys.stderr)
                return 2
            AuthStore(Path(args.output) / ".nexolab-auth.sqlite3").create_admin(username, password)
            print("حساب مدیر ساخته شد.")
            return 0
        if not args.suite or not args.config:
            parser.error("--suite and --config are required unless --create-admin is used")
        if args.serve:
            from .web import serve
            serve(args.suite, args.config, args.output, args.port, args.ui_directory)
            return 0
        output, errors = run(args.suite, args.config, args.output)
    except (ValueError, KeyError, TypeError, OSError) as exc:
        if args.create_admin:
            print(str(exc), file=sys.stderr)
            return 2
        if args.serve and isinstance(exc, ValueError) and "administrator account" in str(exc):
            print(str(exc), file=sys.stderr)
            return 2
        print("Invalid input or configuration (" + type(exc).__name__ + "). Check README.", file=sys.stderr)
        return 2
    print(json.dumps({"output": str(output), "errors": errors}))
    return 1 if errors else 0
