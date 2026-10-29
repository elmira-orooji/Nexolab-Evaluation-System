import {t, locale, direction, useLanguage} from './i18n.js';
import ComparisonPage from './ComparisonPage.jsx';
import ReviewView from './ReviewView.jsx';
import RunsPage from './RunsPage.jsx';
import { SuitesPage, GuidePage, ConnectionPage } from './WorkspacePages.jsx';
import './workspace-pages.css';
import './runs-view.css';
import RunSetup from './RunSetup.jsx';
import Dashboard from './Dashboard.jsx';
import AdvancedAnalysisPage from './AdvancedAnalysisPage.jsx';
import './header.css';
import {Languages} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { api, downloadUrl } from './api.js';
import { Icon, Modal, StatusToast } from './components.jsx';

const number = (value) => new Intl.NumberFormat(locale()).format(Number(value || 0));
const reviewCriteria = () => ( [
  { key: 'correctness', title: t("درستی پاسخ"), guide: t("۱: نادرست یا بی‌پشتوانه؛ ۲: بخشی درست با خطای مهم؛ ۳: درست با ایراد جزئی؛ ۴: دقیق و مستند.") },
  { key: 'relevance', title: t("ارتباط با پرسش"), guide: t("۱: بی‌ارتباط؛ ۲: پاسخ ناقص یا پر از حاشیه؛ ۳: پاسخ‌گو با کمی حاشیه؛ ۴: مستقیم و متمرکز.") },
  { key: 'source_adequacy', title: t("کفایت منبع"), guide: t("۱: شاهد مرتبطی نیست؛ ۲: شواهد ناکافی؛ ۳: بیشتر ادعاها پشتیبانی می‌شوند؛ ۴: همهٔ ادعاهای اصلی پوشش دارند.") },
  { key: 'citation_quality', title: t("کیفیت استناد"), guide: t("۱: ارجاع غایب یا نادرست؛ ۲: قابل ردیابی اما ناقص؛ ۳: عمدتاً دقیق با ایراد جزئی؛ ۴: هر ادعا به شاهد درست وصل است.") },
]);
const ratingLabels = () => ( { 1: t("ضعیف"), 2: t("تاحدی"), 3: t("عمدتاً"), 4: t("کامل") });
const adapterErrorNames = () => ( {
  authentication_error: t("توکن Nexora پذیرفته نشد"), authorization_error: t("مجوز دسترسی Nexora رد شد"),
  rate_limited: t("محدودیت نرخ Nexora"), timeout_error: t("مهلت انتظار برای Nexora تمام شد"),
  incomplete_response: t("پاسخ Nexora ناقص بود"), invalid_json: t("پاسخ Nexora JSON معتبر نبود"),
  invalid_response: t("ساختار پاسخ با قرارداد Nexora سازگار نبود"), transport_error: t("ارتباط با Nexora برقرار نشد"),
  http_error: t("Nexora درخواست را نپذیرفت"),
});
const slug = (value) => String(value || '').toLocaleLowerCase('fa').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').trim();
const runLabel = (run) => `${new Date(run.started_at).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })} · ${run.run_id.slice(0, 8)}`;

function Diagnostics({ result }) {
  if (!result) return null;
  const errors = result.errors || [], warnings = result.warnings || [];
  return <div className={`suite-diagnostics${errors.length ? ' has-errors' : warnings.length ? ' has-warnings' : ''}`} role="status" aria-live="polite">
    <p>{errors.length ? t("اعتبارسنجی ناموفق بود: {0} خطا.", [number(errors.length)]) : t("ساختار مجموعه معتبر است.")}</p>
    {[...errors, ...warnings].map((item, index) => <p key={`${item.path}-${index}`}>{item.path} · {item.message}</p>)}
  </div>;
}

function RunsView(props) {
  return props.comparisonOnly ? <ComparisonPage {...props}/> : <RunsPage {...props}/>;
}
export default function App({onLogout}) {
  const [language, setLanguage] = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState('');
  useEffect(() => {
    let active = true;
    api('/api/profile').then(profile => {if (active && profile.has_avatar) setAvatarUrl('/api/profile/avatar');}).catch(() => {});
    return () => {active = false;};
  }, []);
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
      const data = await api('/api/runs', { method: 'POST', body: {} });  setMessage(t("اجرا شروع شد."));
      await loadRun(data.run_id); setView('review'); await refreshRuns();
    } catch (error) { setMessage(error.message); } finally { setStartingRun(false); }
  };
  const activateSuite = async (key, destination = 'dashboard') => {
    if (!key) return;
    setLoading(true);
    try {
      const data = await api('/api/suites/select', { method: 'POST', body: { suite_key: key } });
      setSuiteKey(data.suite_key); setSuite(data.suite); setRunId(''); setRunData(null); setReport(null); setReviews({}); setReviewHistory({}); setSelected(0); setSuiteDiagnostics(null);
      setView(destination); await refreshRuns(); await reloadSuites(); setMessage(t("مجموعهٔ {0} برای اجرای بعدی انتخاب شد.", [data.suite.id]));
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
      setEditorKey(create ? null : suiteKey); setEditorTitle(create ? t("ساخت مجموعهٔ آزمون") : t("ویرایش مجموعهٔ {0}", [snapshot.id]));
      setSuiteJson(JSON.stringify(snapshot, null, 2)); setEditorDiagnostics(null); setEditorValid(false); setEditorOpen(true);
    } catch (error) { setMessage(error.message); }
  };
  const validateEditor = async () => {
    setEditorValid(false);
    try { const snapshot = JSON.parse(suiteJson); const result = await api('/api/suites/validate', { method: 'POST', body: snapshot }); setEditorDiagnostics(result); setEditorValid(result.valid); return result; }
    catch (error) { const result = { valid: false, errors: [{ path: '$', message: error instanceof SyntaxError ? t("ساختار JSON قابل‌خواندن نیست.") : error.message }], warnings: [] }; setEditorDiagnostics(result); return result; }
  };
  const saveSuite = async () => {
    const result = await validateEditor(); if (!result?.valid) return;
    try {
      const snapshot = JSON.parse(suiteJson);
      const saved = editorKey ? await api(`/api/suites/${encodeURIComponent(editorKey)}`, { method: 'PUT', body: snapshot }) : await api('/api/suites', { method: 'POST', body: snapshot });
      setEditorOpen(false); await activateSuite(saved.suite_key); setMessage(t("مجموعهٔ {0} ذخیره و انتخاب شد.", [snapshot.id]));
    } catch (error) { setEditorDiagnostics({ valid: false, errors: [{ path: '$', message: error.message }], warnings: [] }); }
  };
  const saveReview = async (caseId, review) => {
    if (!runId || saving) return;
    setSaving(true);
    try {
      const updated = await api(`/api/runs/${runId}/reviews/${encodeURIComponent(caseId)}`, { method: 'PUT', body: review });
      setReviews(updated.reviews); setReviewHistory(updated.review_history); setMessage(review ? t("بازبینی با زمان ثبت و به تاریخچه افزوده شد.") : t("رویداد حذف در تاریخچه ثبت شد."));
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
    const matchingRuns = runs.filter((item) => slug(`${runLabel(item)} ${item.run_id} ${item.adapter} ${item.state}`).includes(query)).slice(0, 5).map((item) => ({ title: runLabel(item), meta: `${item.adapter === 'fixture' ? t("Fixture محلی") : 'Nexora'} · ${item.run_id.slice(0, 12)}`, action: () => { void openRun(item.run_id); } }));
    return [{ label: t("پرسش‌ها"), items: questions }, { label: t("اجراها"), items: matchingRuns }].filter((group) => group.items.length);
  }, [globalQuery, currentSuite, runs, language]);
  const sidebarClass = `sidebar${mobileMenu ? ' is-open' : ''}`;
  const shellClass = `app-shell${collapsed ? ' sidebar-collapsed' : ''}`;
  const selectedCase = currentSuite?.cases?.[selected];
  const selectedReview = selectedCase ? reviews[selectedCase.id] : null;
  const clearReview = (caseId) => setConfirmClear(caseId);
  const confirmClearReview = async () => { const id = confirmClear; setConfirmClear(null); if (await saveReview(id, null)) setReviewDraftReset((value) => value + 1); };

  return <div className={shellClass}>
    <div className={`sidebar-backdrop${mobileMenu ? ' is-open' : ''}`} onClick={() => setMobileMenu(false)} />
    <aside className={sidebarClass} aria-label={t("ناوبری اصلی")}><div className="sidebar-brand"><a className="brand" href="#dashboard" aria-label="Nexolab by elmira"><img className="brand-symbol" src="/assets/nexolab-symbol.svg" width="36" height="36" alt="" /><img className="brand-symbol-dark" src="/assets/nexolab-symbol-light.svg" width="36" height="36" alt="" /><span><b lang="en" dir="ltr">Nexolab</b><small lang="en" dir="ltr">by elmira</small></span></a><button className="icon-button sidebar-collapse" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} aria-label={collapsed ? t("بازکردن سایدبار") : t("جمع‌کردن سایدبار")} title={collapsed ? t("بازکردن سایدبار") : t("جمع‌کردن سایدبار")}><Icon name={collapsed ? 'sidebarOpen' : 'sidebar'} /></button><button className="icon-button mobile-only" onClick={() => setMobileMenu(false)} aria-label={t("بستن منو")}><Icon name="close" /></button></div>
      <div className="sidebar-tools">
        <button className={`nav-item sidebar-new${view === 'new-run' ? ' is-active' : ''}`} title={t("اجرای آزمون جدید")} aria-label={t("اجرای آزمون جدید")} aria-current={view === 'new-run' ? 'page' : undefined} onClick={() => showView('new-run')}><Icon name="plus" className="nav-icon" /><span>{t("اجرای آزمون جدید")}</span></button>
      </div>
      <nav className="sidebar-nav sidebar-primary" aria-label={t("صفحه‌ها")}>
        <p className="sidebar-label">{t("منوی اصلی")}</p>
        {[['dashboard',t("داشبورد"),'dashboard'],['analysis',t("تحلیل پیشرفته"),'analysis'],['review',t("ارزیابی دستی"),'review'],['runs',t("اجراها"),'clock'],['suites',t("مجموعه‌های آزمون"),'suites'],['compare',t("مقایسهٔ اجراها"),'compare']].map(([key,label,icon]) => <button key={key} className={`nav-item${view === key ? ' is-active' : ''}`} onClick={() => showView(key)} title={label} aria-label={label} aria-current={view === key ? 'page' : undefined}><Icon name={icon} className="nav-icon"/><span>{label}</span>{key === 'runs' && Boolean(runs.length) && <small className="nav-count">{number(runs.length)}</small>}</button>)}
      </nav>
      <div className="sidebar-footer">
        <nav className="sidebar-nav sidebar-utilities" aria-label={t("راهنما و تنظیمات")}>{[['connection',t("اتصال و تنظیمات"),'settings'],['guide',t("راهنمای ارزیابی"),'guide']].map(([key,label,icon]) => <button key={key} className={view === key ? 'nav-item is-active' : 'nav-item'} onClick={() => showView(key)} title={label} aria-label={label} aria-current={view === key ? 'page' : undefined}><Icon name={icon} className="nav-icon"/><span>{label}</span></button>)}</nav>
        {onLogout && <button className="nav-item sidebar-logout" onClick={onLogout} aria-label={t("خروج از حساب")} title={t("خروج از حساب")}><Icon name="logout" className="nav-icon"/><span>{t("خروج از حساب")}</span></button>}
      </div>
    </aside>
    <main className="main-shell" dir={direction()}><header className="topbar">
  <button className="icon-button mobile-only topbar-menu" onClick={() => setMobileMenu(true)} aria-label={t("بازکردن منو")}><Icon name="menu" /></button>
  <div className="topbar-welcome" dir={direction()}><strong>{t("خوش آمدید!")}</strong><small>{t("پنل مدیریت ارزیابی")}</small></div>
  <div className="topbar-search"><div className="global-search-wrap"><label className="global-searchbox"><Icon name="search" /><input type="search" dir={direction()} placeholder={t("جست‌وجوی پرسش یا اجرا")} autoComplete="off" value={globalQuery} aria-expanded={globalSearchOpen && Boolean(globalQuery)} onFocus={() => setGlobalSearchOpen(true)} onChange={(event) => { setGlobalQuery(event.target.value); setGlobalSearchOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearchOpen(false); }} /></label>{globalSearchOpen && globalQuery && <div className="global-search-results" role="listbox">{searchGroups.length ? searchGroups.map((group) => <section className="global-search-group" key={group.label} role="group" aria-label={group.label}><p className="global-search-heading">{group.label}</p>{group.items.map((item) => <button className="global-search-result" key={group.label + '-' + item.meta} role="option" onClick={() => { item.action(); setGlobalQuery(''); setGlobalSearchOpen(false); }}><span className="global-search-result-title">{item.title}</span><small>{item.meta}</small></button>)}</section>) : <p className="global-search-empty">{t("نتیجه‌ای برای این جست‌وجو پیدا نشد.")}</p>}</div>}</div></div>
  <div className="topbar-actions"><button className="topbar-language" onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')} aria-label={language === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی'}><Languages size={17} aria-hidden="true"/><span lang={language === 'fa' ? 'en' : 'fa'}>{language === 'fa' ? 'EN' : 'فا'}</span></button><button className="topbar-icon topbar-notifications" disabled={!runs.length} onClick={() => runs[0] && void openRun(runs[0].run_id)} aria-label={t("آخرین اجرا")} title={runs[0] ? t("آخرین اجرا · ") + runLabel(runs[0]) : t("هنوز اجرایی ثبت نشده است")}><Icon name="bell" />{runs[0] && ['running', 'failed'].includes(runs[0].state) && <span className={'topbar-notification-dot' + (runs[0].state === 'failed' ? ' is-error' : '')} />}</button><button className="topbar-icon" onClick={() => setDark((value) => !value)} aria-label={dark ? t("تغییر به حالت روشن") : t("تغییر به حالت تیره")} title={dark ? t("حالت روشن") : t("حالت تیره")} aria-pressed={dark}><Icon name="theme" /></button></div>
  <button className="topbar-profile" onClick={() => showView('connection')} aria-label={t("تنظیمات حساب مدیر")} title={t("تنظیمات")}><span className="topbar-avatar">{avatarUrl ? <img src={avatarUrl} alt=""/> : t("م")}</span><span className="topbar-profile-chevron" aria-hidden="true">⌄</span></button>
</header>
      <div className="content-scroll" onClick={(event) => { if (!event.target.closest('.global-search-wrap')) setGlobalSearchOpen(false); }}><section className="view-section" hidden={view !== 'dashboard'}><Dashboard suite={suite} report={report} run={activeRun} runs={runs} reviews={reviews} onView={showView} onStart={() => showView('new-run')} onOpenRun={(id) => void openRun(id)} onSuiteDetails={() => suite && setDetail({ title: suite.id, subtitle: t("مجموعهٔ انتخاب‌شده برای اجرای بعدی"), text: t("{0}\n\nنسخه: {1}\n{2} سند\n{3} پرسش\n\nشناسهٔ اسناد: {4}", [suite.description || '', suite.version || t("ثبت‌نشده"), suite.documents.length, suite.cases.length, suite.documents.map((item) => item.id).join(t("، "))]) })} suiteCatalog={suiteCatalog} suiteKey={suiteKey} onSuiteChange={activateSuite} onCreateSuite={() => void openEditor(true)} onEditSuite={() => void openEditor(false)} onValidateSuite={validateSuite} diagnostics={suiteDiagnostics} /></section>
<section className="view-section" hidden={view !== 'analysis'}><AdvancedAnalysisPage report={report} run={activeRun} onView={showView} onReviewCase={(index) => { setSelected(index); showView('review'); }} /></section>
        <section className="view-section" hidden={view !== 'new-run'}><RunSetup suite={suite} suiteKey={suiteKey} suites={suiteCatalog} adapter={adapter} busy={loading || startingRun} running={runs.some((item) => item.state === 'running')} onSelect={(key) => void activateSuite(key, 'new-run')} onStart={() => void startRun()} onBack={() => showView('dashboard')} /></section><section className={view === 'compare' ? 'view-section comparison-only' : 'view-section'} hidden={!['runs', 'compare'].includes(view)}><RunsView comparisonOnly={view === 'compare'} runs={runs} activeRunId={runId} onOpenRun={(id) => void openRun(id)} onStart={() => showView('new-run')} baseline={baseline} candidate={candidate} setBaseline={setBaseline} setCandidate={setCandidate} onCompare={compareRuns} comparison={comparison} comparing={comparing} /></section>
        <section className="view-section" hidden={view !== 'review'}><ReviewView criteria={reviewCriteria()} ratingLabels={ratingLabels()} errorNames={adapterErrorNames()} suite={currentSuite} report={report} run={activeRun} runs={runs} reviews={reviews} reviewHistory={reviewHistory} onOpenRun={openRun} onSaveReview={saveReview} onClearReview={clearReview} saving={saving} selected={selected} setSelected={setSelected} resetKey={reviewDraftReset} /></section>
<section className="view-section" hidden={view !== 'suites'}><SuitesPage suites={suiteCatalog} selected={suiteKey} suite={suite} busy={loading} onSelect={(key) => void activateSuite(key, 'suites')} onCreate={() => void openEditor(true)} onEdit={() => void openEditor(false)} onValidate={validateSuite} diagnostics={<Diagnostics result={suiteDiagnostics}/>} /></section>
<section className="view-section" hidden={view !== 'guide'}><GuidePage criteria={reviewCriteria()}/></section>
<section className="view-section" hidden={view !== 'connection'}><ConnectionPage adapter={adapter} dark={dark} onThemeChange={setDark} onAdapterChange={setAdapter} avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl}/></section>        <div className="react-connection-state" hidden={!loading}>{suite ? t("در حال دریافت اطلاعات اجراها…") : t("در حال اتصال به سرور محلی…")}</div>
      </div></main>
    <StatusToast message={message} onClose={() => setMessage('')} />
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editorTitle} subtitle={t("قالب JSON نسخهٔ ۱ را ویرایش و پیش از ذخیره اعتبارسنجی کن.")} icon="dashboard" className="suite-editor-dialog" footer={<><button className="secondary" onClick={() => setEditorOpen(false)}>{t("بستن")}</button><button className="secondary" onClick={() => void validateEditor()}>{t("اعتبارسنجی")}</button><button className="primary" disabled={!editorValid} onClick={() => void saveSuite()}>{t("ذخیرهٔ مجموعه")}</button></>}><label className="editor-label" htmlFor="suite-json-editor">{t("محتوای مجموعه")}</label><textarea id="suite-json-editor" className="suite-json-editor" rows="18" dir="ltr" spellCheck="false" value={suiteJson} onChange={(event) => { setSuiteJson(event.target.value); setEditorValid(false); setEditorDiagnostics({ valid: false, errors: [{ path: '$', message: t("محتوا تغییر کرده است؛ برای بررسی دوباره اعتبارسنجی را اجرا کن.") }], warnings: [] }); }} /><Diagnostics result={editorDiagnostics} /></Modal>
    <Modal open={Boolean(confirmClear)} onClose={() => setConfirmClear(null)} title={t("پاک‌کردن ارزیابی")} subtitle={t("نظر ثبت‌شده برای پرسش {0} حذف شود؟", [confirmClear || ''])} icon="info" footer={<><button className="secondary" onClick={() => setConfirmClear(null)}>{t("انصراف")}</button><button className="primary danger-action" onClick={() => void confirmClearReview()}>{t("پاک‌کردن ارزیابی")}</button></>} />
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title} subtitle={detail?.subtitle} icon="search"><div className="detail-dialog-content">{detail?.text}</div></Modal>
  </div>;
}
