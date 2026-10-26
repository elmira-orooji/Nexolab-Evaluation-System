import ComparisonPage from './ComparisonPage.jsx';
import ReviewView from './ReviewView.jsx';
import RunsPage from './RunsPage.jsx';
import { SuitesPage, GuidePage, ConnectionPage } from './WorkspacePages.jsx';
import './workspace-pages.css';
import './runs-view.css';
import RunSetup from './RunSetup.jsx';
import Dashboard from './Dashboard.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { api, downloadUrl } from './api.js';
import { Icon, Modal, StatusToast } from './components.jsx';

const number = (value) => new Intl.NumberFormat('fa-IR').format(Number(value || 0));
const reviewCriteria = [
  { key: 'correctness', title: 'درستی پاسخ', guide: '۱: نادرست یا بی‌پشتوانه؛ ۲: بخشی درست با خطای مهم؛ ۳: درست با ایراد جزئی؛ ۴: دقیق و مستند.' },
  { key: 'relevance', title: 'ارتباط با پرسش', guide: '۱: بی‌ارتباط؛ ۲: پاسخ ناقص یا پر از حاشیه؛ ۳: پاسخ‌گو با کمی حاشیه؛ ۴: مستقیم و متمرکز.' },
  { key: 'source_adequacy', title: 'کفایت منبع', guide: '۱: شاهد مرتبطی نیست؛ ۲: شواهد ناکافی؛ ۳: بیشتر ادعاها پشتیبانی می‌شوند؛ ۴: همهٔ ادعاهای اصلی پوشش دارند.' },
  { key: 'citation_quality', title: 'کیفیت استناد', guide: '۱: ارجاع غایب یا نادرست؛ ۲: قابل ردیابی اما ناقص؛ ۳: عمدتاً دقیق با ایراد جزئی؛ ۴: هر ادعا به شاهد درست وصل است.' },
];
const ratingLabels = { 1: 'ضعیف', 2: 'تاحدی', 3: 'عمدتاً', 4: 'کامل' };
const adapterErrorNames = {
  authentication_error: 'توکن Nexora پذیرفته نشد', authorization_error: 'مجوز دسترسی Nexora رد شد',
  rate_limited: 'محدودیت نرخ Nexora', timeout_error: 'مهلت انتظار برای Nexora تمام شد',
  incomplete_response: 'پاسخ Nexora ناقص بود', invalid_json: 'پاسخ Nexora JSON معتبر نبود',
  invalid_response: 'ساختار پاسخ با قرارداد Nexora سازگار نبود', transport_error: 'ارتباط با Nexora برقرار نشد',
  http_error: 'Nexora درخواست را نپذیرفت',
};
const slug = (value) => String(value || '').toLocaleLowerCase('fa').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').trim();
const runLabel = (run) => `${new Date(run.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })} · ${run.run_id.slice(0, 8)}`;

function Diagnostics({ result }) {
  if (!result) return null;
  const errors = result.errors || [], warnings = result.warnings || [];
  return <div className={`suite-diagnostics${errors.length ? ' has-errors' : warnings.length ? ' has-warnings' : ''}`} role="status" aria-live="polite">
    <p>{errors.length ? `اعتبارسنجی ناموفق بود: ${number(errors.length)} خطا.` : 'ساختار مجموعه معتبر است.'}</p>
    {[...errors, ...warnings].map((item, index) => <p key={`${item.path}-${index}`}>{item.path} · {item.message}</p>)}
  </div>;
}

function RunsView(props) {
  return props.comparisonOnly ? <ComparisonPage {...props}/> : <RunsPage {...props}/>;
}
export default function App({onLogout}) {
  const [suite, setSuite] = useState(null), [suiteKey, setSuiteKey] = useState(''), [suiteCatalog, setSuiteCatalog] = useState([]);
  const [adapter, setAdapter] = useState('fixture'), [view, setView] = useState('dashboard'), [runs, setRuns] = useState([]);
  const [runId, setRunId] = useState(''), [runData, setRunData] = useState(null), [report, setReport] = useState(null), [reviews, setReviews] = useState({}), [reviewHistory, setReviewHistory] = useState({});
  const [selected, setSelected] = useState(0), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState(null), [baseline, setBaseline] = useState(''), [candidate, setCandidate] = useState(''), [comparing, setComparing] = useState(false);
  const [suiteDiagnostics, setSuiteDiagnostics] = useState(null), [editorOpen, setEditorOpen] = useState(false), [editorKey, setEditorKey] = useState(null), [editorTitle, setEditorTitle] = useState(''), [reviewDraftReset, setReviewDraftReset] = useState(0);
  const [suiteJson, setSuiteJson] = useState(''), [editorDiagnostics, setEditorDiagnostics] = useState(null), [editorValid, setEditorValid] = useState(false);
  const [startingRun, setStartingRun] = useState(false), [detail, setDetail] = useState(null), [confirmClear, setConfirmClear] = useState(null);
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
        setRunData(data); setReport(data.report); setReviews(data.reviews || {}); setReviewHistory(data.review_history || {});
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
    setRunData(data); setReport(data.report); setReviews(data.reviews || {}); setReviewHistory(data.review_history || {});
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
    if (startingRun) return;
    setStartingRun(true);
    try {
      const data = await api('/api/runs', { method: 'POST', body: {} });  setMessage('اجرا شروع شد.');
      await loadRun(data.run_id); setView('review'); await refreshRuns();
    } catch (error) { setMessage(error.message); } finally { setStartingRun(false); }
  };
  const activateSuite = async (key, destination = 'dashboard') => {
    if (!key) return;
    setLoading(true);
    try {
      const data = await api('/api/suites/select', { method: 'POST', body: { suite_key: key } });
      setSuiteKey(data.suite_key); setSuite(data.suite); setRunId(''); setRunData(null); setReport(null); setReviews({}); setReviewHistory({}); setSelected(0); setSuiteDiagnostics(null);
      setView(destination); await refreshRuns(); await reloadSuites(); setMessage(`مجموعهٔ ${data.suite.id} برای اجرای بعدی انتخاب شد.`);
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
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
      setReviews(updated.reviews); setReviewHistory(updated.review_history); setMessage(review ? 'بازبینی با زمان ثبت و به تاریخچه افزوده شد.' : 'رویداد حذف در تاریخچه ثبت شد.');
      if (review && selected < (currentSuite?.cases?.length || 1) - 1) setSelected((value) => value + 1);
      return true;
    } catch (error) { setMessage(error.message); return false; }
    finally { setSaving(false); }
  };
  const compareRuns = async () => {
    setComparing(true); setComparison(null);
    try { setComparison(await api(`/api/compare?baseline=${encodeURIComponent(baseline)}&candidate=${encodeURIComponent(candidate)}`)); return true; }
    catch (error) { setMessage(error.message); return false; }
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
      <nav className="sidebar-nav" aria-label="صفحه‌ها">
        <div className="sidebar-nav-group"><p className="sidebar-label">نمای کلی</p>
          <button className={view === 'new-run' ? 'nav-item is-active' : 'nav-item'} title="اجرای آزمون جدید" aria-label="اجرای آزمون جدید" aria-current={view === 'new-run' ? 'page' : undefined} onClick={() => showView('new-run')}><Icon name="plus" className="nav-icon" /><span>اجرای آزمون جدید</span></button>
          <button className={`nav-item${view === 'dashboard' ? ' is-active' : ''}`} onClick={() => showView('dashboard')} title="داشبورد" aria-label="داشبورد" aria-current={view === 'dashboard' ? 'page' : undefined}><Icon name="dashboard" className="nav-icon" /><span>داشبورد</span></button>
        </div>
        <div className="sidebar-nav-group"><p className="sidebar-label">ارزیابی</p>
          <button className={`nav-item${view === 'review' ? ' is-active' : ''}`} onClick={() => showView('review')} title="ارزیابی دستی" aria-label="ارزیابی دستی" aria-current={view === 'review' ? 'page' : undefined}><Icon name="review" className="nav-icon" /><span>ارزیابی دستی</span></button>
          <button className={`nav-item${view === 'runs' ? ' is-active' : ''}`} onClick={() => showView('runs')} title="اجراها" aria-label={`اجراها، ${runs.length} مورد`} aria-current={view === 'runs' ? 'page' : undefined}><Icon name="clock" className="nav-icon" /><span>اجراها</span>{Boolean(runs.length) && <small className="nav-count">{number(runs.length)}</small>}</button>
        </div>
{[['suites','مجموعه‌های آزمون','suites'],['compare','مقایسهٔ اجراها','compare']].map(([key,label,icon]) => <button key={key} className={`nav-item${view === key ? ' is-active' : ''}`} onClick={() => showView(key)} title={label} aria-label={label} aria-current={view === key ? 'page' : undefined}><Icon name={icon} className="nav-icon"/><span>{label}</span></button>)}
      </nav>
      <nav className="sidebar-nav sidebar-utilities" aria-label="راهنما و تنظیمات">{[['connection','اتصال و تنظیمات','settings'],['guide','راهنمای ارزیابی','guide']].map(([key,label,icon]) => <button key={key} className={view === key ? 'nav-item is-active' : 'nav-item'} onClick={() => showView(key)} title={label} aria-label={label}><Icon name={icon} className="nav-icon"/><span>{label}</span></button>)}</nav>
      {onLogout && <button className="nav-item" onClick={onLogout}><Icon name="close" className="nav-icon"/><span>خروج از حساب</span></button>}
    </aside>
    <main className="main-shell" dir="rtl"><header className="topbar"><div className="topbar-search"><button className="icon-button mobile-only" onClick={() => setMobileMenu(true)} aria-label="بازکردن منو"><Icon name="menu" /></button><div className="global-search-wrap"><label className="global-searchbox"><Icon name="search" /><input type="search" dir="rtl" placeholder="جست‌وجوی پرسش یا اجرا" autoComplete="off" value={globalQuery} aria-expanded={globalSearchOpen && Boolean(globalQuery)} onFocus={() => setGlobalSearchOpen(true)} onChange={(event) => { setGlobalQuery(event.target.value); setGlobalSearchOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearchOpen(false); }} /></label>{globalSearchOpen && globalQuery && <div className="global-search-results" role="listbox">{searchGroups.length ? searchGroups.map((group) => <section className="global-search-group" key={group.label} role="group" aria-label={group.label}><p className="global-search-heading">{group.label}</p>{group.items.map((item) => <button className="global-search-result" key={`${group.label}-${item.meta}`} role="option" onClick={() => { item.action(); setGlobalQuery(''); setGlobalSearchOpen(false); }}><span className="global-search-result-title">{item.title}</span><small>{item.meta}</small></button>)}</section>) : <p className="global-search-empty">نتیجه‌ای برای این جست‌وجو پیدا نشد.</p>}</div>}</div></div>
      <div className="topbar-actions"><button className="topbar-icon topbar-notifications" disabled={!runs.length} onClick={() => runs[0] && void openRun(runs[0].run_id)} aria-label="آخرین اجرا" title={runs[0] ? `آخرین اجرا · ${runLabel(runs[0])}` : 'هنوز اجرایی ثبت نشده است'}><Icon name="bell" />{runs[0] && ['running', 'failed'].includes(runs[0].state) && <span className={`topbar-notification-dot${runs[0].state === 'failed' ? ' is-error' : ''}`} />}</button><button className="topbar-icon" onClick={() => setDark((value) => !value)} aria-label={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'} title={dark ? 'حالت روشن' : 'حالت تیره'} aria-pressed={dark}><Icon name="theme" /></button></div></header>
      <div className="content-scroll" onClick={(event) => { if (!event.target.closest('.global-search-wrap')) setGlobalSearchOpen(false); }}><section className="view-section" hidden={view !== 'dashboard'}><Dashboard suite={suite} report={report} run={activeRun} runs={runs} reviews={reviews} onView={showView} onStart={() => showView('new-run')} onOpenRun={(id) => void openRun(id)} onSuiteDetails={() => suite && setDetail({ title: suite.id, subtitle: 'مجموعهٔ انتخاب‌شده برای اجرای بعدی', text: `${suite.description || ''}\n\nنسخه: ${suite.version || 'ثبت‌نشده'}\n${suite.documents.length} سند\n${suite.cases.length} پرسش\n\nشناسهٔ اسناد: ${suite.documents.map((item) => item.id).join('، ')}` })} suiteCatalog={suiteCatalog} suiteKey={suiteKey} onSuiteChange={activateSuite} onCreateSuite={() => void openEditor(true)} onEditSuite={() => void openEditor(false)} onValidateSuite={validateSuite} diagnostics={suiteDiagnostics} /></section>
        <section className="view-section" hidden={view !== 'new-run'}><RunSetup suite={suite} suiteKey={suiteKey} suites={suiteCatalog} adapter={adapter} busy={loading || startingRun} running={runs.some((item) => item.state === 'running')} onSelect={(key) => void activateSuite(key, 'new-run')} onStart={() => void startRun()} onBack={() => showView('dashboard')} /></section><section className={view === 'compare' ? 'view-section comparison-only' : 'view-section'} hidden={!['runs', 'compare'].includes(view)}><RunsView comparisonOnly={view === 'compare'} runs={runs} activeRunId={runId} onOpenRun={(id) => void openRun(id)} onStart={() => showView('new-run')} baseline={baseline} candidate={candidate} setBaseline={setBaseline} setCandidate={setCandidate} onCompare={compareRuns} comparison={comparison} comparing={comparing} /></section>
        <section className="view-section" hidden={view !== 'review'}><ReviewView criteria={reviewCriteria} ratingLabels={ratingLabels} errorNames={adapterErrorNames} suite={currentSuite} report={report} run={activeRun} runs={runs} reviews={reviews} reviewHistory={reviewHistory} onOpenRun={openRun} onSaveReview={saveReview} onClearReview={clearReview} saving={saving} selected={selected} setSelected={setSelected} resetKey={reviewDraftReset} /></section>
<section className="view-section" hidden={view !== 'suites'}><SuitesPage suites={suiteCatalog} selected={suiteKey} suite={suite} busy={loading} onSelect={(key) => void activateSuite(key, 'suites')} onCreate={() => void openEditor(true)} onEdit={() => void openEditor(false)} onValidate={validateSuite} diagnostics={<Diagnostics result={suiteDiagnostics}/>} /></section>
<section className="view-section" hidden={view !== 'guide'}><GuidePage criteria={reviewCriteria}/></section>
<section className="view-section" hidden={view !== 'connection'}><ConnectionPage adapter={adapter} dark={dark} onThemeChange={setDark}/></section>        <div className="react-connection-state" hidden={!loading}>{suite ? 'در حال دریافت اطلاعات اجراها…' : 'در حال اتصال به سرور محلی…'}</div>
      </div></main>
    <StatusToast message={message} onClose={() => setMessage('')} />
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editorTitle} subtitle="قالب JSON نسخهٔ ۱ را ویرایش و پیش از ذخیره اعتبارسنجی کن." icon="dashboard" className="suite-editor-dialog" footer={<><button className="secondary" onClick={() => setEditorOpen(false)}>بستن</button><button className="secondary" onClick={() => void validateEditor()}>اعتبارسنجی</button><button className="primary" disabled={!editorValid} onClick={() => void saveSuite()}>ذخیرهٔ مجموعه</button></>}><label className="editor-label" htmlFor="suite-json-editor">محتوای مجموعه</label><textarea id="suite-json-editor" className="suite-json-editor" rows="18" dir="ltr" spellCheck="false" value={suiteJson} onChange={(event) => { setSuiteJson(event.target.value); setEditorValid(false); setEditorDiagnostics({ valid: false, errors: [{ path: '$', message: 'محتوا تغییر کرده است؛ برای بررسی دوباره اعتبارسنجی را اجرا کن.' }], warnings: [] }); }} /><Diagnostics result={editorDiagnostics} /></Modal>
    <Modal open={Boolean(confirmClear)} onClose={() => setConfirmClear(null)} title="پاک‌کردن ارزیابی" subtitle={`نظر ثبت‌شده برای پرسش ${confirmClear || ''} حذف شود؟`} icon="info" footer={<><button className="secondary" onClick={() => setConfirmClear(null)}>انصراف</button><button className="primary danger-action" onClick={() => void confirmClearReview()}>پاک‌کردن ارزیابی</button></>} />
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title} subtitle={detail?.subtitle} icon="search"><div className="detail-dialog-content">{detail?.text}</div></Modal>
  </div>;
}
