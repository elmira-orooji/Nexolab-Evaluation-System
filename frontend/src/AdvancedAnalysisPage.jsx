import {t, locale, getLanguage} from './i18n.js';
import React, {useState} from 'react';
import {ScanSearch, Files, ShieldCheck, AlertCircle, Info} from 'lucide-react';
import './advanced-analysis.css';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';

function analyze(report) {
  const cases = report?.suite?.cases || [];
  const caseById = new Map(cases.map((item) => [item.id, item]));
  const results = report?.results || [];
  const findings = results.flatMap((result) => {
    const testCase = caseById.get(result.case_id);
    const expected = testCase?.expected_document_ids || [];
    const retrieved = (result.response?.sources || [])
      .map((source) => source.document_id || source.doc_id || source.documentId)
      .filter(Boolean);
    const missing = expected.filter((id) => !retrieved.includes(id));
    if (result.error) return [{ ...result, kind: 'error', title: t("درخواست ناموفق"), detail: t("تا زمانی که این پرسش پاسخ نگیرد، کیفیت بازیابی و پاسخ قابل سنجش نیست.") }];
    if (!result.response?.answer?.trim()) return [{ ...result, kind: 'empty', title: t("پاسخ خالی"), detail: t("درخواست موفق ثبت شده، اما متن پاسخی برای ارزیابی وجود ندارد.") }];
    if (expected.length && !retrieved.length) return [{ ...result, kind: 'retrieval', title: t("منبعی بازیابی نشده"), detail: t("برای این پرسش سند مرجع تعریف شده، اما پاسخ هیچ شناسهٔ منبعی برنگردانده است.") }];
    if (missing.length) return [{ ...result, kind: 'retrieval', title: t("بخشی از اسناد مرجع بازیابی نشده"), detail: t("شناسه‌های بازیابی‌نشده: ") + missing.join(t("، ")) }];
    if (result.response.grounded === false) return [{ ...result, kind: 'grounding', title: t("پاسخ بدون اتکای کافی به منبع"), detail: t("سرویس پاسخ را grounded=false علامت‌گذاری کرده است؛ متن و استنادها را بازبینی کنید.") }];
    return [];
  });
  return { cases, results, findings };
}

export default function AdvancedAnalysisPage({ report, run, onReviewCase, onView }) {
  const { cases, results, findings } = analyze(report);
  const fa=getLanguage()==='fa';
  const [filter,setFilter]=useState('all');
  const filteredFindings=findings.filter(item=>filter==='all'||(filter==='errors'?['error','empty'].includes(item.kind):item.kind===filter));
  const hasReferences=cases.some(item=>item.expected_document_ids?.length);
  const emptyMetrics=hasReferences?(fa?'برای این اجرا امتیاز خودکار ثبت نشده است. برای محاسبهٔ معیارها، مجموعه را دوباره اجرا کنید.':'No automatic scores were recorded for this run. Run the suite again to calculate metrics.') : t('برای این اجرا شناسهٔ سند مرجع ثبت نشده است؛ معیارهای بازیابی و استناد قابل محاسبه نیستند.');
  const counts = {
    retrieval: findings.filter((item) => item.kind === 'retrieval').length,
    grounding: findings.filter((item) => item.kind === 'grounding').length,
    errors: findings.filter((item) => item.kind === 'error' || item.kind === 'empty').length,
  };
  const metricLabels = {
    document_recall: t("بازیابی اسناد مرجع"),
    citation_precision: t("دقت استناد"),
    citation_recall: t("پوشش استناد"),
    citation_f1: t("امتیاز ترکیبی استناد"),
    answer_correctness: t("درستی پاسخ"),
    faithfulness: t("وفاداری به زمینه"),
  };
  const metricGroups = new Map();
  for (const result of results) {
    for (const metric of result.automatic_evaluation?.metrics || []) {
      if (typeof metric.score !== 'number' || !Number.isFinite(metric.score)) continue;
      const values = metricGroups.get(metric.name) || [];
      values.push(metric.score);
      metricGroups.set(metric.name, values);
    }
  }
  const averages = [...metricGroups.entries()].map(([name, values]) => ({
    name,
    label: metricLabels[name] || name,
    score: values.reduce((total, value) => total + value, 0) / values.length,
    count: values.length,
  }));
  const hasSemantic = results.some((result) => result.automatic_evaluation?.metrics?.some((metric) => metric.kind === 'llm_judge'));
  return <ControlSizeProvider size="default"><div className="advanced-analysis dig-surface space-y-6 text-foreground">
    <header className="space-y-2"><span className="advanced-analysis__eyebrow"><ScanSearch size={16} aria-hidden="true"/>{fa?"عیب‌یابی بر پایهٔ شواهد":"Evidence-based diagnostics"}</span><h1 className="text-heading font-normal">{t("تحلیل پیشرفته")}</h1><p className="text-caption text-muted-foreground">{run ? <>{t("تحلیل اجرای")} <bdi>{run.run_id.slice(0, 8)}</bdi> {t("بر اساس داده‌های ثبت‌شده و اسناد مرجع")}</> : t("برای شروع تحلیل، یک اجرای آزمون را باز کنید.")}</p></header>
    {!run ? <Card><CardHeader><CardTitle className="text-body font-normal">{t("اجرایی برای تحلیل انتخاب نشده است")}</CardTitle><CardDescription>{t("از فهرست اجراها یک اجرا را باز کنید تا یافته‌ها و شواهد آن نمایش داده شود.")}</CardDescription></CardHeader><CardContent><Button variant="outline" className="font-normal" onClick={() => onView('runs')}>{t("رفتن به اجراها")}</Button></CardContent></Card> : <>
      {run.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">{t("این اجرای آزمایشی است و پاسخ‌های آن خروجی Nexora نیستند.")}</p>}
      <section className="advanced-analysis__summary" aria-label={t("شمار یافته‌ها")}>{[{key:'retrieval',label:t('شکاف بازیابی'),value:counts.retrieval,Icon:Files},{key:'grounding',label:t('نیازمند بازبینی استناد'),value:counts.grounding,Icon:ShieldCheck},{key:'errors',label:t('خطا یا پاسخ خالی'),value:counts.errors,Icon:AlertCircle}].map(({key,label,value,Icon})=><article key={key}><div><span>{label}</span><Icon size={18} aria-hidden="true"/></div><strong>{value.toLocaleString(locale())}</strong><p>{fa?'مورد نیازمند بررسی':'Cases to inspect'}</p></article>)}</section>
      <Card className="advanced-analysis__metrics"><CardHeader><CardTitle className="text-body font-normal">{t("معیارهای خودکار")}</CardTitle><CardDescription>{hasSemantic ? t("امتیازهای DeepEval در کنار معیارهای قطعی این اجرا محاسبه شده‌اند.") : t("معیارهای قطعی از شناسهٔ اسناد مرجع و ارجاع‌های پاسخ محاسبه شده‌اند. برای سنجش معنایی، DeepEval را جداگانه فعال کنید.")}</CardDescription></CardHeader><CardContent>
        {averages.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{averages.map((metric) => <div key={metric.name} className="rounded-lg bg-subtle p-3"><p className="m-0 text-caption text-muted-foreground">{metric.label}</p><p className="mb-1 mt-2 text-subheading">{(metric.score * 100).toLocaleString(locale(), { maximumFractionDigits: 1 })}{t("٪")}</p><p className="m-0 text-caption text-muted-foreground">{metric.count.toLocaleString(locale())} {t("مورد")}</p></div>)}</div> : <p className="m-0 text-caption text-muted-foreground">{emptyMetrics}</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-body font-normal">{t("یافته‌های این اجرا")}</CardTitle><CardDescription>{t("تشخیص‌ها از خطاهای ثبت‌شده، شناسهٔ اسناد مرجع و وضعیت استناد سرویس به دست آمده‌اند؛ امتیازها معیارهای مستقل‌اند و جای بازبینی انسانی را نمی‌گیرند.")}</CardDescription></CardHeader><CardContent>
        <div className="advanced-analysis__filters" role="group" aria-label={fa?'فیلتر یافته‌ها':'Filter findings'}>{[['all',fa?'همهٔ یافته‌ها':'All findings'],['retrieval',t('شکاف بازیابی')],['grounding',fa?'اتکا به منبع':'Grounding'],['errors',fa?'خطاها':'Errors']].map(([value,label])=><Button key={value} variant={filter===value?'default':'outline'} aria-pressed={filter===value} onClick={()=>setFilter(value)} className="font-normal">{label}</Button>)}</div>
        {!filteredFindings.length ? <p role="status" className="text-description text-muted-foreground">{filter !== "all" ? (fa?"یافته‌ای در این دسته وجود ندارد.":"No findings in this category.") : t("بر پایهٔ داده‌های ثبت‌شده، موردی برای هشدار پیدا نشد. این نتیجه به‌تنهایی درستی پاسخ‌ها را تأیید نمی‌کند.")}</p> : <ul className="m-0 list-none divide-y divide-border p-0">{filteredFindings.map((item) => { const index = cases.findIndex((entry) => entry.id === item.case_id); return <li key={item.case_id} className="advanced-analysis__finding"><span className="advanced-analysis__finding-icon"><AlertCircle size={18} aria-hidden="true"/></span><div className="min-w-0 flex-1 space-y-2"><h3 className="m-0 text-label font-normal">{item.title} <span className="text-caption text-muted-foreground"><bdi>{item.case_id}</bdi></span></h3><p className="m-0 text-caption text-muted-foreground">{item.detail}</p><p dir="auto" className="advanced-analysis__question">{item.question}</p></div>{index >= 0 && <Button variant="outline" className="font-normal" onClick={() => onReviewCase(index)}>{t("بررسی شواهد")}</Button>}</li>; })}</ul>}
      </CardContent></Card>
      <p className="text-caption text-muted-foreground">{results.length.toLocaleString(locale())} {t("پرسش بررسی شد. نبود هشدار، تضمین صحت پاسخ نیست.")}</p>
    </>}</div></ControlSizeProvider>;
}
