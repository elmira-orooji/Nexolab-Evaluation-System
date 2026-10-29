import {t, locale, direction} from './i18n.js';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TextField, TextFieldLabel, TextFieldTextarea } from '@/components/ui/text-field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { download } from './api.js';

const number = (value) => Number(value || 0).toLocaleString(locale());
const when = (value) => value ? new Date(value).toLocaleString(locale(), {dateStyle:'short',timeStyle:'short'}) : t("زمان ثبت نشده");
const status = (result, reviewed) => reviewed ? t("بازبینی‌شده") : result?.error ? t("خطای درخواست") : result?.response ? t("آمادهٔ بازبینی") : t("در انتظار پاسخ");

function ReviewButton({ variant = 'default', className = '', ...props }) {
  const hover = variant === 'default'
    ? 'hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100'
    : 'hover:border-primary hover:bg-primary-subtle hover:text-primary-subtle-foreground hover:brightness-100 dark:hover:brightness-100';
  return <Button variant={variant} className={'font-normal shadow-none transition-colors ' + hover + ' ' + className} {...props}/>;
}

function Evidence({ title, children, open = false }) {
  return <details open={open} className="rounded-lg border border-border p-4"><summary className="text-label font-normal">{title}</summary><div className="mt-3 whitespace-pre-wrap text-description leading-relaxed text-muted-foreground">{children}</div></details>;
}

export default function ReviewView({ suite, report, run, runs, reviews, reviewHistory, onOpenRun, onSaveReview, onClearReview, saving, selected, setSelected, resetKey, criteria, ratingLabels, errorNames }) {
  const [drafts,setDrafts] = useState({});
  const [notice,setNotice] = useState('');
  useEffect(() => {setDrafts({});setNotice('');},[run?.run_id,resetKey]);
  const cases = suite?.cases || [];
  const index = Math.min(selected,Math.max(0,cases.length - 1));
  const item = cases[index];
  const result = report?.results?.find((row) => row.case_id === item?.id);
  const response = result?.error ? null : result?.response;
  const review = drafts[item?.id] || reviews?.[item?.id] || {};
  const savedCount = cases.filter((entry) => reviews?.[entry.id]).length;
  const complete = criteria.every(({key}) => [1,2,3,4].includes(Number(review[key]))) && Boolean(review.reviewer?.trim());
  const update = (values) => {setNotice('');setDrafts((all) => ({...all,[item.id]:{...review,...values}}));};
  const navigate = (next) => {setNotice('');setSelected(next);};
  const save = async (event) => {
    event.preventDefault();
    if (!response || saving || !complete) return;
    const id = item.id;
    const ok = await onSaveReview(id,{...Object.fromEntries(criteria.map(({key}) => [key,Number(review[key])])), reviewer:review.reviewer.trim(),notes:review.notes || ''});
    if (ok) {setDrafts((all) => {const next = {...all};delete next[id];return next;});setNotice(t("ارزیابی پرسش ") + id + t(" ذخیره شد."));}
    else setNotice(t("ارزیابی ذخیره نشد؛ دوباره امتحان کنید. نوشته‌ها حفظ شده‌اند."));
  };
  return <ControlSizeProvider size="default"><div className="dig-surface space-y-6 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><h1 className="text-subheading font-normal">{t("ارزیابی دستی")}</h1><p className="text-description text-muted-foreground">{t("پاسخ را با شواهد مقایسه کنید و برای هر معیار یک امتیاز ثبت کنید.")}</p></div><ReviewButton variant="outline" className="font-normal" disabled={!run} onClick={() => download({schema_version:2,run_id:run?.run_id,reviews,history:reviewHistory},(run?.run_id || 'nexolab') + '-reviews.json')}>{t("دریافت ارزیابی‌ها")}</ReviewButton></header>
    <section aria-label={t("انتخاب اجرا و پرسش")} className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
      <div className="space-y-2"><label id="review-run-label" className="text-label">{t("اجرای مورد بررسی")}</label><Select dir={direction()} value={run?.run_id || ''} disabled={saving || !runs.length} onValueChange={onOpenRun}><SelectTrigger aria-labelledby="review-run-label" className="w-full"><SelectValue placeholder={t("یک اجرا انتخاب کنید")}/></SelectTrigger><SelectContent>{runs.map((entry) => <SelectItem key={entry.run_id} value={entry.run_id}>{when(entry.started_at)} · {entry.adapter === 'fixture' ? t("آزمایشی") : 'Nexora'} · {entry.run_id.slice(0,8)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><label id="review-case-label" className="text-label">{t("پرسش مورد بررسی")}</label><Select dir={direction()} value={item?.id || ''} disabled={saving || !cases.length} onValueChange={(id) => navigate(cases.findIndex((entry) => entry.id === id))}><SelectTrigger aria-labelledby="review-case-label" className="w-full"><SelectValue placeholder={t("یک پرسش انتخاب کنید")}/></SelectTrigger><SelectContent>{cases.map((entry,i) => <SelectItem key={entry.id} value={entry.id}>{number(i+1)}. {entry.question} · {status(report?.results?.find((row) => row.case_id === entry.id),reviews?.[entry.id])}</SelectItem>)}</SelectContent></Select></div>
    </section>
    {!item ? <p className="rounded-xl border border-border bg-card p-6 text-description text-muted-foreground">{t("پرسشی در دسترس نیست. ابتدا یک مجموعهٔ دارای پرسش را از بخش «اجرای آزمون جدید» اجرا کنید.")}</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground"><span>{t("پرسش")} {number(index+1)} {t("از")} {number(cases.length)} · {number(savedCount)} {t("بازبینی‌شده")}</span><span>{status(result,reviews?.[item.id])}{drafts[item.id] ? t(" · تغییرات ذخیره‌نشده") : ''}</span></div>
      {report?.settings?.adapter === 'fixture' && <p className="rounded-lg bg-primary-subtle p-3 text-caption text-primary-subtle-foreground">{t("این اجرا آزمایشی است و پاسخ‌ها ساختگی‌اند؛ خروجی Nexora نیستند.")}</p>}
      <nav aria-label={t("جابجایی بین پرسش‌ها")} className="flex flex-wrap items-center justify-between gap-3"><ReviewButton variant="outline" disabled={index === 0 || saving} onClick={() => navigate(index-1)}>{t("پرسش قبلی")}</ReviewButton><span className="text-caption text-muted-foreground">{t("پرسش")} {number(index+1)} {t("از")} {number(cases.length)}</span><ReviewButton variant="outline" disabled={index >= cases.length-1 || saving} onClick={() => navigate(index+1)}>{t("پرسش بعدی")}</ReviewButton></nav>
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
        <Card className="min-w-0" aria-labelledby="review-answer-title"><div className="space-y-6">
          <section><CardHeader className="mb-6"><CardDescription>{t("پرسش ·")} <bdi>{item.id}</bdi></CardDescription><CardTitle asChild className="text-label font-normal"><h2 id="review-answer-title">{item.question}</h2></CardTitle></CardHeader><CardContent className="space-y-6"><section aria-labelledby="system-answer-title"><div className="flex flex-wrap items-center justify-between gap-3"><h3 id="system-answer-title" className="text-label font-normal">{t("پاسخ سیستم")}</h3>{result && <span className="text-caption text-muted-foreground">{number(result.duration_ms)} {t("میلی‌ثانیه")}</span>}</div><p className="mt-3 whitespace-pre-wrap text-description leading-relaxed">{response?.answer ?? (result?.error ? t("دریافت پاسخ با خطا مواجه شد.") : t("هنوز پاسخی دریافت نشده است."))}</p>{result?.error && <p role="status" className="mt-3 text-description text-destructive">{errorNames[result.error.kind] || t("خطای درخواست")}{result.error.http_status ? ' · HTTP ' + result.error.http_status : ''}</p>}</section><Evidence title={t("پاسخ مرجع")} open>{item.reference_answer || t("پاسخ مرجعی ثبت نشده است.")}</Evidence></CardContent></section>
          <section aria-labelledby="review-evidence-title" className="border-t border-border pt-6"><CardHeader className="mb-6"><CardTitle asChild className="text-label font-normal"><h2 id="review-evidence-title">{t("منابع و شواهد")}</h2></CardTitle><CardDescription>{t("برای خواندن متن هر منبع، عنوان آن را باز کنید.")}</CardDescription></CardHeader><CardContent className="space-y-3">{response?.sources?.map((source,i) => <Evidence key={'source-'+i} title={source.filename || source.document_id || t("منبع ") + number(i+1)}>{source.content || source.excerpt || t("متن منبع موجود نیست.")}</Evidence>)}{response?.citations?.map((citation,i) => <Evidence key={'citation-'+i} title={t("استناد ") + number(i+1) + (citation.filename ? ' · ' + citation.filename : '')}>{citation.excerpt || t("متن استناد موجود نیست.")}</Evidence>)}{!response?.sources?.length && !response?.citations?.length && <p className="text-description text-muted-foreground">{response ? t("سرویس منبعی برنگردانده است؛ این موضوع را در ارزیابی منابع در نظر بگیرید.") : t("منابع پس از دریافت پاسخ نمایش داده می‌شوند.")}</p>}<details className="border-0 p-0"><summary className="text-label text-muted-foreground">{t("اسناد مرجع مجموعهٔ آزمون")}</summary><div className="mt-3 space-y-3">{(item.expected_document_ids || []).map((id) => {const document = suite.documents?.find((entry) => entry.id === id);return document ? <Evidence key={id} title={document.title || id}>{document.text}</Evidence> : null;})}{!item.expected_document_ids?.length && <p className="text-description text-muted-foreground">{t("اطلاعات این پرسش در اسناد مرجع وجود ندارد.")}</p>}</div></details></CardContent></section>
        </div></Card>
        <Card aria-labelledby="review-form-title" className="min-w-0"><CardHeader><CardTitle asChild className="text-label font-normal"><h2 id="review-form-title">{t("نظر شما دربارهٔ این پاسخ")}</h2></CardTitle><CardDescription>{t("۱ ضعیف، ۲ تاحدی، ۳ عمدتاً، ۴ کامل")}</CardDescription></CardHeader><CardContent><form className="space-y-6 p-0" onSubmit={save}>
          {criteria.map(({key,title,guide}) => <fieldset className="m-0 space-y-3 p-0" key={key}><legend className="text-label font-normal">{title}</legend><RadioGroup name={key} value={review[key] ? String(review[key]) : ''} onValueChange={(value) => update({[key]:Number(value)})} disabled={!response || saving} orientation="horizontal" aria-label={title} className="grid grid-cols-2 gap-2">{[1,2,3,4].map((value) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-caption has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle"><RadioGroupItem value={String(value)} aria-label={title + ': ' + number(value) + ' ' + ratingLabels[value]}/><span>{number(value)} · {ratingLabels[value]}</span></label>)}</RadioGroup><details className="border-0 p-0"><summary className="text-caption text-muted-foreground">{t("راهنمای این معیار")}</summary><p className="mt-2 text-caption text-muted-foreground">{guide}</p></details></fieldset>)}
          <TextField label={t("نام ارزیاب")} description={t("برای پیگیری ارزیابی در تاریخچه")} required maxLength={120} value={review.reviewer || ''} disabled={!response || saving} onValueChange={(value) => update({reviewer:value})}/>
          <TextField optional><TextFieldLabel>{t("یادداشت و شواهد")}</TextFieldLabel><TextFieldTextarea rows={3} maxLength={10000} value={review.notes || ''} disabled={!response || saving} onValueChange={(value) => update({notes:value})} placeholder={t("دلیل امتیاز یا بخش مرتبط پاسخ و سند")}/></TextField>
          {!response ? <p className="text-caption text-muted-foreground">{t("ثبت ارزیابی پس از دریافت پاسخ ممکن است.")}</p> : !complete && <p className="text-caption text-muted-foreground">{t("هر چهار معیار و نام ارزیاب را تکمیل کنید.")}</p>}
          <ReviewButton type="submit" fullWidth loading={saving} disabled={!response || saving || !complete}>{index < cases.length-1 ? t("ذخیره و پرسش بعدی") : t("ذخیرهٔ ارزیابی")}</ReviewButton>
          {notice && <p role="status" className="text-description text-muted-foreground">{notice}</p>}
        </form><div className="mt-6 space-y-4"><p className="text-caption text-muted-foreground">{t("پیش‌نویس‌ها تا تغییر اجرا در همین صفحه حفظ می‌شوند.")}</p>      <details className="border-t border-border pt-4"><summary className="text-label">{t("تاریخچهٔ بازبینی این پرسش")}</summary><div className="mt-4 space-y-4">{(reviewHistory?.[item.id] || []).length ? <ol className="space-y-4 ps-4">{[...(reviewHistory[item.id] || [])].reverse().map((entry,i) => <li key={i} className="text-description"><p>{entry.action === 'cleared' ? t("رویداد حذف ارزیابی") : entry.reviewer || 'ارزیاب'} · {when(entry.reviewed_at)}</p>{entry.action !== 'cleared' && <p className="text-caption text-muted-foreground">{criteria.map(({key,title}) => title + ': ' + (entry[key] ? number(entry[key]) : t("ثبت نشده"))).join(t("، "))}</p>}{entry.notes && <p className="whitespace-pre-wrap text-description text-muted-foreground">{entry.notes}</p>}</li>)}</ol> : <p className="text-description text-muted-foreground">{t("هنوز ارزیابی‌ای ثبت نشده است.")}</p>}<ReviewButton variant="ghost" disabled={!reviews?.[item.id] || saving} onClick={() => onClearReview(item.id)}>{t("حذف ارزیابی ثبت‌شده")}</ReviewButton><p className="text-caption text-muted-foreground">{t("حذف با تأیید انجام می‌شود و رویداد آن در تاریخچه می‌ماند.")}</p></div></details></div></CardContent></Card>
      </div>
    </>}
  </div></ControlSizeProvider>;
}
