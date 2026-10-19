import React, { useEffect, useMemo, useState } from 'react';
import { api, download, downloadUrl } from './api.js';
import { Empty, Icon, Modal, SourceCard, StatusToast } from './components.jsx';

const number = (value) => new Intl.NumberFormat('fa-IR').format(Number(value || 0));
const stateNames = { running: 'در حال اجرا', completed: 'پایان‌یافته', failed: 'خطای اجرا', interrupted: 'ناتمام' };
const difficultyNames = { easy: 'آسان', medium: 'متوسط', hard: 'دشوار' };
const slug = (value) => String(value || '').toLocaleLowerCase('fa').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').trim();
const runLabel = (run) => `${new Date(run.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })} · ${run.run_id.slice(0, 8)}`;

function RunRow({ run, active, onClick, compact = false }) {
  return <button className={`${compact ? 'recent-run' : 'dashboard-run-row'}${active ? ' is-active' : ''}`} onClick={onClick}>
    <span className={`run-dot${run.state === 'running' ? ' running' : ''}`} />
    <span><strong>{runLabel(run)}</strong><small>{run.adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'} · {stateNames[run.state] || 'پایان‌یافته'}</small></span>
    {!compact && <span className={`run-state${run.state === 'failed' ? ' failed' : ''}`}>{stateNames[run.state] || 'پایان‌یافته'}</span>}
  </button>;
}

function Diagnostics({ result }) {
  if (!result) return null;
  const errors = result.errors || [], warnings = result.warnings || [];
  return <div className={`suite-diagnostics${errors.length ? ' has-errors' : warnings.length ? ' has-warnings' : ''}`} role="status" aria-live="polite">
    <p>{errors.length ? `اعتبارسنجی ناموفق بود: ${number(errors.length)} خطا.` : 'ساختار مجموعه معتبر است.'}</p>
    {[...errors, ...warnings].map((item, index) => <p key={`${item.path}-${index}`}>{item.path} · {item.message}</p>)}
  </div>;
}

function Dashboard({ suite, report, run, runs, reviews, onView, onStart, onOpenRun, onSuiteDetails, suiteCatalog, suiteKey, onSuiteChange, onCreateSuite, onEditSuite, onValidateSuite, diagnostics }) {
  const casesCount = suite?.cases?.length || 0, reviewed = Object.keys(reviews || {}).length;
  const percent = casesCount ? Math.round(reviewed / casesCount * 100) : 0;
  const metrics = [
    { label: 'مجموع پرسش‌ها', value: suite ? number(casesCount) : '—', detail: suite?.id || 'مجموعهٔ آزمون', icon: 'dashboard', tone: 'violet' },
    { label: 'اجراهای ثبت‌شده', value: number(runs.length), detail: 'در این فضای کاری', icon: 'clock', tone: 'blue' },
    { label: 'بازبینی دستی', value: number(reviewed), detail: suite ? `از ${number(casesCount)} پرسش اجرای انتخاب‌شده` : 'در انتظار اتصال', icon: 'review', tone: 'green' },
    { label: 'وضعیت آخرین اجرا', value: runs[0] ? stateNames[runs[0].state] || 'پایان‌یافته' : 'بدون اجرا', detail: runs[0] ? runLabel(runs[0]) : 'برای شروع، آزمون را اجرا کن.', icon: 'info', tone: 'amber', status: true },
  ];
  const suiteIssues = suiteCatalog.filter((entry) => !entry.valid).flatMap((entry) => (entry.errors || []).map((issue) => ({ ...issue, message: `${entry.suite_key} · ${issue.message}` })));
  const suiteWarnings = suiteCatalog.find((entry) => entry.suite_key === suiteKey)?.warnings || [];
  const catalogDiagnostics = suiteIssues.length || suiteWarnings.length ? { valid: !suiteIssues.length, errors: suiteIssues, warnings: suiteWarnings } : null;
  return <>
    <section className="page-heading"><div><p className="eyebrow">NEXOLAB · RAG EVALUATION</p><h1>داشبورد ارزیابی</h1><p className="muted">وضعیت اجرای آزمون و بازبینی پاسخ‌های مجموعهٔ فارسی</p></div><button className="primary dashboard-run" onClick={onStart}><Icon name="plus" />اجرای آزمون</button></section>
    <section className="stats-grid" aria-label="آمار ارزیابی">{metrics.map((item) => <article className={`stat-card stat-card--${item.tone}`} key={item.label}><div className="stat-card__heading"><span className="stat-card__label">{item.label}</span><Icon name={item.icon} className="stat-card__icon" /></div><strong className={`stat-card__value${item.status ? ' status-value' : ''}`}>{item.value}</strong><small className="stat-card__detail">{item.detail}</small></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel dashboard-panel"><div className="panel-title"><div><h2>اجرای انتخاب‌شده</h2><p className="panel-subtitle">پیشرفت پاسخ‌گویی و بازبینی انسانی</p></div><button className="text-action" disabled={!run} onClick={() => onView('review')}>بازکردن ارزیابی</button></div>
        <div className="latest-body"><div className="latest-overview"><div className="donut" style={{ '--progress': `${percent}%` }}><span>{number(percent)}٪</span></div><div><strong>{report ? `${number(report.results.length)} از ${number(casesCount)} پاسخ آماده است` : 'هنوز اجرایی ثبت نشده'}</strong><p className="muted">{run ? `${run.adapter === 'fixture' ? 'اجرای محلی fixture' : 'اتصال Nexora'} · ${runLabel(run)}` : 'پس از اجرای مجموعه، جزئیات اینجا نمایش داده می‌شود.'}</p></div></div>
          <div className="progress-meta"><span>پرسش‌های بازبینی‌شده</span><span>{number(reviewed)} از {number(casesCount)}</span></div><progress max={casesCount || 1} value={reviewed} />
          <div className="latest-links">{run && <><a className="secondary" href={`/api/runs/${run.run_id}/report.json`} download>گزارش JSON</a>{run.state === 'completed' && <a className="secondary" href={`/api/runs/${run.run_id}/report.csv`} download>گزارش CSV</a>}</>}<button className="secondary" disabled={!run} onClick={() => onView('review')}>ادامهٔ ارزیابی دستی</button></div>
        </div></article>
      <article className="panel dashboard-panel"><div className="panel-title"><div><h2>اجراهای اخیر</h2><p className="panel-subtitle">گزارش‌های ذخیره‌شده در این فضای کاری</p></div><button className="text-action" onClick={() => onView('runs')}>مشاهدهٔ همه</button></div>
        <div className="dashboard-runs">{runs.length ? runs.slice(0, 5).map((item) => <RunRow key={item.run_id} run={item} active={item.run_id === run?.run_id} onClick={() => onOpenRun(item.run_id)} />) : <Empty>هنوز اجرایی ثبت نشده است.</Empty>}</div></article>
    </section>
    <section className="panel suite-panel"><div className="panel-title"><div><h2>مجموعهٔ آزمون فعال</h2><p className="panel-subtitle">مجموعه‌ها را بساز، اعتبارسنجی کن یا برای اجرا انتخاب کن.</p></div><span className="nexora-status nexora-status--info">نسخهٔ {suite?.version || '—'}</span></div>
      <div className="suite-summary"><div><span className="suite-mark">{`{}`}</span><span><strong>{suite?.id || 'در حال بارگذاری…'}</strong><small>{suite ? `${suite.description || 'بدون توضیح'} · ${number(suite.documents.length)} سند · ${number(casesCount)} پرسش` : 'مجموعه و پیکربندی از سرور محلی خوانده می‌شوند.'}</small></span></div><button className="secondary" disabled={!suite} onClick={onSuiteDetails}>جزئیات مجموعه</button></div>
      <div className="suite-management"><label htmlFor="suite-select">مجموعه برای اجرا</label><select id="suite-select" value={suiteKey || ''} onChange={(event) => onSuiteChange(event.target.value)} disabled={!suiteCatalog.length}>{suiteCatalog.map((item) => <option key={item.suite_key} value={item.suite_key} disabled={!item.valid}>{item.id || item.suite_key} · {item.version || 'بدون نسخه'} · {number(item.case_count)} پرسش{item.valid ? '' : ' · نیازمند اصلاح'}</option>)}</select><button className="secondary" onClick={onCreateSuite}>مجموعهٔ جدید</button><button className="secondary" disabled={!suiteKey} onClick={onEditSuite}>ویرایش JSON</button><button className="secondary" disabled={!suiteKey} onClick={onValidateSuite}>اعتبارسنجی</button></div>
      <Diagnostics result={diagnostics || catalogDiagnostics} />
    </section>
  </>;
}

function RunsView({ runs, activeRunId, onOpenRun, onStart, baseline, candidate, setBaseline, setCandidate, onCompare, comparison, comparing }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">تاریخچه</p><h1>اجراهای آزمون</h1><p className="muted">گزارش‌ها به تفکیک شناسه و زمان اجرا نگهداری می‌شوند.</p></div><button className="primary dashboard-run" onClick={onStart}><Icon name="plus" />اجرای آزمون</button></section>
    <section className="panel runs-panel"><div className="panel-title"><h2>همهٔ اجراها</h2><span className="muted">{number(runs.length)} اجرا</span></div><div className="runs-list">{runs.length ? runs.map((item) => <RunRow key={item.run_id} run={item} active={item.run_id === activeRunId} onClick={() => onOpenRun(item.run_id)} />) : <Empty>هنوز اجرایی ثبت نشده است.</Empty>}</div></section>
    <section className="panel compare-panel"><div className="panel-title"><div><h2>مقایسهٔ اجراها</h2><p className="panel-subtitle">تغییر پاسخ، منابع، خطا و زمان را برای هر پرسش ببین.</p></div></div><div className="compare-controls"><label>اجرای مبنا<select value={baseline} onChange={(event) => setBaseline(event.target.value)}><option value="">انتخاب اجرا</option>{runs.map((item) => <option key={item.run_id} value={item.run_id} disabled={item.state !== 'completed'}>{runLabel(item)} · {item.state === 'completed' ? 'پایان‌یافته' : 'ناتمام'}</option>)}</select></label><label>اجرای جدیدتر<select value={candidate} onChange={(event) => setCandidate(event.target.value)}><option value="">انتخاب اجرا</option>{runs.map((item) => <option key={item.run_id} value={item.run_id} disabled={item.state !== 'completed'}>{runLabel(item)} · {item.state === 'completed' ? 'پایان‌یافته' : 'ناتمام'}</option>)}</select></label><button className="primary" disabled={!baseline || !candidate || baseline === candidate || comparing} onClick={onCompare}>{comparing ? 'در حال مقایسه…' : 'مقایسه'}</button></div><Comparison result={comparison} /></section>
  </>;
}

function Comparison({ result }) {
  if (!result) return null;
  const errorText = (error) => error ? `${error.kind}${error.http_status ? ` (${error.http_status})` : ''}` : 'ندارد';
  return <div className="compare-result" role="region" aria-live="polite"><div className="compare-meta"><span>مبنا: {result.baseline_run_id.slice(0, 8)}</span><span>جدید: {result.candidate_run_id.slice(0, 8)}</span><span>مجموعه یکسان: {result.same_suite ? 'بله' : 'خیر'}</span><span>پیکربندی یکسان: {result.same_config ? 'بله' : 'خیر'}</span></div>
    {(!result.same_suite || !result.same_config) && <p className="compare-warning">هشدار: {!result.same_suite ? 'هش مجموعه‌ها متفاوت است. ' : ''}{!result.same_config ? 'هش پیکربندی‌ها متفاوت است.' : ''} revision سامانه: {result.baseline_system_revision || 'ثبت‌نشده'} ← {result.candidate_system_revision || 'ثبت‌نشده'}؛ revision پیکره: {result.baseline_corpus_revision || 'ثبت‌نشده'} ← {result.candidate_corpus_revision || 'ثبت‌نشده'}</p>}
    <p className="compare-summary">{number(result.shared_case_count)} پرسش مشترک · {number(result.answer_changes)} پاسخ تغییرکرده · {number(result.source_changes)} منبع تغییرکرده · {number(result.error_changes)} تغییر در خطا · خطاها {number(result.baseline_errors)} ← {number(result.candidate_errors)}</p>
    {!result.cases.length ? <p className="muted">پرسش مشترکی برای مقایسه وجود ندارد.</p> : <div className="compare-table-wrap"><table className="compare-table"><thead><tr>{['شناسه', 'پاسخ اجرا مبنا', 'پاسخ اجرای جدید', 'منابع مبنا ← جدید', 'خطا مبنا ← جدید', 'اختلاف زمان (ms)'].map((title) => <th key={title}>{title}</th>)}</tr></thead><tbody>{result.cases.map((item) => <tr key={item.case_id}><td>{item.case_id}</td><td className={`compare-answer${item.answer_changed ? ' compare-change' : ''}`}>{item.baseline.answer || '—'}</td><td className={`compare-answer${item.answer_changed ? ' compare-change' : ''}`}>{item.candidate.answer || '—'}</td><td className={item.sources_changed ? 'compare-change' : ''}>{number(item.baseline.source_count)} ← {number(item.candidate.source_count)}{item.sources_changed ? ' · تغییر' : ''}</td><td className={item.error_changed ? 'compare-error' : ''}>{errorText(item.baseline.error)} ← {errorText(item.candidate.error)}</td><td>{item.duration_delta_ms > 0 ? '+' : ''}{number(item.duration_delta_ms)}</td></tr>)}</tbody></table></div>}
  </div>;
}

function ReviewView({ suite, report, run, runs, reviews, onOpenRun, onSaveReview, onClearReview, saving, selected, setSelected, resetKey }) {
  const [query, setQuery] = useState(''), [category, setCategory] = useState(''), [difficulty, setDifficulty] = useState('');
  const [drafts, setDrafts] = useState({});
  useEffect(() => { setDrafts({}); }, [run?.run_id, resetKey]);
  if (!suite) return <section className="page-heading"><div><p className="eyebrow">بازبینی پاسخ و منابع</p><h1>ارزیابی دستی</h1><p className="muted">برای شروع، ابتدا یک مجموعه را انتخاب کن.</p></div></section>;
  const cases = suite.cases || [], item = cases[Math.min(selected, Math.max(0, cases.length - 1))];
  const result = report?.results?.find((row) => row.case_id === item?.id);
  const response = result?.response;
  const review = drafts[item?.id] || reviews[item?.id] || {};
  const categories = [...new Set(cases.map((entry) => entry.category || 'عمومی'))].sort((a, b) => a.localeCompare(b, 'fa'));
  const filtered = cases.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
    (!query || slug(`${entry.id} ${entry.question}`).includes(slug(query)))
    && (!category || (entry.category || 'عمومی') === category)
    && (!difficulty || (entry.difficulty || 'medium') === difficulty));
  const setDraft = (next) => setDrafts((current) => ({ ...current, [item.id]: { ...review, ...next } }));
  const save = async () => {
    const saved = await onSaveReview(item.id, { answer_correct: review.answer_correct, sources_correct: review.sources_correct, notes: review.notes || '' });
    if (saved) setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; });
  };
  const getSourceLabel = (source) => source.filename || source.document_id || 'منبع';
  return <>
    <section className="page-heading"><div><p className="eyebrow">بازبینی پاسخ و منابع</p><h1>ارزیابی دستی</h1><p className="muted">هر پاسخ را با سند مرجع مقایسه کن و نتیجهٔ بررسی را ثبت کن.</p></div><button className="secondary" disabled={!run} onClick={() => download({ schema_version: 1, run_id: run?.run_id, reviews }, `${run?.run_id || 'nexolab'}-reviews.json`)}>دریافت ارزیابی‌ها</button></section>
    <section className="execution-controls"><div><span role="status">{report ? `${stateNames[run?.state] || 'پایان‌یافته'} · ${number(report.results.length)} از ${number(cases.length)}` : 'هنوز اجرا نشده'}</span></div><div className="execution-actions"><label htmlFor="run-history">انتخاب اجرا</label><select id="run-history" value={run?.run_id || ''} onChange={(event) => event.target.value && onOpenRun(event.target.value)}><option value="">انتخاب اجرا</option>{runs.map((entry) => <option key={entry.run_id} value={entry.run_id}>{runLabel(entry)} · {entry.adapter}</option>)}</select>{run && <a className="secondary" href={`/api/runs/${run.run_id}/report.json`} download>گزارش JSON</a>}{run?.state === 'completed' && <a className="secondary" href={`/api/runs/${run.run_id}/report.csv`} download>گزارش CSV</a>}</div></section>
    <div className="run-strip"><strong>{suite.id}</strong><span>{number(Object.keys(reviews).length)} بررسی‌شده</span></div><progress max={cases.length || 1} value={Object.keys(reviews).length} aria-label="پیشرفت ارزیابی" />
    <div className="review-grid"><aside className="case-panel panel"><div className="panel-title"><h2>پرسش‌ها</h2><span className="count">{number(cases.length)}</span></div><label className="search-label" htmlFor="case-search">جست‌وجوی پرسش</label><input id="case-search" type="search" placeholder="جست‌وجو در این مجموعه…" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="case-filters"><label htmlFor="category-filter">موضوع</label><select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">همهٔ موضوع‌ها</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><label htmlFor="difficulty-filter">دشواری</label><select id="difficulty-filter" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">همهٔ سطح‌ها</option>{Object.entries(difficultyNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="case-list">{filtered.map(({ entry, index }) => { const row = report?.results?.find((candidate) => candidate.case_id === entry.id); const isReviewed = Boolean(reviews[entry.id]); return <button key={entry.id} className={`case-item${index === selected ? ' active' : ''}`} aria-current={index === selected} onClick={() => setSelected(index)}><span className="case-top"><span className="mono">{entry.id}</span><span className={`pill${row?.error ? ' error' : row?.response ? ' success' : ''}`}>{row?.error ? 'خطا' : row?.response ? 'پاسخ' : 'در انتظار'}</span></span><span className="case-question">{entry.question}</span><span className="case-meta"><span>{entry.category || 'عمومی'}</span><span>{difficultyNames[entry.difficulty || 'medium']}</span>{isReviewed && <span>بازبینی شد</span>}</span></button>; })}{!filtered.length && <Empty>پرسشی با این فیلترها پیدا نشد.</Empty>}</div><p className="sidebar-note">نظرها روی سرور محلی و جدا از گزارش اصلی هر اجرا ذخیره می‌شوند.</p></aside>
      <section className="answer-panel panel" aria-label="پاسخ مورد انتخاب‌شده"><div className="panel-title"><span className="mono">{item?.id}</span><span className={`pill${result?.error ? ' error' : response ? ' success' : ''}`}>{result?.error ? 'خطای اجرا' : response ? 'پاسخ دریافت شد' : 'در انتظار اجرا'}</span></div><div className="answer-body"><p className="eyebrow">پرسش</p><h2>{item?.question}</h2><div className="answer-heading"><h3>پاسخ سیستم</h3><span className="muted">{result ? `${number(result.duration_ms)} میلی‌ثانیه` : ''}</span></div><p className="answer-text">{response?.answer ?? (result?.error ? 'این درخواست با خطا پایان یافت.' : 'هنوز پاسخی دریافت نشده است.')}</p><div className="sample-note">{result?.error ? `خطا: ${result.error.kind} ${result.error.http_status || ''}` : report?.settings?.adapter === 'fixture' ? 'اجرای fixture؛ پاسخ مرجع بازگردانده شده و خروجی Nexora نیست.' : response ? `شناسهٔ اجرا: ${run.run_id}` : 'برای دریافت پاسخ، آزمون را اجرا کن.'}</div><details open><summary>پاسخ مرجع</summary><p>{item?.reference_answer}</p></details><div className="source-section"><h3>منابع بازیابی‌شده</h3>{response?.sources?.map((source, index) => <SourceCard key={`s-${index}`} title={getSourceLabel(source)}>{source.content || source.excerpt || 'متن موجود نیست.'}</SourceCard>)}{response?.citations?.map((citation, index) => <SourceCard key={`c-${index}`} title={`ارجاع ${citation.id ?? ''} · ${citation.filename || ''}`}>{citation.excerpt || 'متن ارجاع موجود نیست.'}</SourceCard>)}{!response?.sources?.length && !response?.citations?.length && <SourceCard title="بدون منبع بازیابی‌شده">{response ? 'سرویس منبعی برنگردانده است.' : 'منابع پس از اجرا نمایش داده می‌شوند.'}</SourceCard>}<h3 className="reference-title">اسناد مرجع آزمون</h3>{item?.expected_document_ids?.map((id) => { const doc = suite.documents.find((entry) => entry.id === id); return doc && <SourceCard key={id} title={doc.title || doc.id}>{doc.text}</SourceCard>; })}{!item?.expected_document_ids?.length && <SourceCard title="پاسخ ناموجود">اطلاعات مورد سؤال در اسناد مرجع وجود ندارد.</SourceCard>}</div></div><footer className="case-footer"><button className="secondary" disabled={selected === 0 || saving} onClick={() => setSelected(Math.max(0, selected - 1))}>پرسش قبلی</button><span className="muted">{number(selected + 1)} از {number(cases.length)}</span><button className="secondary" disabled={selected >= cases.length - 1 || saving} onClick={() => setSelected(Math.min(cases.length - 1, selected + 1))}>پرسش بعدی</button></footer></section>
      <aside className="evaluation-panel panel"><div className="panel-title"><h2>نتیجهٔ بررسی</h2><span className="muted">{drafts[item?.id] ? 'پیش‌نویس' : reviews[item?.id] ? 'ثبت شده' : 'بررسی نشده'}</span></div><form onSubmit={(event) => { event.preventDefault(); save(); }}><fieldset><legend>آیا پاسخ درست است؟</legend><div className="choices">{[[true, 'بله'], [false, 'خیر']].map(([value, label]) => <label key={label}><input type="radio" name="answer_correct" checked={review.answer_correct === value} disabled={!response || saving} onChange={() => setDraft({ answer_correct: value })} />{label}</label>)}</div></fieldset><fieldset><legend>آیا منابع از پاسخ پشتیبانی می‌کنند؟</legend><div className="choices">{[[true, 'بله'], [false, 'خیر']].map(([value, label]) => <label key={label}><input type="radio" name="sources_correct" checked={review.sources_correct === value} disabled={!response || saving} onChange={() => setDraft({ sources_correct: value })} />{label}</label>)}</div></fieldset><label className="notes-label" htmlFor="review-notes">یادداشت ارزیاب <span className="muted">(اختیاری)</span></label><textarea id="review-notes" rows="5" placeholder="اشتباه، ابهام یا نکتهٔ قابل پیگیری…" value={review.notes || ''} disabled={!response || saving} onChange={(event) => setDraft({ notes: event.target.value })} /><p className="form-help">برای پرسش بدون پاسخ، اعلام نبود اطلاعات را بررسی کن؛ ارجاع نامرتبط را تأیید نکن.</p><button type="submit" className="primary" disabled={!response || saving || review.answer_correct == null || review.sources_correct == null}>{saving ? 'در حال ذخیره…' : 'ثبت و پرسش بعدی'}</button><button type="button" className="quiet clear" disabled={!reviews[item?.id] || saving} onClick={() => onClearReview(item.id)}>پاک‌کردن نظر این پرسش</button></form><div className="review-tip"><h3>معیار بررسی</h3><p>درستی پاسخ و کیفیت منابع را جدا بررسی کن. پاسخ درست هم ممکن است به سند نامرتبط ارجاع داده باشد.</p></div></aside>
    </div>
  </>;
}

export default function App() {
  const [suite, setSuite] = useState(null), [suiteKey, setSuiteKey] = useState(''), [suiteCatalog, setSuiteCatalog] = useState([]);
  const [adapter, setAdapter] = useState('fixture'), [view, setView] = useState('dashboard'), [runs, setRuns] = useState([]);
  const [runId, setRunId] = useState(''), [runData, setRunData] = useState(null), [report, setReport] = useState(null), [reviews, setReviews] = useState({});
  const [selected, setSelected] = useState(0), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState(null), [baseline, setBaseline] = useState(''), [candidate, setCandidate] = useState(''), [comparing, setComparing] = useState(false);
  const [suiteDiagnostics, setSuiteDiagnostics] = useState(null), [editorOpen, setEditorOpen] = useState(false), [editorKey, setEditorKey] = useState(null), [editorTitle, setEditorTitle] = useState(''), [reviewDraftReset, setReviewDraftReset] = useState(0);
  const [suiteJson, setSuiteJson] = useState(''), [editorDiagnostics, setEditorDiagnostics] = useState(null), [editorValid, setEditorValid] = useState(false);
  const [runDialog, setRunDialog] = useState(false), [detail, setDetail] = useState(null), [confirmClear, setConfirmClear] = useState(null);
  const [globalQuery, setGlobalQuery] = useState(''), [globalSearchOpen, setGlobalSearchOpen] = useState(false), [collapsed, setCollapsed] = useState(false), [mobileMenu, setMobileMenu] = useState(false);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('nexolab-theme') === 'dark'; } catch { return false; } });
  const currentSuite = report?.suite || suite;
  const activeRun = runs.find((item) => item.run_id === runId) || (runData ? { run_id: runId, state: runData.state, started_at: runData.report?.started_at, adapter: runData.report?.settings?.adapter } : null);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); try { localStorage.setItem('nexolab-theme', dark ? 'dark' : 'light'); } catch { /* storage can be disabled */ } }, [dark]);
  useEffect(() => {
    let alive = true;
    const initialize = async () => {
      setLoading(true);
      try {
        const info = await api('/api/info'); if (!alive) return;
        setSuite(info.suite); setSuiteKey(info.suite_key || ''); setAdapter(info.adapter || 'fixture');
        const [catalog, runList] = await Promise.all([api('/api/suites'), api('/api/runs')]); if (!alive) return;
        setSuiteCatalog(catalog); setRuns(runList); setBaseline(runList[1]?.run_id || ''); setCandidate(runList[0]?.run_id || '');
        if (runList[0]) await loadRun(runList[0].run_id);
      } catch (error) { if (alive) setMessage(error.message); }
      finally { if (alive) setLoading(false); }
    };
    void initialize();
    return () => { alive = false; };
    // Initialization is intentionally one-shot; loadRun reads stable API helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (runData?.state !== 'running' || !runId) return undefined;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const data = await api(`/api/runs/${runId}`); if (cancelled) return;
        setRunData(data); setReport(data.report); setReviews(data.reviews || {});
        if (data.state !== 'running') {
          const history = await api('/api/runs'); if (!cancelled) setRuns(history);
        }
      } catch (error) { if (!cancelled) setMessage(error.message); }
    }, 900);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [runData?.state, runId]);

  const loadRun = async (id) => {
    setRunId(id); setSelected(0); setSaving(false);
    const data = await api(`/api/runs/${id}`);
    setRunData(data); setReport(data.report); setReviews(data.reviews || {});
  };
  const refreshRuns = async () => {
    const items = await api('/api/runs'); setRuns(items);
    setBaseline((value) => items.some((item) => item.run_id === value) ? value : (items[1]?.run_id || ''));
    setCandidate((value) => items.some((item) => item.run_id === value) ? value : (items[0]?.run_id || ''));
    return items;
  };
  const openRun = async (id) => {
    try { await loadRun(id); setView('review'); setMobileMenu(false); }
    catch (error) { setMessage(error.message); }
  };
  const startRun = async () => {
    try {
      const data = await api('/api/runs', { method: 'POST', body: {} }); setRunDialog(false); setMessage('اجرا شروع شد.');
      await loadRun(data.run_id); setView('review'); await refreshRuns();
    } catch (error) { setMessage(error.message); }
  };
  const activateSuite = async (key) => {
    if (!key) return;
    try {
      const data = await api('/api/suites/select', { method: 'POST', body: { suite_key: key } });
      setSuiteKey(data.suite_key); setSuite(data.suite); setRunId(''); setRunData(null); setReport(null); setReviews({}); setSelected(0); setSuiteDiagnostics(null);
      setView('dashboard'); await refreshRuns(); await reloadSuites(); setMessage(`مجموعهٔ ${data.suite.id} برای اجرای بعدی انتخاب شد.`);
    } catch (error) { setMessage(error.message); }
  };
  const reloadSuites = async () => { const items = await api('/api/suites'); setSuiteCatalog(items); return items; };
  const validateSuite = async () => {
    try { const snapshot = await api(`/api/suites/${encodeURIComponent(suiteKey)}`); setSuiteDiagnostics(await api('/api/suites/validate', { method: 'POST', body: snapshot })); }
    catch (error) { setMessage(error.message); }
  };
  const openEditor = async (create) => {
    try {
      const snapshot = create ? await api('/api/suites/template') : await api(`/api/suites/${encodeURIComponent(suiteKey)}`);
      if (create) snapshot.id = `suite-${Date.now()}`;
      setEditorKey(create ? null : suiteKey); setEditorTitle(create ? 'ساخت مجموعهٔ آزمون' : `ویرایش مجموعهٔ ${snapshot.id}`);
      setSuiteJson(JSON.stringify(snapshot, null, 2)); setEditorDiagnostics(null); setEditorValid(false); setEditorOpen(true);
    } catch (error) { setMessage(error.message); }
  };
  const validateEditor = async () => {
    setEditorValid(false);
    try { const snapshot = JSON.parse(suiteJson); const result = await api('/api/suites/validate', { method: 'POST', body: snapshot }); setEditorDiagnostics(result); setEditorValid(result.valid); return result; }
    catch (error) { const result = { valid: false, errors: [{ path: '$', message: error instanceof SyntaxError ? 'ساختار JSON قابل‌خواندن نیست.' : error.message }], warnings: [] }; setEditorDiagnostics(result); return result; }
  };
  const saveSuite = async () => {
    const result = await validateEditor(); if (!result?.valid) return;
    try {
      const snapshot = JSON.parse(suiteJson);
      const saved = editorKey ? await api(`/api/suites/${encodeURIComponent(editorKey)}`, { method: 'PUT', body: snapshot }) : await api('/api/suites', { method: 'POST', body: snapshot });
      setEditorOpen(false); await activateSuite(saved.suite_key); setMessage(`مجموعهٔ ${snapshot.id} ذخیره و انتخاب شد.`);
    } catch (error) { setEditorDiagnostics({ valid: false, errors: [{ path: '$', message: error.message }], warnings: [] }); }
  };
  const saveReview = async (caseId, review) => {
    if (!runId || saving) return;
    setSaving(true);
    try {
      const updated = await api(`/api/runs/${runId}/reviews/${encodeURIComponent(caseId)}`, { method: 'PUT', body: review });
      setReviews(updated); setMessage(review ? 'نظر روی سرور ثبت شد.' : 'نظر این پرسش پاک شد.');
      if (review && selected < (currentSuite?.cases?.length || 1) - 1) setSelected((value) => value + 1);
      return true;
    } catch (error) { setMessage(error.message); return false; }
    finally { setSaving(false); }
  };
  const compareRuns = async () => {
    setComparing(true); setComparison(null);
    try { setComparison(await api(`/api/compare?baseline=${encodeURIComponent(baseline)}&candidate=${encodeURIComponent(candidate)}`)); }
    catch (error) { setMessage(error.message); }
    finally { setComparing(false); }
  };
  const showView = (name) => { setView(name); setMobileMenu(false); setGlobalSearchOpen(false); };
  const searchGroups = useMemo(() => {
    const query = slug(globalQuery); if (!query) return [];
    const questions = (currentSuite?.cases || []).filter((item) => slug(`${item.id} ${item.question}`).includes(query)).slice(0, 5).map((item) => ({ title: item.question, meta: item.id, action: () => { const index = currentSuite.cases.findIndex((entry) => entry.id === item.id); setSelected(index); showView('review'); } }));
    const matchingRuns = runs.filter((item) => slug(`${runLabel(item)} ${item.run_id} ${item.adapter} ${item.state}`).includes(query)).slice(0, 5).map((item) => ({ title: runLabel(item), meta: `${item.adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'} · ${item.run_id.slice(0, 12)}`, action: () => { void openRun(item.run_id); } }));
    return [{ label: 'پرسش‌ها', items: questions }, { label: 'اجراها', items: matchingRuns }].filter((group) => group.items.length);
  }, [globalQuery, currentSuite, runs]);
  const sidebarClass = `sidebar${mobileMenu ? ' is-open' : ''}`;
  const shellClass = `app-shell${collapsed ? ' sidebar-collapsed' : ''}`;
  const selectedCase = currentSuite?.cases?.[selected];
  const selectedReview = selectedCase ? reviews[selectedCase.id] : null;
  const clearReview = (caseId) => setConfirmClear(caseId);
  const confirmClearReview = async () => { const id = confirmClear; setConfirmClear(null); if (await saveReview(id, null)) setReviewDraftReset((value) => value + 1); };

  return <div className={shellClass}>
    <div className={`sidebar-backdrop${mobileMenu ? ' is-open' : ''}`} onClick={() => setMobileMenu(false)} />
    <aside className={sidebarClass} aria-label="ناوبری اصلی"><div className="sidebar-brand"><a className="brand" href="#dashboard" aria-label="Nexolab by elmira"><img className="brand-symbol" src="/assets/nexolab-symbol.svg" width="36" height="36" alt="" /><img className="brand-symbol-dark" src="/assets/nexolab-symbol-light.svg" width="36" height="36" alt="" /><span><b lang="en" dir="ltr">Nexolab</b><small lang="en" dir="ltr">by elmira</small></span></a><button className="icon-button sidebar-collapse" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} aria-label={collapsed ? 'بازکردن سایدبار' : 'جمع‌کردن سایدبار'} title={collapsed ? 'بازکردن سایدبار' : 'جمع‌کردن سایدبار'}><Icon name={collapsed ? 'sidebarOpen' : 'sidebar'} /></button><button className="icon-button mobile-only" onClick={() => setMobileMenu(false)} aria-label="بستن منو"><Icon name="close" /></button></div>
      <div className="sidebar-tools"><button className="sidebar-new" title="اجرای آزمون جدید" disabled={loading || runData?.state === 'running'} onClick={() => setRunDialog(true)}><Icon name="plus" /><span>اجرای آزمون جدید</span></button></div>
      <nav className="sidebar-nav" aria-label="صفحه‌ها"><p className="sidebar-label">فضای ارزیابی</p>{[['dashboard', 'dashboard', 'داشبورد'], ['review', 'review', 'ارزیابی دستی'], ['runs', 'clock', 'اجراها']].map(([id, icon, label]) => <button key={id} className={`nav-item${view === id ? ' is-active' : ''}`} onClick={() => showView(id)} title={label} aria-label={label}><Icon name={icon} className="nav-icon" /><span>{label}</span></button>)}</nav>
      <section className="sidebar-recent"><div className="recent-heading"><h2 className="sidebar-label">اجراهای اخیر</h2><span className="muted">{number(runs.length)}</span></div><div className="sidebar-runs">{runs.slice(0, 8).map((item) => <RunRow compact key={item.run_id} run={item} active={item.run_id === runId} onClick={() => void openRun(item.run_id)} />)}{!runs.length && <p className="empty-runs">هنوز اجرایی ثبت نشده است.</p>}</div></section></aside>
    <main className="main-shell" dir="rtl"><header className="topbar"><div className="topbar-search"><button className="icon-button mobile-only" onClick={() => setMobileMenu(true)} aria-label="بازکردن منو"><Icon name="menu" /></button><div className="global-search-wrap"><label className="global-searchbox"><Icon name="search" /><input type="search" dir="rtl" placeholder="جست‌وجوی پرسش یا اجرا" autoComplete="off" value={globalQuery} aria-expanded={globalSearchOpen && Boolean(globalQuery)} onFocus={() => setGlobalSearchOpen(true)} onChange={(event) => { setGlobalQuery(event.target.value); setGlobalSearchOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearchOpen(false); }} /></label>{globalSearchOpen && globalQuery && <div className="global-search-results" role="listbox">{searchGroups.length ? searchGroups.map((group) => <section className="global-search-group" key={group.label} role="group" aria-label={group.label}><p className="global-search-heading">{group.label}</p>{group.items.map((item) => <button className="global-search-result" key={`${group.label}-${item.meta}`} role="option" onClick={() => { item.action(); setGlobalQuery(''); setGlobalSearchOpen(false); }}><span className="global-search-result-title">{item.title}</span><small>{item.meta}</small></button>)}</section>) : <p className="global-search-empty">نتیجه‌ای برای این جست‌وجو پیدا نشد.</p>}</div>}</div></div>
      <div className="topbar-actions"><button className="topbar-icon" onClick={() => setDark((value) => !value)} aria-label={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'} title={dark ? 'حالت روشن' : 'حالت تیره'} aria-pressed={dark}><Icon name="theme" /></button><button className="topbar-icon" disabled={!runs.length} onClick={() => runs[0] && void openRun(runs[0].run_id)} aria-label="آخرین اجرا" title={runs[0] ? `آخرین اجرا · ${runLabel(runs[0])}` : 'هنوز اجرایی ثبت نشده است'}><Icon name="bell" /></button><span className="adapter-badge">{adapter === 'fixture' ? 'اجرای محلی fixture' : 'Nexora'}</span><button className="topbar-icon" disabled={!runId} onClick={() => runId && download({ schema_version: 1, run_id: runId, reviews }, `${runId}-reviews.json`)} aria-label="دریافت ارزیابی‌ها" title="دریافت ارزیابی‌ها"><Icon name="download" /></button></div></header>
      <div className="content-scroll" onClick={(event) => { if (!event.target.closest('.global-search-wrap')) setGlobalSearchOpen(false); }}><section className="view-section" hidden={view !== 'dashboard'}><Dashboard suite={suite} report={report} run={activeRun} runs={runs} reviews={reviews} onView={showView} onStart={() => setRunDialog(true)} onOpenRun={(id) => void openRun(id)} onSuiteDetails={() => suite && setDetail({ title: suite.id, subtitle: 'مجموعهٔ انتخاب‌شده برای اجرای بعدی', text: `${suite.description || ''}\n\nنسخه: ${suite.version || 'ثبت‌نشده'}\n${suite.documents.length} سند\n${suite.cases.length} پرسش\n\nشناسهٔ اسناد: ${suite.documents.map((item) => item.id).join('، ')}` })} suiteCatalog={suiteCatalog} suiteKey={suiteKey} onSuiteChange={activateSuite} onCreateSuite={() => void openEditor(true)} onEditSuite={() => void openEditor(false)} onValidateSuite={validateSuite} diagnostics={suiteDiagnostics} /></section>
        <section className="view-section" hidden={view !== 'runs'}><RunsView runs={runs} activeRunId={runId} onOpenRun={(id) => void openRun(id)} onStart={() => setRunDialog(true)} baseline={baseline} candidate={candidate} setBaseline={setBaseline} setCandidate={setCandidate} onCompare={compareRuns} comparison={comparison} comparing={comparing} /></section>
        <section className="view-section" hidden={view !== 'review'}><ReviewView suite={currentSuite} report={report} run={activeRun} runs={runs} reviews={reviews} onOpenRun={openRun} onSaveReview={saveReview} onClearReview={clearReview} saving={saving} selected={selected} setSelected={setSelected} resetKey={reviewDraftReset} /></section>
        <div className="react-connection-state" hidden={!loading}>{suite ? 'در حال دریافت اطلاعات اجراها…' : 'در حال اتصال به سرور محلی…'}</div>
      </div></main>
    <StatusToast message={message} onClose={() => setMessage('')} />
    <Modal open={runDialog} onClose={() => setRunDialog(false)} title="اجرای مجموعهٔ آزمون" subtitle="یک اجرای مستقل با تنظیمات فعلی سرور ثبت می‌شود." icon="play" footer={<><button className="secondary" onClick={() => setRunDialog(false)}>انصراف</button><button className="primary" disabled={loading || runData?.state === 'running'} onClick={() => void startRun()}>شروع اجرا</button></>}><div className="dialog-info"><span>مجموعهٔ آزمون</span><strong>{suite?.id || '—'}</strong></div><div className="dialog-info"><span>آداپتر</span><strong>{adapter === 'fixture' ? 'Fixture محلی · پاسخ ساختگی' : 'Nexora · API متصل'}</strong></div><p className="dialog-note">پاسخ‌ها، منابع، خطاها و زمان اجرا در گزارش این اجرا ذخیره می‌شوند. اجرای fixture فقط برای آزمایش رابط است.</p></Modal>
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editorTitle} subtitle="قالب JSON نسخهٔ ۱ را ویرایش و پیش از ذخیره اعتبارسنجی کن." icon="dashboard" className="suite-editor-dialog" footer={<><button className="secondary" onClick={() => setEditorOpen(false)}>بستن</button><button className="secondary" onClick={() => void validateEditor()}>اعتبارسنجی</button><button className="primary" disabled={!editorValid} onClick={() => void saveSuite()}>ذخیرهٔ مجموعه</button></>}><label className="editor-label" htmlFor="suite-json-editor">محتوای مجموعه</label><textarea id="suite-json-editor" className="suite-json-editor" rows="18" dir="ltr" spellCheck="false" value={suiteJson} onChange={(event) => { setSuiteJson(event.target.value); setEditorValid(false); setEditorDiagnostics({ valid: false, errors: [{ path: '$', message: 'محتوا تغییر کرده است؛ برای بررسی دوباره اعتبارسنجی را اجرا کن.' }], warnings: [] }); }} /><Diagnostics result={editorDiagnostics} /></Modal>
    <Modal open={Boolean(confirmClear)} onClose={() => setConfirmClear(null)} title="پاک‌کردن ارزیابی" subtitle={`نظر ثبت‌شده برای پرسش ${confirmClear || ''} حذف شود؟`} icon="info" footer={<><button className="secondary" onClick={() => setConfirmClear(null)}>انصراف</button><button className="primary danger-action" onClick={() => void confirmClearReview()}>پاک‌کردن ارزیابی</button></>} />
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title} subtitle={detail?.subtitle} icon="search"><div className="detail-dialog-content">{detail?.text}</div></Modal>
  </div>;
}
