import {t, locale} from './i18n.js';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import LatencyChart from './LatencyChart.jsx';
import { DonutChart, ReviewCriteriaChart } from './DashboardCharts.jsx';

const states = () => ( { running: t("در حال اجرا"), completed: t("پایان‌یافته"), failed: t("ناموفق"), interrupted: t("ناتمام") });
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
  const date = run?.started_at ? new Date(run.started_at).toLocaleString(locale(), { dateStyle:'short', timeStyle:'short' }) : '';
  const timings = results.map((item) => item.duration_ms).filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const mean = timings.length ? Math.round(timings.reduce((sum,value) => sum + value, 0) / timings.length).toLocaleString(locale()) : null;
  return <ControlSizeProvider size="lg"><div className="dig-surface space-y-6 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><h1 className="text-heading font-normal">{t("داشبورد ارزیابی")}</h1><p className="text-caption text-muted-foreground">{run ? <><bdi>{report?.suite?.id || suite?.id}</bdi> · {date} · {states()[run.state] || t("وضعیت نامشخص")}</> : t("نمای بصری پاسخ‌ها، منابع و بازبینی انسانی")}</p></div><div className="flex flex-wrap gap-2">{report && <><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.md'} download>{t("گزارش خوانا")}</a></Button><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.json'} download>JSON</a></Button>{run.state === 'completed' && <Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.csv'} download>CSV</a></Button>}</>}</div></header>
    {!run ? <ChartCard id="dashboard-empty" title={t("هنوز آزمونی اجرا نشده است")} description={t("برای نمایش نمودارها، از گزینهٔ اجرای آزمون جدید در سایدبار شروع کنید.")}><Button variant="outline" className="font-normal" onClick={() => onView('suites')}>{t("مجموعه‌های آزمون")}</Button></ChartCard> : <>
      {run.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">{t("اجرای آزمایشی با پاسخ‌های ساختگی؛ این داده‌ها خروجی Nexora نیستند.")}</p>}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label={t("نمودارهای خلاصهٔ اجرا")}>
        <ChartCard id="chart-response" title={t("وضعیت درخواست‌ها")} description={t("توزیع نتیجه‌های ثبت‌شده")}><DonutChart centerLabel={t("درخواست")} segments={[{label:t("پاسخ دریافت‌شده"),value:answered.length},{label:t("ناموفق"),value:failed,color:"var(--destructive)"},{label:t("بدون نتیجه"),value:results.length - answered.length - failed}]}/></ChartCard>
        <ChartCard id="chart-sources" title={t("پوشش منابع")} description={t("فقط پاسخ‌های دریافت‌شده")}><DonutChart centerLabel={t("پاسخ")} segments={[{label:t("دارای منبع"),value:answered.length - noSources},{label:t("بدون منبع"),value:noSources}]}/></ChartCard>
        <ChartCard id="chart-review" title={t("پیشرفت بازبینی")} description={t("بررسی انسانی پاسخ‌های دریافت‌شده")}><DonutChart centerLabel={t("پاسخ")} segments={[{label:t("بازبینی‌شده"),value:reviewed},{label:t("در انتظار بازبینی"),value:answered.length - reviewed}]}/></ChartCard>
      </section>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label={t("تحلیل زمان و کیفیت")}>
        <ChartCard id="chart-latency" title={t("زمان درخواست‌ها")} description={mean ? t("میانگین: ") + mean + t(" میلی‌ثانیه") : t("زمانی ثبت نشده است")} className="lg:col-span-2"><LatencyChart results={results}/></ChartCard>
        <ChartCard id="chart-criteria" title={t("معیارهای ارزیابی انسانی")} description={t("میانگین امتیاز هر معیار")}><ReviewCriteriaChart reviews={currentReviews}/></ChartCard>
      </section>
      <p className="text-caption text-muted-foreground">{t("دریافت پاسخ یا وجود منبع، تضمین درستی پاسخ نیست.")}</p>
    </>}
  </div></ControlSizeProvider>;
}

