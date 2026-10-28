import React from 'react';
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
    const retrieved = [...(result.response?.sources || []), ...(result.response?.citations || [])]
      .map((source) => source.document_id || source.doc_id || source.documentId)
      .filter(Boolean);
    const missing = expected.filter((id) => !retrieved.includes(id));
    if (result.error) return [{ ...result, kind: 'error', title: 'درخواست ناموفق', detail: 'تا زمانی که این پرسش پاسخ نگیرد، کیفیت بازیابی و پاسخ قابل سنجش نیست.' }];
    if (!result.response?.answer?.trim()) return [{ ...result, kind: 'empty', title: 'پاسخ خالی', detail: 'درخواست موفق ثبت شده، اما متن پاسخی برای ارزیابی وجود ندارد.' }];
    if (expected.length && !retrieved.length) return [{ ...result, kind: 'retrieval', title: 'منبعی بازیابی نشده', detail: 'برای این پرسش سند مرجع تعریف شده، اما پاسخ هیچ شناسهٔ منبعی برنگردانده است.' }];
    if (missing.length) return [{ ...result, kind: 'retrieval', title: 'بخشی از اسناد مرجع بازیابی نشده', detail: 'شناسه‌های بازیابی‌نشده: ' + missing.join('، ') }];
    if (result.response.grounded === false) return [{ ...result, kind: 'grounding', title: 'پاسخ بدون اتکای کافی به منبع', detail: 'سرویس پاسخ را grounded=false علامت‌گذاری کرده است؛ متن و استنادها را بازبینی کنید.' }];
    return [];
  });
  return { cases, results, findings };
}

export default function AdvancedAnalysisPage({ report, run, onReviewCase, onView }) {
  const { cases, results, findings } = analyze(report);
  const counts = {
    retrieval: findings.filter((item) => item.kind === 'retrieval').length,
    grounding: findings.filter((item) => item.kind === 'grounding').length,
    errors: findings.filter((item) => item.kind === 'error' || item.kind === 'empty').length,
  };
  return <ControlSizeProvider size="lg"><div className="dig-surface space-y-6 text-foreground">
    <header className="space-y-2"><h1 className="text-heading font-normal">تحلیل پیشرفته</h1><p className="text-caption text-muted-foreground">{run ? <>تحلیل اجرای <bdi>{run.run_id.slice(0, 8)}</bdi> بر اساس داده‌های ثبت‌شده و اسناد مرجع</> : 'برای شروع تحلیل، یک اجرای آزمون را باز کنید.'}</p></header>
    {!run ? <Card><CardHeader><CardTitle className="text-body font-normal">اجرایی برای تحلیل انتخاب نشده است</CardTitle><CardDescription>از فهرست اجراها یک اجرا را باز کنید تا یافته‌ها و شواهد آن نمایش داده شود.</CardDescription></CardHeader><CardContent><Button variant="outline" className="font-normal" onClick={() => onView('runs')}>رفتن به اجراها</Button></CardContent></Card> : <>
      {run.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">این اجرای آزمایشی است و پاسخ‌های آن خروجی Nexora نیستند.</p>}
      <Card><CardHeader><CardTitle className="text-body font-normal">یافته‌های این اجرا</CardTitle><CardDescription>تشخیص‌ها از خطاهای ثبت‌شده، شناسهٔ اسناد مرجع و وضعیت استناد سرویس به دست آمده‌اند؛ ارزیابی معنایی پاسخ انجام نمی‌شود.</CardDescription></CardHeader><CardContent>
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="شمار یافته‌ها">{[['شکاف بازیابی', counts.retrieval], ['نیازمند بازبینی استناد', counts.grounding], ['خطا یا پاسخ خالی', counts.errors]].map(([label, value]) => <div key={label} className="rounded-lg bg-subtle p-3"><p className="m-0 text-caption text-muted-foreground">{label}</p><p className="mb-0 mt-2 text-subheading">{value.toLocaleString('fa-IR')}</p></div>)}</div>
        {!findings.length ? <p role="status" className="text-description text-muted-foreground">بر پایهٔ داده‌های ثبت‌شده، موردی برای هشدار پیدا نشد. این نتیجه به‌تنهایی درستی پاسخ‌ها را تأیید نمی‌کند.</p> : <ul className="m-0 list-none divide-y divide-border p-0">{findings.map((item) => { const index = cases.findIndex((entry) => entry.id === item.case_id); return <li key={item.case_id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0 flex-1 space-y-2"><h3 className="m-0 text-label font-normal">{item.title} <span className="text-caption text-muted-foreground"><bdi>{item.case_id}</bdi></span></h3><p className="m-0 text-caption text-muted-foreground">{item.detail}</p><p className="m-0 line-clamp-2 text-caption">{item.question}</p></div>{index >= 0 && <Button variant="outline" className="font-normal" onClick={() => onReviewCase(index)}>بررسی شواهد</Button>}</li>; })}</ul>}
      </CardContent></Card>
      <p className="text-caption text-muted-foreground">{results.length.toLocaleString('fa-IR')} پرسش بررسی شد. نبود هشدار، تضمین صحت پاسخ نیست.</p>
    </>}</div></ControlSizeProvider>;
}
