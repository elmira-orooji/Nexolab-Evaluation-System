import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const states = {running:'در حال اجرا',completed:'پایان‌یافته',failed:'خطای اجرا',interrupted:'ناتمام'};
const count = (value) => value.toLocaleString('fa-IR');
const date = (value) => new Date(value).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export const runTitle = (run) => (run.adapter === 'fixture' ? 'آزمون آزمایشی' : 'آزمون ' + run.adapter) + ' · ' + date(run.started_at);
const searchKey = (value) => value.toLocaleLowerCase('fa').replaceAll('ي','ی').replaceAll('ك','ک').replace(/[۰-۹]/g,(digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).trim();
const secondary = 'font-normal shadow-none transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-subtle-foreground';

export function filterRuns(runs, query, state) {
  const needle = searchKey(query);
  return runs.filter((run) => (state === 'all' || run.state === state) && searchKey([
    run.run_id, runTitle(run), run.adapter === 'fixture' ? 'آزمایشی fixture' : run.adapter,
    states[run.state] || run.state,
  ].join(' ')).includes(needle)).sort((a,b) => new Date(b.started_at) - new Date(a.started_at));
}

export default function RunsPage({runs,activeRunId,onOpenRun,onStart}) {
  const [query,setQuery] = useState('');
  const [state,setState] = useState('all');
  const [page,setPage] = useState(0);
  const filtered = filterRuns(runs,query,state);
  const lastPage = Math.max(0,Math.ceil(filtered.length / 10)-1);
  const currentPage = Math.min(page,lastPage);
  const visible = filtered.slice(currentPage*10,currentPage*10+10);
  const clear = () => {setQuery('');setState('all');setPage(0);};
  return <ControlSizeProvider size="default"><div className="dig-surface space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
      <div className="space-y-2"><h1 className="text-subheading font-normal">اجراهای آزمون</h1><p className="text-description text-muted-foreground">اجرای موردنظر را پیدا کنید و پاسخ‌ها و منابع آن را بررسی کنید.</p></div>
      <Button className="font-normal shadow-none transition-colors hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100" onClick={onStart}>اجرای آزمون جدید</Button>
    </header>
    {runs.length > 0 && <section aria-label="جست‌وجو و فیلتر اجراها" className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
      <div className="min-w-0 md:col-span-2"><TextField label="جست‌وجوی اجرا" placeholder="شناسه، تاریخ یا نوع اتصال" value={query} onValueChange={(value) => {setQuery(value);setPage(0);}}/></div>
      <div className="min-w-0 space-y-2"><label id="runs-state-label" className="text-label">وضعیت اجرا</label><Select dir="rtl" value={state} onValueChange={(value) => {setState(value);setPage(0);}}><SelectTrigger aria-labelledby="runs-state-label" className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همهٔ وضعیت‌ها</SelectItem>{Object.entries(states).map(([key,label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
    </section>}
    <section aria-labelledby="runs-list-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="runs-list-title" className="text-label font-normal">{query || state !== 'all' ? 'نتیجهٔ جست‌وجو' : 'همهٔ اجراها'}</h2><p role="status" className="text-caption text-muted-foreground">{count(filtered.length)} اجرا · جدیدترین ابتدا</p></div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {!runs.length ? <div className="space-y-3 p-8"><h3 className="text-body font-normal">هنوز آزمونی اجرا نشده است</h3><p className="text-description text-muted-foreground">از «اجرای آزمون جدید» شروع کنید. پاسخ‌ها و وضعیت هر اجرا اینجا نمایش داده می‌شوند.</p></div> : !filtered.length ? <div className="space-y-4 p-8"><h3 className="text-body font-normal">اجرایی با این مشخصات پیدا نشد</h3><p className="text-description text-muted-foreground">عبارت جست‌وجو یا وضعیت انتخاب‌شده را تغییر دهید.</p><Button variant="outline" className={secondary} onClick={clear}>پاک‌کردن فیلترها</Button></div> : <ul className="m-0 list-none divide-y divide-border p-0">{visible.map((run) => <li key={run.run_id} className="grid grid-cols-1 items-center gap-4 p-4 transition-colors hover:bg-primary-subtle lg:grid-cols-3 lg:gap-6">
          <div className="min-w-0 space-y-2"><h3 className="m-0 text-label font-normal">{run.adapter === 'fixture' ? 'آزمون آزمایشی' : 'آزمون ' + run.adapter}</h3><p className="text-caption text-muted-foreground"><time dateTime={run.started_at}>{date(run.started_at)}</time> · به وقت تهران</p><details className="border-0 p-0"><summary className="text-caption text-muted-foreground">شناسهٔ فنی کامل</summary><div className="mt-2 flex justify-start"><bdi dir="ltr" className="block max-w-full break-all text-end select-all text-caption text-muted-foreground">{run.run_id}</bdi></div></details>{run.run_id === activeRunId && <p className="text-caption text-primary">آخرین اجرای بازشده</p>}</div>
          <dl className="m-0 grid grid-cols-2 gap-4 text-caption"><div className="space-y-1"><dt className="text-muted-foreground">نوع اتصال</dt><dd className="m-0">{run.adapter === 'fixture' ? 'آزمایشی' : run.adapter}</dd></div><div className="space-y-1"><dt className="text-muted-foreground">وضعیت</dt><dd className={'m-0 ' + (run.state === 'failed' ? 'text-destructive' : run.state === 'running' ? 'text-primary' : 'text-foreground')}>{states[run.state] || 'نامشخص'}</dd></div></dl>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end"><Button variant="outline" className={secondary} aria-label={'بررسی پاسخ‌های ' + runTitle(run)} onClick={() => onOpenRun(run.run_id)}>بررسی پاسخ‌ها</Button></div>
        </li>)}</ul>}
      </div>
    </section>
    {filtered.length > 10 && <nav aria-label="صفحه‌بندی اجراها" className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" className={secondary} disabled={currentPage === 0} onClick={() => setPage(currentPage-1)}>صفحهٔ قبلی</Button><p className="text-caption text-muted-foreground">صفحهٔ {count(currentPage+1)} از {count(lastPage+1)}</p><Button variant="outline" className={secondary} disabled={currentPage === lastPage} onClick={() => setPage(currentPage+1)}>صفحهٔ بعدی</Button></nav>}
  </div></ControlSizeProvider>;
}
