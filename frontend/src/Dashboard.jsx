import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import LatencyChart from './LatencyChart.jsx';

const number = (value) => Math.round(value).toLocaleString('fa-IR');
const states = { running: 'در حال اجرا', completed: 'پایان‌یافته', failed: 'ناموفق', interrupted: 'ناتمام' };
const date = (run) => run?.started_at ? new Date(run.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : 'زمان ثبت نشده';

export default function Dashboard({ suite, report, run, reviews, onView, onStart }) {
  const results = report?.results || [];
  const successful = results.filter((item) => item.response && !item.error);
  const failed = results.filter((item) => item.error).length;
  const noSources = successful.filter(({ response }) => !response.sources?.length && !response.citations?.length).length;
  const reviewed = successful.filter((item) => Boolean(reviews?.[item.case_id])).length;
  const timings = results.map((item) => Number(item.duration_ms)).filter(Number.isFinite);
  const average = timings.length ? number(timings.reduce((sum, value) => sum + value, 0) / timings.length) : 'ثبت نشده';
  const metrics = [['پاسخ دریافت‌شده', report ? number(successful.length) : '—'], ['درخواست ناموفق', report ? number(failed) : '—'], ['پاسخ بدون منبع', report ? number(noSources) : '—'], ['میانگین زمان درخواست', report && timings.length ? average + ' میلی‌ثانیه' : '—']];
  const runSuite = report?.suite || suite;
  return <ControlSizeProvider size="lg"><div className="dig-surface space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><h1 className="text-heading font-medium">داشبورد ارزیابی</h1><p className="text-description text-muted-foreground">نتیجهٔ اجرا را ببینید و پاسخ‌ها را بازبینی کنید.</p></div><Button onClick={onStart}>اجرای آزمون جدید</Button></header>
    {!run ? <Card aria-labelledby="dashboard-empty-title"><CardHeader><CardTitle asChild className="text-body font-medium"><h2 id="dashboard-empty-title">اولین آزمون را اجرا کنید</h2></CardTitle><CardDescription>{suite ? 'مجموعهٔ آزمون آماده است. از «اجرای آزمون جدید» شروع کنید.' : 'برای شروع، یک مجموعهٔ معتبر از بخش مجموعه‌های آزمون بسازید.'}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => onView('suites')}>مشاهدهٔ مجموعه‌های آزمون</Button></CardContent></Card> : <>
      <section aria-labelledby="dashboard-summary-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="dashboard-summary-title" className="text-body font-medium">خلاصهٔ اجرای انتخاب‌شده</h2><p className="text-description text-muted-foreground"><bdi>{runSuite?.id || 'مجموعهٔ ثبت‌نشده'}</bdi> · {date(run)} · {states[run.state] || 'وضعیت نامشخص'}</p></div></div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,value]) => <div key={label} className="min-w-0 rounded-xl border border-border bg-card p-6"><dt className="text-label text-muted-foreground">{label}</dt><dd className="m-0 mt-3 text-subheading font-medium">{value}</dd></div>)}</dl>
        <p className="text-caption text-muted-foreground">دریافت پاسخ به معنی درست‌بودن آن نیست؛ کیفیت پاسخ با بازبینی انسانی مشخص می‌شود.</p>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-labelledby="dashboard-review-title"><CardHeader><CardTitle asChild className="text-body font-medium"><h2 id="dashboard-review-title">قدم بعدی: بازبینی پاسخ‌ها</h2></CardTitle><CardDescription>{successful.length ? number(reviewed) + ' از ' + number(successful.length) + ' پاسخ بازبینی شده است.' : 'هنوز پاسخی برای بازبینی ثبت نشده است.'}</CardDescription></CardHeader><CardContent className="space-y-6"><p className="text-description text-muted-foreground">{successful.length && reviewed === successful.length ? 'بازبینی پاسخ‌های موجود کامل شده است؛ می‌توانید نظرها و تاریخچه را مرور کنید.' : 'درستی پاسخ، ارتباط با پرسش و کیفیت منابع و استناد را بررسی کنید.'}</p><Button variant="outline" disabled={!successful.length} onClick={() => onView('review')}>{reviewed ? 'مشاهده و ادامهٔ بازبینی' : 'شروع بازبینی'}</Button></CardContent></Card>
        <Card aria-labelledby="dashboard-report-title"><CardHeader><CardTitle asChild className="text-body font-medium"><h2 id="dashboard-report-title">گزارش اجرا</h2></CardTitle><CardDescription>{run.adapter === 'fixture' ? 'اجرای آزمایشی با پاسخ ساختگی؛ خروجی Nexora نیست.' : 'پاسخ‌های دریافت‌شده از Nexora'}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-description text-muted-foreground">پاسخ‌ها، منابع، زمان و خطاها در گزارش همین اجرا قابل بررسی‌اند.</p><div className="flex flex-wrap gap-3">{report && <><Button variant="outline" asChild><a href={'/api/runs/' + run.run_id + '/report.md'} download>گزارش خوانا</a></Button><Button variant="ghost" asChild><a href={'/api/runs/' + run.run_id + '/report.json'} download>JSON</a></Button>{run.state === 'completed' && <Button variant="ghost" asChild><a href={'/api/runs/' + run.run_id + '/report.csv'} download>CSV</a></Button>}</>}</div></CardContent></Card>
      </div>
      {results.length > 0 && <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="نمودارهای اجرا">
        <Card aria-labelledby="dashboard-latency-title"><CardHeader><CardTitle asChild className="text-body font-medium"><h2 id="dashboard-latency-title">زمان پاسخ به پرسش‌ها</h2></CardTitle><CardDescription>مقایسهٔ زمان درخواست‌ها، بر حسب میلی‌ثانیه</CardDescription></CardHeader><CardContent><LatencyChart results={results}/></CardContent></Card>
        <Card aria-labelledby="dashboard-quality-title"><CardHeader><CardTitle asChild className="text-body font-medium"><h2 id="dashboard-quality-title">وضعیت پاسخ‌ها و بازبینی</h2></CardTitle><CardDescription>حجم پاسخ‌ها، منابع و پیشرفت بررسی انسانی</CardDescription></CardHeader><CardContent className="space-y-6">
          {[
            ['دریافت پاسخ', successful.length, results.length],
            ['درخواست ناموفق', failed, results.length],
            ['پاسخ دارای منبع', successful.length - noSources, successful.length],
            ['بازبینی انسانی', reviewed, successful.length],
          ].map(([label,value,total]) => <div key={label} className="space-y-2"><div className="flex items-center justify-between gap-3 text-label"><span className="text-muted-foreground">{label}</span><span>{number(value)} از {number(total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={label + ': ' + number(value) + ' از ' + number(total)}><div className="h-full rounded-full bg-primary" style={{ width: (total ? value / total * 100 : 0) + '%' }}/></div></div>)}
          <p className="text-caption text-muted-foreground">وجود منبع به‌تنهایی نشان‌دهندهٔ صحت یا کفایت آن نیست.</p>
        </CardContent></Card>
      </section>}
    </>}
  </div></ControlSizeProvider>;
}
