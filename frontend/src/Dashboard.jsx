import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import LatencyChart from './LatencyChart.jsx';

const number = (value) => Math.round(value).toLocaleString('fa-IR');
const states = { running: 'در حال اجرا', completed: 'پایان‌یافته', failed: 'ناموفق', interrupted: 'ناتمام' };
const date = (run) => run?.started_at ? new Date(run.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : 'زمان ثبت نشده';

export default function Dashboard({ suite, report, run, runs, reviews, onView, onStart, onOpenRun }) {
  const results = report?.results || [];
  const successful = results.filter((item) => item.response && !item.error);
  const failed = results.filter((item) => item.error).length;
  const noSources = successful.filter(({ response }) => !response.sources?.length && !response.citations?.length).length;
  const reviewed = successful.filter((item) => Boolean(reviews?.[item.case_id])).length;
  const timings = results.map((item) => Number(item.duration_ms)).filter(Number.isFinite);
  const average = timings.length ? number(timings.reduce((sum, value) => sum + value, 0) / timings.length) : 'ثبت نشده';
  const metrics = [['پاسخ دریافت‌شده', report ? number(successful.length) : '—'], ['درخواست ناموفق', report ? number(failed) : '—'], ['پاسخ بدون منبع', report ? number(noSources) : '—'], ['میانگین زمان درخواست', report && timings.length ? average + ' میلی‌ثانیه' : '—']];
  const runSuite = report?.suite || suite;
  return <ControlSizeProvider size="xl"><div className="dig-surface space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><h1 className="text-title font-bold">داشبورد ارزیابی</h1><p className="text-description text-muted-foreground">نتیجهٔ اجرا را ببینید و پاسخ‌ها را بازبینی کنید.</p></div><Button onClick={onStart}>اجرای آزمون جدید</Button></header>
    {!run ? <Card aria-labelledby="dashboard-empty-title"><CardHeader><CardTitle asChild><h2 id="dashboard-empty-title">اولین آزمون را اجرا کنید</h2></CardTitle><CardDescription>{suite ? 'مجموعهٔ آزمون آماده است. از «اجرای آزمون جدید» شروع کنید.' : 'برای شروع، یک مجموعهٔ معتبر از بخش مجموعه‌های آزمون بسازید.'}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => onView('suites')}>مشاهدهٔ مجموعه‌های آزمون</Button></CardContent></Card> : <>
      <section aria-labelledby="dashboard-summary-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="dashboard-summary-title" className="text-subheading font-semibold">خلاصهٔ اجرای انتخاب‌شده</h2><p className="text-description text-muted-foreground"><bdi>{runSuite?.id || 'مجموعهٔ ثبت‌نشده'}</bdi> · {date(run)} · {states[run.state] || 'وضعیت نامشخص'}</p></div></div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,value]) => <div key={label} className="min-w-0 rounded-xl border border-border bg-card p-6"><dt className="text-label text-muted-foreground">{label}</dt><dd className="m-0 mt-3 text-heading font-semibold">{value}</dd></div>)}</dl>
        <p className="text-caption text-muted-foreground">دریافت پاسخ به معنی درست‌بودن آن نیست؛ کیفیت پاسخ با بازبینی انسانی مشخص می‌شود.</p>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-labelledby="dashboard-review-title"><CardHeader><CardTitle asChild><h2 id="dashboard-review-title">قدم بعدی: بازبینی پاسخ‌ها</h2></CardTitle><CardDescription>{successful.length ? number(reviewed) + ' از ' + number(successful.length) + ' پاسخ بازبینی شده است.' : 'هنوز پاسخی برای بازبینی ثبت نشده است.'}</CardDescription></CardHeader><CardContent className="space-y-6"><p className="text-description text-muted-foreground">{successful.length && reviewed === successful.length ? 'بازبینی پاسخ‌های موجود کامل شده است؛ می‌توانید نظرها و تاریخچه را مرور کنید.' : 'درستی پاسخ، ارتباط با پرسش و کیفیت منابع و استناد را بررسی کنید.'}</p><Button variant="outline" disabled={!successful.length} onClick={() => onView('review')}>{reviewed ? 'مشاهده و ادامهٔ بازبینی' : 'شروع بازبینی'}</Button></CardContent></Card>
        <Card aria-labelledby="dashboard-report-title"><CardHeader><CardTitle asChild><h2 id="dashboard-report-title">گزارش اجرا</h2></CardTitle><CardDescription>{run.adapter === 'fixture' ? 'اجرای آزمایشی با پاسخ ساختگی؛ خروجی Nexora نیست.' : 'پاسخ‌های دریافت‌شده از Nexora'}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-description text-muted-foreground">پاسخ‌ها، منابع، زمان و خطاها در گزارش همین اجرا قابل بررسی‌اند.</p><div className="flex flex-wrap gap-3">{report && <><Button variant="outline" asChild><a href={'/api/runs/' + run.run_id + '/report.md'} download>گزارش خوانا</a></Button><Button variant="ghost" asChild><a href={'/api/runs/' + run.run_id + '/report.json'} download>JSON</a></Button>{run.state === 'completed' && <Button variant="ghost" asChild><a href={'/api/runs/' + run.run_id + '/report.csv'} download>CSV</a></Button>}</>}</div></CardContent></Card>
      </div>
      {results.length > 0 && <details className="rounded-xl border border-border bg-card p-6"><summary className="text-body font-medium">جزئیات زمان درخواست‌ها</summary><LatencyChart results={results}/></details>}
    </>}
    <Card aria-labelledby="dashboard-runs-title"><CardHeader><CardTitle asChild><h2 id="dashboard-runs-title">اجراهای اخیر</h2></CardTitle><CardDescription>برای بررسی نتیجه، یک اجرا را باز کنید.</CardDescription></CardHeader><CardContent className="space-y-4">{runs.length ? <ul className="m-0 list-none space-y-3 p-0">{runs.slice(0,3).map((item) => <li key={item.run_id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-subtle p-4"><div className="min-w-0"><p className="text-body font-medium">{date(item)}</p><p className="text-caption text-muted-foreground">{states[item.state] || 'وضعیت نامشخص'} · {item.adapter === 'fixture' ? 'آزمایشی' : 'Nexora'} · <bdi>{item.run_id.slice(0,8)}</bdi></p></div><Button variant="ghost" aria-label={'بازکردن اجرای ' + date(item)} onClick={() => onOpenRun(item.run_id)}>بازکردن اجرا</Button></li>)}</ul> : <p className="text-description text-muted-foreground">هنوز اجرایی ثبت نشده است. از دکمهٔ بالای صفحه شروع کنید.</p>}<Button variant="ghost" onClick={() => onView('runs')}>همهٔ اجراها</Button></CardContent></Card>
  </div></ControlSizeProvider>;
}

