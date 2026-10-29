import {t, locale, getLanguage} from './i18n.js';
import React, { useState } from 'react';
import {LibraryBig, Plus, Files, MessageSquare, CheckCheck, Pencil, ShieldCheck} from 'lucide-react';
import './test-suites.css';
import { Button } from '@/components/ui/button';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { TextField } from '@/components/ui/text-field';

const number = (value) => Number(value || 0).toLocaleString(locale());
const secondary = 'font-normal shadow-none transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-subtle-foreground';
const primary = 'font-normal shadow-none transition-colors hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100';
export function searchSuites(suites, query) {
  const normalize = (value) => String(value || '').toLocaleLowerCase('fa').replaceAll('ي','ی').replaceAll('ك','ک').trim();
  return suites.filter((item) => normalize([item.id,item.suite_key,item.description].join(' ')).includes(normalize(query)));
}

export default function SuitesPage({ suites, selected, suite, busy, onSelect, onCreate, onEdit, onValidate, diagnostics }) {
  const fa=getLanguage()==='fa';
  const [query,setQuery] = useState('');
  const [validating,setValidating] = useState(false);
  const filtered = searchSuites(suites,query);
  const locked = busy || validating;
  const validate = async () => {setValidating(true);try {await onValidate();} finally {setValidating(false);}};
  return <ControlSizeProvider size="default"><div className="test-suites dig-surface space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8"><div className="space-y-2"><span className="test-suites__eyebrow"><LibraryBig size={16} aria-hidden="true"/>{fa?"کتابخانهٔ ارزیابی":"Evaluation library"}</span><h1 className="text-heading font-normal">{t("مجموعه‌های آزمون")}</h1><p className="text-description text-muted-foreground">{t("هر مجموعه شامل پرسش‌ها، پاسخ‌های مرجع و اسناد آزمون است.")}</p></div><Button className={primary} disabled={locked} onClick={onCreate}><Plus size={16} aria-hidden="true"/>{t("ساخت مجموعهٔ جدید")}</Button></header>
    {suites.length>0 && <section className="test-suites__summary" aria-label={fa?'خلاصهٔ کتابخانه':'Library overview'}>{[{label:fa?'مجموعه‌های موجود':'Available suites',value:suites.length,Icon:LibraryBig},{label:fa?'پرسش‌های آزمون':'Test questions',value:suites.reduce((sum,item)=>sum+(item.case_count||0),0),Icon:MessageSquare},{label:fa?'اسناد مرجع':'Reference documents',value:suites.reduce((sum,item)=>sum+(item.document_count||0),0),Icon:Files}].map(({label,value,Icon})=><article key={label}><div><span>{label}</span><Icon size={18} aria-hidden="true"/></div><strong>{number(value)}</strong></article>)}</section>}
    {suites.length > 0 && <section aria-label={t("جست‌وجوی مجموعه‌ها")} className="test-suites__search space-y-2"><TextField label={t("جست‌وجوی مجموعه")} placeholder={t("نام یا توضیح مجموعه")} value={query} onValueChange={setQuery}/><p className="text-caption text-muted-foreground">{t("مجموعهٔ انتخاب‌شده برای آزمون بعدی استفاده می‌شود.")}</p></section>}
    <section aria-labelledby="suites-list-title" className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 id="suites-list-title" className="text-label font-normal">{t("مجموعه‌های موجود")}</h2><p role="status" className="text-caption text-muted-foreground">{number(filtered.length)} {t("مجموعه")}</p></div>
      <div className="test-suites__list">
        {!suites.length ? <div className="space-y-3 p-6"><h3 className="text-body font-normal">{t("هنوز مجموعه‌ای ندارید")}</h3><p className="text-description text-muted-foreground">{t("با «ساخت مجموعهٔ جدید» پرسش‌ها و اسناد اولین آزمون را اضافه کنید.")}</p></div> : !filtered.length ? <div className="space-y-4 p-6"><h3 className="text-body font-normal">{t("مجموعه‌ای پیدا نشد")}</h3><Button variant="outline" className={secondary} onClick={() => setQuery('')}>{t("پاک‌کردن جست‌وجو")}</Button></div> : <ul className="test-suites__cards">{filtered.map((item) => {
          const active = item.suite_key === selected;
          return <li key={item.suite_key} className={"test-suites__card space-y-4 p-5"+(active?" is-active":"")}>
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center gap-3"><span className="test-suites__icon"><LibraryBig size={20} aria-hidden="true"/></span><h3 className="m-0 break-all text-body font-normal"><bdi>{item.id || item.suite_key}</bdi></h3>{active && <span className="rounded-md bg-primary-subtle px-2 py-1 text-caption text-primary-subtle-foreground">{t("انتخاب‌شده برای آزمون")}</span>}</div>{item.description && <p dir="auto" className="test-suites__description text-description text-muted-foreground">{item.description}</p>}<dl className="test-suites__metadata"><div><dt>{fa?'پرسش‌ها':'Questions'}</dt><dd>{number(item.case_count)}</dd></div><div><dt>{fa?'اسناد مرجع':'Reference documents'}</dt><dd>{number(item.document_count)}</dd></div><div><dt>{fa?'نسخه':'Version'}</dt><dd><bdi>{item.version||t('ثبت‌نشده')}</bdi></dd></div></dl><p className={'text-caption ' + (item.valid ? 'text-muted-foreground' : 'text-destructive')}>{item.valid ? t("ساختار معتبر") : t("نیازمند اصلاح؛ تا رفع خطاها قابل انتخاب نیست")}</p></div>{!active && <Button variant="outline" className={secondary} disabled={!item.valid || locked} onClick={() => onSelect(item.suite_key)} aria-label={t("انتخاب مجموعهٔ ") + (item.id || item.suite_key)}>{t("انتخاب مجموعه")}</Button>}</div>
            {!item.valid && <details className="border-0 p-0"><summary className="text-caption text-muted-foreground">{t("مشاهدهٔ خطاهای مجموعه")}</summary><ul className="mt-3 space-y-2 ps-4">{(item.errors || []).map((error,i) => <li key={i} className="text-description text-destructive"><bdi>{error.path}</bdi> · {error.message}</li>)}</ul></details>}
            {active && <div className="space-y-4 border-t border-border pt-4">
              <div className="flex flex-wrap gap-3"><Button variant="outline" className={secondary} disabled={locked} onClick={onEdit}><Pencil size={14} aria-hidden="true"/>{t("ویرایش مجموعه")}</Button><Button variant="ghost" className={secondary} disabled={locked} loading={validating} onClick={() => void validate()}><ShieldCheck size={15} aria-hidden="true"/>{t("بررسی اعتبار مجموعه")}</Button></div>
              <p className="text-caption text-muted-foreground">{t("ویرایش در قالب JSON انجام می‌شود؛ پیش از ذخیره، ساختار مجموعه بررسی خواهد شد.")}</p>
              {suite && <details className="border-0 p-0"><summary className="text-label text-muted-foreground">{t("پیش‌نمایش پرسش‌ها و اسناد")}</summary><div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2"><section aria-label={t("پرسش‌های مجموعه")} className="min-w-0 space-y-3"><h4 className="m-0 text-label font-normal">{t("پرسش‌ها")}</h4><ol className="m-0 space-y-3 ps-4">{(suite.cases || []).slice(0,5).map((entry) => <li key={entry.id} className="text-description">{entry.question}</li>)}</ol>{suite.cases?.length > 5 && <p className="text-caption text-muted-foreground">{t("نمایش ۵ پرسش اول؛ همهٔ پرسش‌ها در ویرایش مجموعه در دسترس‌اند.")}</p>}</section><section aria-label={t("اسناد مجموعه")} className="min-w-0 space-y-3"><h4 className="m-0 text-label font-normal">{t("اسناد مرجع")}</h4>{(suite.documents || []).slice(0,5).map((entry) => <p key={entry.id} className="text-description">{entry.title || entry.id}</p>)}{suite.documents?.length > 5 && <p className="text-caption text-muted-foreground">{t("نمایش ۵ سند اول؛ همهٔ اسناد در ویرایش مجموعه در دسترس‌اند.")}</p>}</section></div></details>}
              {diagnostics}
            </div>}
          </li>;
        })}</ul>}
      </div>
    </section>
  </div></ControlSizeProvider>;
}
