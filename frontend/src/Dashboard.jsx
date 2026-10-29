import {t, locale, getLanguage} from './i18n.js';
import React from 'react';
import {LayoutDashboard, CheckCheck, Clock3, Files, MessageSquare, Info, Activity} from 'lucide-react';
import './dashboard-workspace.css';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import LatencyChart from './LatencyChart.jsx';
import { DonutChart, ReviewCriteriaChart } from './DashboardCharts.jsx';

const states = () => ( { running: t("در حال اجرا"), completed: t("پایان‌یافته"), failed: t("ناموفق"), interrupted: t("ناتمام") });
function ChartCard({ id, title, description, children, className = '' }) {
  const Icon = ({'chart-response':Activity,'chart-sources':Files,'chart-review':CheckCheck,'chart-latency':Clock3,'chart-criteria':MessageSquare})[id] || LayoutDashboard;
  return <Card aria-labelledby={id} className={'dashboard-chart-card min-w-0 ' + className}><CardHeader><span className="dashboard-chart-card__icon"><Icon size={17} aria-hidden="true"/></span><CardTitle asChild className="text-body font-normal"><h2 id={id}>{title}</h2></CardTitle>{description && <CardDescription className="text-caption">{description}</CardDescription>}</CardHeader><CardContent>{children}</CardContent></Card>;
}

export default function Dashboard({ suite, report, run, reviews, onView, onReviewCase }) {
  const fa = getLanguage() === 'fa';
  const format = value => value.toLocaleString(locale());
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
  return <ControlSizeProvider size="default"><div className="dashboard-workspace dig-surface space-y-6 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><span className="dashboard-workspace__eyebrow"><LayoutDashboard size={15} aria-hidden="true"/>{fa?"نمای کلی ارزیابی":"Evaluation overview"}</span><h1 className="text-heading font-normal">{t("داشبورد ارزیابی")}</h1><p className="text-caption text-muted-foreground">{run ? <><bdi>{report?.suite?.id || suite?.id}</bdi> · {date} · {states()[run.state] || t("وضعیت نامشخص")}</> : t("نمای بصری پاسخ‌ها، منابع و بازبینی انسانی")}</p></div><ControlSizeProvider size="default" className="flex flex-wrap items-center gap-2">{report && <><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.md'} download>{t("گزارش خوانا")}</a></Button><Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.json'} download>JSON</a></Button>{run.state === 'completed' && <Button asChild variant="outline" className="font-normal"><a href={'/api/runs/' + run.run_id + '/report.csv'} download>CSV</a></Button>}</>}</ControlSizeProvider></header>
    {!run ? <ChartCard id="dashboard-empty" title={t("هنوز آزمونی اجرا نشده است")} description={t("برای نمایش نمودارها، از گزینهٔ اجرای آزمون جدید در سایدبار شروع کنید.")}><Button variant="outline" className="font-normal" onClick={() => onView('suites')}>{t("مجموعه‌های آزمون")}</Button></ChartCard> : <>
      {run.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">{t("اجرای آزمایشی با پاسخ‌های ساختگی؛ این داده‌ها خروجی Nexora نیستند.")}</p>}
      <section className="dashboard-workspace__stats" aria-label={fa?'خلاصهٔ اجرا':'Run summary'}>{[
        {label:fa?'درخواست‌های ثبت‌شده':'Recorded requests',value:format(results.length),detail:fa?'در اجرای انتخاب‌شده':'In the selected run',Icon:Activity},
        {label:fa?'درخواست‌های موفق':'Successful requests',value:results.length?format(Math.round(answered.length/results.length*100))+(fa?'٪':'%'):'—',detail:format(answered.length)+' / '+format(results.length),Icon:CheckCheck},
        {label:fa?'میانگین زمان پاسخ':'Average latency',value:mean||'—',detail:fa?'میلی‌ثانیه برای هر درخواست':'Milliseconds per request',Icon:Clock3},
        {label:fa?'بازبینی انسانی':'Human review',value:format(reviewed)+' / '+format(answered.length),detail:fa?'از پاسخ‌های دریافت‌شده':'Of received answers',Icon:MessageSquare}
      ].map(({label,value,detail,Icon})=><article key={label}><div className="dashboard-workspace__stat-label"><span>{label}</span><Icon size={16} aria-hidden="true"/></div><strong dir="auto">{value}</strong><p>{detail}</p></article>)}</section>
      <div className="dashboard-workspace__section"><div><h2>{fa?'وضعیت اجرا و شواهد':'Run outcomes & evidence'}</h2><p>{fa?'نتیجهٔ درخواست‌ها، پوشش منابع و پیشرفت بازبینی':'Request outcomes, source coverage and review progress'}</p></div><Button variant="outline" className="font-normal" onClick={()=>onView('review')}>{fa?'بازبینی پاسخ‌ها':'Review answers'}</Button></div>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label={t("نمودارهای خلاصهٔ اجرا")}>
        <ChartCard id="chart-response" title={t("وضعیت درخواست‌ها")} description={t("توزیع نتیجه‌های ثبت‌شده")}><DonutChart centerLabel={t("درخواست")} segments={[{label:t("پاسخ دریافت‌شده"),value:answered.length},{label:t("ناموفق"),value:failed,color:"var(--destructive)"},{label:t("بدون نتیجه"),value:results.length - answered.length - failed}]}/></ChartCard>
        <ChartCard id="chart-sources" title={t("پوشش منابع")} description={t("فقط پاسخ‌های دریافت‌شده")}><DonutChart centerLabel={t("پاسخ")} segments={[{label:t("دارای منبع"),value:answered.length - noSources},{label:t("بدون منبع"),value:noSources}]}/></ChartCard>
        <ChartCard id="chart-review" title={t("پیشرفت بازبینی")} description={t("بررسی انسانی پاسخ‌های دریافت‌شده")}><DonutChart centerLabel={t("پاسخ")} segments={[{label:t("بازبینی‌شده"),value:reviewed},{label:t("در انتظار بازبینی"),value:answered.length - reviewed}]}/></ChartCard>
      </section>
      <div className="dashboard-workspace__section"><div><h2>{fa?'عملکرد و کیفیت پاسخ':'Performance & answer quality'}</h2><p>{fa?'زمان پاسخ و امتیازهای ثبت‌شده توسط ارزیاب':'Response latency and scores recorded by reviewers'}</p></div></div>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label={t("تحلیل زمان و کیفیت")}>
        <ChartCard id="chart-latency" title={t("زمان درخواست‌ها")} description={mean ? t("میانگین: ") + mean + t(" میلی‌ثانیه") : t("زمانی ثبت نشده است")} className="lg:col-span-2"><LatencyChart results={results}/></ChartCard>
        <ChartCard id="chart-criteria" title={t("معیارهای ارزیابی انسانی")} description={t("میانگین امتیاز هر معیار")}><ReviewCriteriaChart reviews={currentReviews}/></ChartCard>
      </section>
      <div className="dashboard-workspace__note"><Info size={16} aria-hidden="true"/><p>{t("دریافت پاسخ یا وجود منبع، تضمین درستی پاسخ نیست.")}</p></div>
    </>}
  </div></ControlSizeProvider>;
}

