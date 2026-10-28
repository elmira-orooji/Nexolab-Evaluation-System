import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import LatencyChart from './LatencyChart.jsx';
import { DonutChart, ReviewCriteriaChart } from './DashboardCharts.jsx';

const states = { running: 'در حال اجرا', completed: 'پایان‌یافته', failed: 'ناموفق', interrupted: 'ناتمام' };
function ChartCard({ id, title, description, children, className = '' }) {
  return <Card aria-labelledby={id} className={'min-w-0 ' + className}><CardHeader><CardTitle asChild className="text-body font-normal"><h2 id={id}>{title}</h2></CardTitle>{description && <CardDescription className="text-caption">{description}</CardDescription>}</CardHeader><CardContent>{children}</CardContent></Card>;
}

export default function Dashboard({ suite, report, run, reviews, onView, onReviewCase }) {
  const results = report?.results || [];
  const answered = results.filter((item) => item.response && !item.error);
  const failed = results.filter((item) => item.error).length;
  const noSources = answered.filter(({response}) => !response.sources?.length && !response.citations?.length).length;
  const ids = new Set(answered.map((item) => item.case_id));
  const currentReviews = Object.fromEntries(Object.entries(reviews || {}).filter(([id]) => ids.has(id)));
  const reviewed = Object.keys(currentReviews).length;
  const caseById = new Map((report?.suite?.cases || suite?.cases || []).map((item) => [item.id, item]));
  const findings = results.flatMap((result) => {
    const testCase = caseById.get(result.case_id);
    const expected = testCase?.expected_document_ids || [];
    const retrieved = [...(result.response?.sources || []), ...(result.response?.citations || [])]
      .map((source) => source.document_id || source.doc_id || source.documentId)
      .filter(Boolean);
    const missing = expected.filter((id) => !retrieved.includes(id));
    if (result.error) return [{...result, kind:'error', title:'درخواست ناموفق', detail:'تا زمانی که این پرسش پاسخ نگیرد، کیفیت بازیابی و پاسخ قابل سنجش نیست.'}];
    if (!result.response?.answer?.trim()) return [{...result, kind:'empty', title:'پاسخ خالی', detail:'درخواست موفق ثبت شده، اما متن پاسخی برای ارزیابی وجود ندارد.'}];
    if (expected.length && !retrieved.length) return [{...result, kind:'retrieval', title:'منبعی بازیابی نشده', detail:'برای این پرسش سند مرجع تعریف شده، اما پاسخ هیچ شناسهٔ منبعی برنگردانده است.'}];
    if (missing.length) return [{...result, kind:'retrieval', title:'بخشی از اسناد مرجع بازیابی نشده', detail:'شناسه‌های بازیابی‌نشده: ' + missing.join('، ')}];
    if (result.response.grounded === false) return [{...result, kind:'grounding', title:'پاسخ بدون اتکای کافی به منبع', detail:'سرویس پاسخ را grounded=false علامت‌گذاری کرده است؛ متن و استنادها را بازبینی کنید.'}];
    return [];
  });
  const diagnosisCounts = {
    retrieval: findings.filter((item) => item.kind === 'retrieval').length,
    grounding: findings.filter((item) => item.kind === 'grounding').length,
    errors: findings.filter((item) => item.kind === 'error' || item.kind === 'empty').length,
  };
  const date = run?.started_at ? new Date(run.started_at).toLocaleString('fa-IR', { dateStyle:'short', timeStyle:'short' }) : '';
  const timings = results.map((item) => item.duration_ms).filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const mean = timings.length ? Math.round(timings.reduce((sum,value) => sum + value, 0) / timings.length).toLocaleString('fa-IR') : null;
  return <ControlSizeProvider size="lg"><div className="dig-surface space-y-6 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><h1 className="text-heading font-normal">داشبورد ارزیابی</h1><p className="text-caption text-muted-foreground">{run ? <><bdi>{report?.suite?.id || suite?.id}</bdi> · {date} · {states[run.state] || 'وضعیت نامشخص'}</> : 'نمای بصری پاسخ‌ها، منابع و بازبینی انسانی'}</p></div><div className="flex flex-wrap gap-2">{report && <><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.md'} download>گزارش خوانا</a></Button><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.json'} download>JSON</a></Button>{run.state === 'completed' && <Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.csv'} download>CSV</a></Button>}</>}</div></header>
    {!run ? <ChartCard id="dashboard-empty" title="هنوز آزمونی اجرا نشده است" description="برای نمایش نمودارها، از گزینهٔ اجرای آزمون جدید در سایدبار شروع کنید."><Button variant="outline" className="font-normal" onClick={() => onView('suites')}>مجموعه‌های آزمون</Button></ChartCard> : <>
      {run.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">اجرای آزمایشی با پاسخ‌های ساختگی؛ این داده‌ها خروجی Nexora نیستند.</p>}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="نمودارهای خلاصهٔ اجرا">
        <ChartCard id="chart-response" title="وضعیت درخواست‌ها" description="توزیع نتیجه‌های ثبت‌شده"><DonutChart centerLabel="درخواست" segments={[{label:'پاسخ دریافت‌شده',value:answered.length},{label:'ناموفق',value:failed},{label:'بدون نتیجه',value:results.length - answered.length - failed}]}/></ChartCard>
        <ChartCard id="chart-sources" title="پوشش منابع" description="فقط پاسخ‌های دریافت‌شده"><DonutChart centerLabel="پاسخ" segments={[{label:'دارای منبع',value:answered.length - noSources},{label:'بدون منبع',value:noSources}]}/></ChartCard>
        <ChartCard id="chart-review" title="پیشرفت بازبینی" description="بررسی انسانی پاسخ‌های دریافت‌شده"><DonutChart centerLabel="پاسخ" segments={[{label:'بازبینی‌شده',value:reviewed},{label:'در انتظار بازبینی',value:answered.length - reviewed}]}/></ChartCard>
      </section>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label="تحلیل زمان و کیفیت">
        <ChartCard id="chart-latency" title="زمان درخواست‌ها" description={mean ? 'میانگین: ' + mean + ' میلی‌ثانیه' : 'زمانی ثبت نشده است'} className="lg:col-span-2"><LatencyChart results={results}/></ChartCard>
        <ChartCard id="chart-criteria" title="معیارهای ارزیابی انسانی" description="میانگین امتیاز هر معیار"><ReviewCriteriaChart reviews={currentReviews}/></ChartCard>
      </section>
      <ChartCard id="advanced-analysis" title="تحلیل پیشرفته" description="یافته‌های مبتنی بر وضعیت درخواست و شناسهٔ اسناد مرجع. این تحلیل، داوری خودکار دربارهٔ صحت معنایی پاسخ نیست.">
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="شمار یافته‌ها">
          {[["شکاف بازیابی",diagnosisCounts.retrieval],["نیازمند بازبینی استناد",diagnosisCounts.grounding],["خطا یا پاسخ خالی",diagnosisCounts.errors]].map(([label,value]) => <div key={label} className="rounded-lg bg-subtle p-3"><p className="m-0 text-caption text-muted-foreground">{label}</p><p className="mb-0 mt-2 text-subheading">{value.toLocaleString('fa-IR')}</p></div>)}
        </div>
        {!findings.length ? <p role="status" className="text-description text-muted-foreground">بر پایهٔ داده‌های ثبت‌شده، موردی برای هشدار پیدا نشد. این نتیجه به‌تنهایی درستی پاسخ‌ها را تأیید نمی‌کند.</p> : <ul className="m-0 list-none divide-y divide-border p-0">{findings.map((item) => { const index = (report?.suite?.cases || suite?.cases || []).findIndex((entry) => entry.id === item.case_id); return <li key={item.case_id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0 flex-1 space-y-2"><h3 className="m-0 text-label font-normal">{item.title} <span className="text-caption text-muted-foreground"><bdi>{item.case_id}</bdi></span></h3><p className="m-0 text-caption text-muted-foreground">{item.detail}</p><p className="m-0 line-clamp-2 text-caption">{item.question}</p></div>{index >= 0 && <Button variant="outline" className="font-normal" onClick={() => onReviewCase(index)}>بررسی شواهد</Button>}</li>; })}</ul>}
      </ChartCard>
      <p className="text-caption text-muted-foreground">دریافت پاسخ یا وجود منبع، تضمین درستی پاسخ نیست.</p>
    </>}
  </div></ControlSizeProvider>;
}
