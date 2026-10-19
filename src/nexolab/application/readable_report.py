"""Human-readable, deterministic summary reports for evaluation runs."""
from collections import Counter
from statistics import mean, median

from .compare_runs import compare_reports


def summarize(report: dict) -> dict:
    results = report.get("results", [])
    successful = [item for item in results if item.get("response") and not item.get("error")]
    failed = [item for item in results if item.get("error")]
    without_sources = [item for item in successful if not (item["response"].get("sources") or item["response"].get("citations"))]
    durations = [float(item.get("duration_ms", 0)) for item in results]
    errors = Counter(item["error"].get("kind", "unknown") for item in failed)
    return {
        "total": len(results), "successful": len(successful), "failed": len(failed),
        "without_sources": len(without_sources),
        "latency_ms": {
            "mean": round(mean(durations), 3) if durations else None,
            "median": round(median(durations), 3) if durations else None,
            "min": round(min(durations), 3) if durations else None,
            "max": round(max(durations), 3) if durations else None,
        },
        "errors": dict(sorted(errors.items())),
    }


def render_markdown(report: dict, previous: dict | None = None) -> str:
    summary = summarize(report)
    latency = summary["latency_ms"]
    lines = [
        "# گزارش اجرای ارزیابی",
        "",
        f"- شناسهٔ اجرا: `{report.get('run_id', '—')}`",
        f"- وضعیت: {'پایان‌یافته' if report.get('finished_at') else 'ناتمام'}",
        f"- زمان شروع: {report.get('started_at', '—')}",
        f"- زمان پایان: {report.get('finished_at') or 'ثبت نشده'}",
        f"- آداپتر: `{(report.get('settings') or {}).get('adapter', '—')}`",
        f"- مجموعه: `{(report.get('suite') or {}).get('id', '—')}`",
        "",
        "## نتیجهٔ اجرا",
        "",
        f"- کل پاسخ‌های ثبت‌شده: {summary['total']}",
        f"- موفق: {summary['successful']}",
        f"- ناموفق: {summary['failed']}",
        f"- پاسخ موفق بدون منبع یا استناد: {summary['without_sources']}",
        "",
        "## زمان پاسخ (میلی‌ثانیه)",
        "",
        f"- میانگین: {latency['mean'] if latency['mean'] is not None else '—'}",
        f"- میانه: {latency['median'] if latency['median'] is not None else '—'}",
        f"- کمینه: {latency['min'] if latency['min'] is not None else '—'}",
        f"- بیشینه: {latency['max'] if latency['max'] is not None else '—'}",
        "",
        "## خطاها",
        "",
    ]
    if summary["errors"]:
        lines.extend(f"- `{kind}`: {count}" for kind, count in summary["errors"].items())
    else:
        lines.append("- خطایی ثبت نشد.")
    lines.extend(["", "## مقایسه با اجرای قبلی", ""])
    if previous is None:
        lines.append("اجرای قبلیِ کامل با همین مجموعه و آداپتر پیدا نشد.")
    else:
        diff = compare_reports(previous, report)
        previous_summary = summarize(previous)
        previous_mean = previous_summary["latency_ms"]["mean"]
        current_mean = latency["mean"]
        latency_delta = round(current_mean - previous_mean, 3) if current_mean is not None and previous_mean is not None else None
        lines.extend([
            f"- اجرای مبنا: `{previous.get('run_id', '—')}`",
            f"- پرسش‌های مشترک: {diff['shared_case_count']}",
            f"- پاسخ‌های تغییرکرده: {diff['answer_changes']}",
            f"- تغییر در منابع یا استنادها: {diff['source_changes']}",
            f"- تغییر در وضعیت خطا: {diff['error_changes']}",
            f"- خطاها: {diff['baseline_errors']} ← {diff['candidate_errors']}",
            f"- پاسخ موفق بدون منبع یا استناد: {previous_summary['without_sources']} ← {summary['without_sources']}",
            f"- میانگین زمان پاسخ: {previous_mean if previous_mean is not None else '—'} ← {current_mean if current_mean is not None else '—'} ms",
            f"- تغییر میانگین زمان پاسخ: {f'{latency_delta:+.3f} ms' if latency_delta is not None else 'قابل محاسبه نیست'}",
            f"- مجموعه یکسان: {'بله' if diff['same_suite'] else 'خیر'}؛ پیکربندی یکسان: {'بله' if diff['same_config'] else 'خیر'}",
        ])
        if not diff["same_config"]:
            lines.append("- توجه: پیکربندی تغییر کرده است؛ اختلاف‌ها با این تغییر تفسیر شوند.")
    lines.extend([
        "",
        "## پیگیری موارد",
        "",
    ])
    for item in report.get("results", []):
        response = item.get("response") or {}
        if item.get("error"):
            error = item["error"]
            lines.append(f"- `{item.get('case_id', '—')}`: خطای `{error.get('kind', 'unknown')}`؛ {item.get('duration_ms', 0)} ms")
        elif response and not (response.get("sources") or response.get("citations")):
            lines.append(f"- `{item.get('case_id', '—')}`: پاسخ بدون منبع یا استناد؛ {item.get('duration_ms', 0)} ms")
    if not any(item.get("error") or (item.get("response") and not (item["response"].get("sources") or item["response"].get("citations"))) for item in report.get("results", [])):
        lines.append("- مورد خطادار یا پاسخ موفقِ بدون منبع پیدا نشد.")
    lines.extend([
        "",
        "## دادهٔ خام",
        "",
        "پاسخ‌ها، منابع، ارجاع‌ها، درخواست‌های مؤثر، تنظیمات و زمان هر مورد در `report.json` و `report.csv` موجود است.",
        "",
    ])
    return "\n".join(lines)
