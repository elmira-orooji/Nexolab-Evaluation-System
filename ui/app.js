import { api, download } from './client.js';
import { mountDashboardMetrics } from './components.js';
const $ = (selector) => document.querySelector(selector);
const number = (value) => new Intl.NumberFormat('fa-IR').format(value);
let suite, activeSuite, activeSuiteKey = '', editorSuiteKey = null, suiteCatalog = [], selected = 0, runId = '', report = null, reviews = {}, drafts = {}, polling = null, saving = false, runs = [];
let reviewRevision = 0;
let loadingRun = false;
let runRequest = 0;
mountDashboardMetrics($('#dashboard-stats'));
const appShell = $('.app-shell');
const sidebarToggle = $('#sidebar-toggle');
function setSidebarCollapsed(collapsed) {
  appShell.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? 'بازکردن سایدبار' : 'جمع‌کردن سایدبار');
  sidebarToggle.title = collapsed ? 'بازکردن سایدبار' : 'جمع‌کردن سایدبار';
  sidebarToggle.querySelector('use').setAttribute('href', collapsed ? '#icon-sidebar-open' : '#icon-sidebar');
}
setSidebarCollapsed(false);
const message = (text) => { $('#message').textContent = text; };
const currentResult = () => report?.results.find((result) => result.case_id === suite.cases[selected].id);
const runUrl = () => `/api/runs/${runId}`;

function renderList() {
  const query = $('#search').value.trim(), category = $('#category-filter').value, difficulty = $('#difficulty-filter').value, list = $('#case-list'); list.replaceChildren();
  suite.cases.forEach((item, index) => {
    if ((query && !item.question.includes(query)) || (category && (item.category || 'عمومی') !== category)
        || (difficulty && (item.difficulty || 'medium') !== difficulty)) return;
    const button = document.createElement('button'); button.className = `case-item${index === selected ? ' active' : ''}`;
    button.setAttribute('aria-current', String(index === selected));
    const top = document.createElement('span'); top.className = 'case-top';
    const id = document.createElement('span'); id.className = 'mono'; id.textContent = item.id;
    const result = report?.results.find((entry) => entry.case_id === item.id);
    const state = document.createElement('span'); state.textContent = reviews[item.id] ? 'بررسی شده' : result?.error ? 'خطای اجرا' : result ? 'آمادهٔ بررسی' : 'در انتظار';
    if (reviews[item.id]) state.className = 'done';
    const question = document.createElement('p'); question.textContent = item.question;
    const metadata = document.createElement('small'); metadata.className = 'case-meta';
    for (const label of [item.category || 'عمومی', ({ easy: 'آسان', medium: 'متوسط', hard: 'دشوار' }[item.difficulty] || 'متوسط')]) { const tag = document.createElement('span'); tag.textContent = label; metadata.append(tag); }
    top.append(id, state); button.append(top, question, metadata); button.onclick = () => { if (!saving && !loadingRun) choose(index); }; list.append(button);
  });
  if (!list.children.length) list.textContent = 'پرسشی پیدا نشد.';
  const done = suite.cases.filter((item) => reviews[item.id]).length;
  $('#progress').max = suite.cases.length; $('#progress').value = done;
  $('#progress-label').textContent = `${number(done)} از ${number(suite.cases.length)} بررسی شده`;
  $('.count').textContent = number(suite.cases.length);
}
function sourceCard(container, title, content) {
  const source = document.createElement('article'); source.className = 'source';
  const heading = document.createElement('h4'); heading.textContent = title;
  const text = document.createElement('p'); text.textContent = content;
  source.tabIndex = 0; source.setAttribute('role', 'button'); source.setAttribute('aria-label', `نمایش متن کامل: ${title}`);
  source.onclick = () => showDetail(title, content, 'متن منبع و ارجاع در گزارش این اجرا ثبت شده است.');
  source.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); source.click(); } };
  source.append(heading, text); container.append(source);
}
function showDetail(title, content, subtitle = '') {
  $('#detail-title').textContent = title; $('#detail-subtitle').textContent = subtitle;
  const body = $('#detail-content'); body.replaceChildren(); const text = document.createElement('p'); text.textContent = content; body.append(text);
  $('#detail-dialog').showModal();
}
function showView(name) {
  const titles = { dashboard: 'داشبورد', review: 'ارزیابی دستی', runs: 'اجراها' };
  document.querySelectorAll('.view-section').forEach((view) => { view.hidden = view.id !== `${name}-view`; });
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => { item.classList.toggle('is-active', item.dataset.view === name); item.setAttribute('aria-current', item.dataset.view === name ? 'page' : 'false'); });
  document.title = `${titles[name] || titles.dashboard} | Nexolab`;
  $('#sidebar').classList.remove('is-open'); $('#sidebar-backdrop').classList.remove('is-open');
  if (name === 'review' && suite) choose(selected);
}
function runLabel(item) { return `${new Date(item.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })} · ${item.run_id.slice(0, 8)}`; }
function closeGlobalSearch() {
  $('#global-search-results').hidden = true;
  $('#global-search').setAttribute('aria-expanded', 'false');
}
function normalizeSearchText(value) {
  return String(value ?? '').normalize('NFKC').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').toLocaleLowerCase('fa-IR');
}
function renderGlobalSearch() {
  const input = $('#global-search'), results = $('#global-search-results'), query = normalizeSearchText(input.value.trim());
  results.replaceChildren();
  if (!query) { closeGlobalSearch(); return; }

  const groups = [
    { label: 'پرسش‌ها', items: (suite?.cases || []).filter((item) => normalizeSearchText(`${item.id} ${item.question}`).includes(query)).slice(0, 5).map((item) => ({
      title: item.question, meta: item.id, activate: () => {
        const index = suite.cases.findIndex((candidate) => candidate.id === item.id);
        closeGlobalSearch(); input.value = ''; showView('review'); choose(index);
      },
    })) },
    { label: 'اجراها', items: runs.filter((item) => normalizeSearchText(`${runLabel(item)} ${item.run_id} ${item.adapter} ${item.state}`).includes(query)).slice(0, 5).map((item) => ({
      title: runLabel(item), meta: `${item.adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'} · ${item.run_id.slice(0, 12)}`, activate: () => {
        closeGlobalSearch(); input.value = '';
        void openRun(item.run_id).then(() => showView('review')).catch((error) => message(error.message));
      },
    })) },
  ].filter((group) => group.items.length);

  if (!groups.length) {
    const empty = document.createElement('p'); empty.className = 'global-search-empty'; empty.textContent = 'نتیجه‌ای برای این جست‌وجو پیدا نشد.'; results.append(empty);
  } else {
    for (const group of groups) {
      const section = document.createElement('section'); section.className = 'global-search-group'; section.setAttribute('role', 'group'); section.setAttribute('aria-label', group.label);
      const heading = document.createElement('p'); heading.className = 'global-search-heading'; heading.textContent = group.label; section.append(heading);
      for (const item of group.items) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'global-search-result'; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', 'false');
        const title = document.createElement('span'); title.className = 'global-search-result-title'; title.textContent = item.title;
        const meta = document.createElement('small'); meta.textContent = item.meta;
        button.append(title, meta); button.onclick = item.activate; section.append(button);
      }
      results.append(section);
    }
  }
  results.hidden = false; input.setAttribute('aria-expanded', 'true');
}
function renderRuns() {
  const fill = (container, limit = runs.length) => {
    container.replaceChildren();
    if (!runs.length) { const empty = document.createElement('p'); empty.className = 'empty-runs'; empty.textContent = 'هنوز اجرایی ثبت نشده است.'; container.append(empty); return; }
    runs.slice(0, limit).forEach((item) => {
      const button = document.createElement('button'); button.className = container.id === 'sidebar-runs' ? 'recent-run' : container.id === 'dashboard-runs' ? 'dashboard-run-row' : 'runs-row';
      button.classList.toggle('is-active', item.run_id === runId);
      const dot = document.createElement('span'); dot.className = `run-dot${item.state === 'running' ? ' running' : ''}`;
      const stateText = ({ running: 'در حال اجرا', failed: 'خطای اجرا', interrupted: 'ناتمام' }[item.state] || 'تکمیل‌شده');
      const copy = document.createElement('span'); const title = document.createElement('strong'); title.textContent = runLabel(item); const meta = document.createElement('small'); meta.textContent = `${item.adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'} · ${stateText}`; copy.append(title, meta); button.append(dot, copy);
      if (container.id !== 'sidebar-runs') { const state = document.createElement('span'); state.className = `run-state${item.state === 'failed' ? ' failed' : ''}`; state.textContent = stateText; button.append(state); }
      button.disabled = saving || loadingRun;
      button.onclick = () => { if (saving || loadingRun) return; void openRun(item.run_id).then(() => showView('review')).catch((error) => message(error.message)); }; container.append(button);
    });
  };
  fill($('#sidebar-runs'), 8); fill($('#dashboard-runs'), 5); fill($('#runs-list'));
  $('#recent-count').textContent = number(runs.length); $('#runs-total').textContent = `${number(runs.length)} اجرا`;
  $('#stat-runs').textContent = number(runs.length);
  $('#latest-run').disabled = !runs.length || saving || loadingRun;
  $('#latest-run').title = runs.length ? `آخرین اجرا · ${runLabel(runs[0])}` : 'هنوز اجرایی ثبت نشده است';
}
function populateCaseFilters() {
  const control = $('#category-filter'), selectedCategory = control.value;
  const categories = [...new Set((suite?.cases || []).map((item) => item.category || 'عمومی'))].sort((a, b) => a.localeCompare(b, 'fa'));
  control.replaceChildren(new Option('همهٔ موضوع‌ها', ''));
  for (const category of categories) control.append(new Option(category, category));
  control.value = categories.includes(selectedCategory) ? selectedCategory : '';
}
function updateSuiteHeader() {
  if (!activeSuite) return;
  $('#dashboard-suite-name').textContent = activeSuite.id;
  $('#dashboard-suite-description').textContent = `${activeSuite.description || 'بدون توضیح'} · ${number(activeSuite.documents.length)} سند · ${number(activeSuite.cases.length)} پرسش`;
  $('#suite-version').textContent = `نسخهٔ ${activeSuite.version || 'ثبت‌نشده'}`;
  $('#dialog-suite').textContent = activeSuite.id;
}
function renderSuiteCatalog(items) {
  suiteCatalog = items;
  const control = $('#suite-select'); control.replaceChildren();
  for (const item of items) {
    const label = `${item.id || item.suite_key} · ${item.version || 'بدون نسخه'} · ${number(item.case_count)} پرسش${item.valid ? '' : ' · نیازمند اصلاح'}`;
    const option = new Option(label, item.suite_key); option.disabled = !item.valid; control.append(option);
  }
  control.value = activeSuiteKey;
  $('#suite-select').disabled = !activeSuiteKey;
  $('#edit-suite').disabled = !activeSuiteKey;
  $('#validate-suite').disabled = !activeSuiteKey;
  $('#create-suite').disabled = false;
  const issues = items.filter((item) => !item.valid).flatMap((item) => item.errors.map((error) => `${item.suite_key} · ${error.path}: ${error.message}`));
  const activeWarnings = items.find((item) => item.suite_key === activeSuiteKey)?.warnings || [];
  const container = $('#suite-diagnostics'); container.replaceChildren();
  container.classList.toggle('has-errors', issues.length > 0); container.classList.toggle('has-warnings', !issues.length && activeWarnings.length > 0);
  if (issues.length) { const text = document.createElement('p'); text.textContent = `مجموعه‌های نامعتبر ذخیره‌شده:\n${issues.join('\n')}`; container.append(text); }
  if (activeWarnings.length) { const text = document.createElement('p'); text.textContent = `هشدارهای مجموعهٔ فعال:\n${activeWarnings.map((item) => `${item.path}: ${item.message}`).join('\n')}`; container.append(text); }
}
async function reloadSuiteCatalog() { renderSuiteCatalog(await api('/api/suites')); }
function renderSuiteDiagnostics(container, result) {
  container.replaceChildren(); container.classList.toggle('has-errors', !result.valid);
  container.classList.toggle('has-warnings', result.valid && result.warnings.length > 0);
  const summary = document.createElement('p'); summary.textContent = result.valid ? 'ساختار مجموعه معتبر است.' : `اعتبارسنجی ناموفق بود: ${number(result.errors.length)} خطا.`; container.append(summary);
  for (const item of [...result.errors, ...result.warnings]) { const line = document.createElement('p'); line.textContent = `${item.path} · ${item.message}`; container.append(line); }
}
async function validateEditor() {
  $('#suite-editor-save').disabled = true;
  try {
    const snapshot = JSON.parse($('#suite-json-editor').value);
    const result = await api('/api/suites/validate', { method: 'POST', body: snapshot });
    renderSuiteDiagnostics($('#suite-editor-diagnostics'), result);
    $('#suite-editor-save').disabled = !result.valid;
    return result;
  } catch (error) {
    renderSuiteDiagnostics($('#suite-editor-diagnostics'), { valid: false, errors: [{ path: '$', message: error instanceof SyntaxError ? 'ساختار JSON قابل‌خواندن نیست.' : error.message }], warnings: [] });
    return null;
  }
}
async function openSuiteEditor(create) {
  try {
    editorSuiteKey = create ? null : activeSuiteKey;
    const snapshot = create ? await api('/api/suites/template') : await api(`/api/suites/${encodeURIComponent(activeSuiteKey)}`);
    if (create) snapshot.id = `suite-${Date.now()}`;
    $('#suite-editor-title').textContent = create ? 'ساخت مجموعهٔ آزمون' : `ویرایش مجموعهٔ ${snapshot.id}`;
    $('#suite-json-editor').value = JSON.stringify(snapshot, null, 2);
    renderSuiteDiagnostics($('#suite-editor-diagnostics'), { valid: false, errors: [{ path: '$', message: 'ابتدا اعتبارسنجی را اجرا کن.' }], warnings: [] });
    $('#suite-editor-save').disabled = true; $('#suite-editor-dialog').showModal();
  } catch (error) { message(error.message); }
}
async function activateSuite(suiteKey) {
  const selection = await api('/api/suites/select', { method: 'POST', body: { suite_key: suiteKey } });
  activeSuiteKey = selection.suite_key; activeSuite = selection.suite; suite = selection.suite; runId = ''; report = null; reviews = {}; drafts = {}; selected = 0;
  clearTimeout(polling); polling = null; populateCaseFilters(); updateSuiteHeader(); choose(0); await reloadSuiteCatalog(); await history(); renderDashboard();
  showView('dashboard'); message(`مجموعهٔ ${suite.id} برای اجرا انتخاب شد.`);
}
function renderDashboard() {
  if (!suite) return;
  $('#stat-cases').textContent = number(suite.cases.length); $('#stat-suite').textContent = suite.id;
  const displayedSuite = activeSuite || suite;
  $('#dashboard-suite-name').textContent = displayedSuite.id; $('#dashboard-suite-description').textContent = `${displayedSuite.description || 'بدون توضیح'} · ${number(displayedSuite.documents.length)} سند · ${number(displayedSuite.cases.length)} پرسش`;
  $('#suite-version').textContent = `نسخهٔ ${displayedSuite.version || 'ثبت‌نشده'}`;
  $('#stat-reviewed').textContent = number(Object.keys(reviews).length); $('#stat-reviewed-caption').textContent = `از ${number(suite.cases.length)} پرسش اجرای انتخاب‌شده`;
  const done = Object.keys(reviews).length, total = suite.cases.length, percent = total ? Math.round(done / total * 100) : 0;
  $('#review-donut').style.setProperty('--progress', `${percent}%`); $('#review-percent').textContent = `${number(percent)}٪`;
  $('#dashboard-progress').max = total; $('#dashboard-progress').value = done; $('#dashboard-progress-label').textContent = `${number(done)} از ${number(total)}`;
  const latest = runs[0];
  $('#stat-status').textContent = latest ? ({ running: 'در حال اجرا', failed: 'خطای اجرا', interrupted: 'ناتمام', completed: 'تکمیل‌شده' }[latest.state] || 'تکمیل‌شده') : 'بدون اجرا';
  $('#stat-last-run').textContent = latest ? runLabel(latest) : 'برای شروع، آزمون را اجرا کن.';
  $('#latest-summary').textContent = report ? `${number(report.results.length)} از ${number(suite.cases.length)} پاسخ آماده است` : 'هنوز اجرایی ثبت نشده';
  const selectedRun = runs.find((item) => item.run_id === runId) || latest;
  $('#latest-detail').textContent = report ? `${report.settings.adapter === 'fixture' ? 'اجرای محلی fixture' : 'اتصال Nexora'} · ${selectedRun ? runLabel(selectedRun) : runId.slice(0, 8)}` : 'پس از اجرای مجموعه، جزئیات اینجا نمایش داده می‌شود.';
  $('#open-latest').disabled = !runId; $('#dashboard-reviews').disabled = !runId;
  for (const [selector, filename] of [['#dashboard-json', 'report.json'], ['#dashboard-csv', 'report.csv']]) { const link = $(selector); link.hidden = !report || (filename.endsWith('.csv') && !report.finished_at); link.href = runId ? `/api/runs/${runId}/${filename}` : '#'; }
}
function renderResponse() {
  const result = currentResult(), response = result?.response;
  $('#answer').textContent = response?.answer ?? (result?.error ? 'این درخواست با خطا پایان یافت.' : 'هنوز پاسخی دریافت نشده است.');
  $('#result-state').textContent = result?.error ? 'خطای اجرا' : response ? 'پاسخ دریافت شد' : 'در انتظار اجرا';
  $('#duration').textContent = result ? `${number(result.duration_ms)} میلی‌ثانیه` : '';
  $('#response-note').textContent = result?.error ? `خطا: ${result.error.kind} ${result.error.http_status || ''}`
    : report?.settings.adapter === 'fixture' ? 'اجرای fixture؛ پاسخ مرجع بازگردانده شده و خروجی Nexora نیست.'
    : response ? `شناسهٔ اجرا: ${runId}` : 'برای دریافت پاسخ، آزمون را اجرا کن.';
  const sources = $('#sources'); sources.replaceChildren();
  for (const source of response?.sources || []) sourceCard(sources, source.filename || source.document_id || 'منبع', source.content || source.excerpt || 'متن موجود نیست.');
  for (const citation of response?.citations || []) sourceCard(sources, `ارجاع ${citation.id ?? ''} · ${citation.filename || ''}`, citation.excerpt || 'متن ارجاع موجود نیست.');
  if (!sources.children.length) sourceCard(sources, 'بدون منبع بازیابی‌شده', response ? 'سرویس منبعی برنگردانده است.' : 'منابع پس از اجرا نمایش داده می‌شوند.');
  $('#review-form').querySelectorAll('input, textarea, button').forEach((control) => { control.disabled = !response || saving || loadingRun || report?.run_id !== runId; });
}
function choose(index) {
  selected = index; const item = suite.cases[index];
  $('#case-id').textContent = item.id; $('#question').textContent = item.question; $('#reference').textContent = item.reference_answer;
  $('#position').textContent = `${number(index + 1)} از ${number(suite.cases.length)}`;
  $('#previous').disabled = index === 0; $('#next').disabled = index === suite.cases.length - 1;
  const expected = $('#expected-sources'); expected.replaceChildren();
  for (const id of item.expected_document_ids) { const doc = suite.documents.find((entry) => entry.id === id); if (doc) sourceCard(expected, doc.title || doc.id, doc.text); }
  if (!expected.children.length) sourceCard(expected, 'پاسخ ناموجود', 'اطلاعات مورد سؤال در اسناد مرجع وجود ندارد.');
  $('#review-form').reset(); const review = drafts[item.id] || reviews[item.id];
  if (review) {
    for (const key of ['answer_correct', 'sources_correct']) { const input = document.querySelector(`input[name="${key}"][value="${review[key]}"]`); if (input) input.checked = true; }
    $('#notes').value = review.notes || '';
  }
  $('#review-state').textContent = drafts[item.id] ? 'پیش‌نویس' : reviews[item.id] ? 'ثبت شده' : 'بررسی نشده';
  renderResponse(); renderList();
}
async function history() {
  runs = await api('/api/runs'); const select = $('#run-history'); select.replaceChildren(new Option('انتخاب اجرا', ''));
  for (const item of runs) select.append(new Option(`${item.started_at.slice(0, 19)} · ${item.adapter} · ${item.run_id.slice(0, 8)}`, item.run_id));
  const baseline = $('#compare-baseline'), candidate = $('#compare-candidate');
  const previousBaseline = baseline.value, previousCandidate = candidate.value;
  for (const control of [baseline, candidate]) {
    control.replaceChildren(new Option('انتخاب اجرا', ''));
    for (const item of runs) {
      const option = new Option(`${item.started_at.slice(0, 19)} · ${item.adapter} · ${item.run_id.slice(0, 8)} · ${item.state === 'completed' ? 'پایان‌یافته' : 'ناتمام'}`, item.run_id);
      option.disabled = item.state !== 'completed'; control.append(option);
    }
  }
  baseline.value = runs.some((item) => item.run_id === previousBaseline) ? previousBaseline : (runs[1]?.run_id || '');
  candidate.value = runs.some((item) => item.run_id === previousCandidate) ? previousCandidate : (runs[0]?.run_id || '');
  updateCompareButton();
  select.value = runId; renderRuns(); renderDashboard();
}
function updateCompareButton() {
  $('#compare-button').disabled = !$('#compare-baseline').value || !$('#compare-candidate').value
    || $('#compare-baseline').value === $('#compare-candidate').value;
}
function appendCell(row, value, className = '') {
  const cell = document.createElement('td'); if (className) cell.className = className;
  cell.textContent = value == null || value === '' ? '—' : String(value); row.append(cell); return cell;
}
function renderComparison(result) {
  const container = $('#compare-result'); container.replaceChildren();
  const meta = document.createElement('div'); meta.className = 'compare-meta';
  for (const label of [`مبنا: ${result.baseline_run_id.slice(0, 8)}`, `جدید: ${result.candidate_run_id.slice(0, 8)}`, `مجموعه یکسان: ${result.same_suite ? 'بله' : 'خیر'}`, `پیکربندی یکسان: ${result.same_config ? 'بله' : 'خیر'}`]) {
    const tag = document.createElement('span'); tag.textContent = label; meta.append(tag);
  }
  container.append(meta);
  if (!result.same_suite || !result.same_config) {
    const warning = document.createElement('p'); warning.className = 'compare-warning';
    warning.textContent = `هشدار: ${!result.same_suite ? 'هش مجموعه‌ها متفاوت است. ' : ''}${!result.same_config ? 'هش پیکربندی‌ها متفاوت است.' : ''} revision سامانه: ${result.baseline_system_revision || 'ثبت‌نشده'} ← ${result.candidate_system_revision || 'ثبت‌نشده'}؛ revision پیکره: ${result.baseline_corpus_revision || 'ثبت‌نشده'} ← ${result.candidate_corpus_revision || 'ثبت‌نشده'}`;
    container.append(warning);
  }
  const summary = document.createElement('p'); summary.className = 'compare-summary';
  summary.textContent = `${number(result.shared_case_count)} پرسش مشترک · ${number(result.answer_changes)} پاسخ تغییرکرده · ${number(result.source_changes)} منبع تغییرکرده · ${number(result.error_changes)} تغییر در خطا · خطاها ${number(result.baseline_errors)} ← ${number(result.candidate_errors)}`;
  container.append(summary);
  if (!result.cases.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'پرسش مشترکی برای مقایسه وجود ندارد.'; container.append(empty); return; }
  const wrap = document.createElement('div'); wrap.className = 'compare-table-wrap';
  const table = document.createElement('table'); table.className = 'compare-table';
  const head = document.createElement('thead'), header = document.createElement('tr');
  for (const title of ['شناسه', 'پاسخ اجرا مبنا', 'پاسخ اجرای جدید', 'منابع مبنا ← جدید', 'خطا مبنا ← جدید', 'اختلاف زمان (ms)']) { const cell = document.createElement('th'); cell.textContent = title; header.append(cell); }
  head.append(header); table.append(head); const body = document.createElement('tbody');
  for (const item of result.cases) {
    const row = document.createElement('tr'); appendCell(row, item.case_id);
    appendCell(row, item.baseline.answer, `compare-answer${item.answer_changed ? ' compare-change' : ''}`);
    appendCell(row, item.candidate.answer, `compare-answer${item.answer_changed ? ' compare-change' : ''}`);
    appendCell(row, `${number(item.baseline.source_count)} ← ${number(item.candidate.source_count)}${item.sources_changed ? ' · تغییر' : ''}`, item.sources_changed ? 'compare-change' : '');
    const errorLabel = (error) => error ? `${error.kind}${error.http_status ? ` (${error.http_status})` : ''}` : 'ندارد';
    appendCell(row, `${errorLabel(item.baseline.error)} ← ${errorLabel(item.candidate.error)}`, item.error_changed ? 'compare-error' : '');
    appendCell(row, `${item.duration_delta_ms > 0 ? '+' : ''}${number(item.duration_delta_ms)}`); body.append(row);
  }
  table.append(body); wrap.append(table); container.append(wrap);
}
$('#compare-baseline').onchange = updateCompareButton; $('#compare-candidate').onchange = updateCompareButton;
$('#compare-button').onclick = async () => {
  const baseline = $('#compare-baseline').value, candidate = $('#compare-candidate').value;
  if (!baseline || !candidate || baseline === candidate) return;
  const button = $('#compare-button'); button.disabled = true; button.textContent = 'در حال مقایسه…';
  try { renderComparison(await api(`/api/compare?baseline=${encodeURIComponent(baseline)}&candidate=${encodeURIComponent(candidate)}`)); }
  catch (error) { message(error.message); }
  finally { button.textContent = 'مقایسه'; updateCompareButton(); }
};
async function refresh(id) {
  const revision = reviewRevision;
  const data = await api(`/api/runs/${id}`); if (id !== runId) return;
  if (saving || revision !== reviewRevision) {
    polling = setTimeout(() => refresh(id).catch((error) => message(error.message)), 800);
    return;
  }
  report = data.report; suite = report.suite; reviews = data.reviews; populateCaseFilters();
  const states = { running: 'در حال اجرا', completed: 'اجرا پایان یافت', failed: 'اجرا متوقف شد؛ خطای داخلی یا ذخیره‌سازی', interrupted: 'اجرای ناتمام از نشست قبلی' };
  $('#run-status').textContent = `${states[data.state]} · ${number(report.results.length)} از ${number(suite.cases.length)}`;
  $('#suite-label').textContent = suite.id; $('#adapter-label').textContent = report.settings.adapter === 'fixture' ? 'اجرای محلی fixture' : 'Nexora';
  for (const button of [$('#start-run'), $('#dashboard-run'), ...document.querySelectorAll('[data-open-run-dialog]')]) button.disabled = data.state === 'running' || saving || loadingRun;
  $('#run-history').disabled = data.state === 'running' || saving || loadingRun;
  for (const [selector, filename] of [['#download-json', 'report.json'], ['#download-csv', 'report.csv']]) { $(selector).href = `${runUrl()}/${filename}`; $(selector).hidden = selector === '#download-csv' && data.state !== 'completed'; }
  choose(Math.min(selected, suite.cases.length - 1)); renderDashboard();
  if (data.state === 'running') polling = setTimeout(() => refresh(id).catch((error) => { message(error.message); $('#start-run').disabled = true; }), 800);
  else { polling = null; await history(); }
}
async function openRun(id) {
  if (saving || loadingRun) return;
  const requestId = ++runRequest;
  clearTimeout(polling); loadingRun = true; runId = id; selected = 0; drafts = {};
  renderResponse(); $('#start-run').disabled = true; $('#dashboard-run').disabled = true; document.querySelectorAll('[data-open-run-dialog]').forEach((button) => button.disabled = true); $('#run-history').disabled = true;
  try { await refresh(id); }
  catch (error) { if (requestId === runRequest) { runId = ''; report = null; reviews = {}; } throw error; }
  finally { if (requestId === runRequest) { loadingRun = false; renderResponse(); renderRuns(); renderDashboard(); const busy = Boolean(polling); $('#start-run').disabled = busy; $('#dashboard-run').disabled = busy; document.querySelectorAll('[data-open-run-dialog]').forEach((button) => button.disabled = busy); $('#run-history').disabled = busy; } }
}
async function startRun() { $('#confirm-run').disabled = true; try { const data = await api('/api/runs', { method: 'POST', body: {} }); $('#run-dialog').close(); await openRun(data.run_id); await history(); showView('review'); message('اجرا شروع شد.'); } catch (error) { message(error.message); } finally { $('#confirm-run').disabled = false; } }
$('#start-run').onclick = () => $('#run-dialog').showModal();
$('#dashboard-run').onclick = () => $('#run-dialog').showModal();
document.querySelectorAll('[data-open-run-dialog]').forEach((button) => button.onclick = () => $('#run-dialog').showModal());
$('#confirm-run').onclick = () => void startRun();
$('#run-history').onchange = async (event) => { if (event.target.value) try { await openRun(event.target.value); renderRuns(); renderDashboard(); } catch (error) { message(error.message); } };
$('#category-filter').onchange = renderList; $('#difficulty-filter').onchange = renderList;
$('#suite-select').onchange = async (event) => { if (event.target.value && event.target.value !== activeSuiteKey) try { await activateSuite(event.target.value); } catch (error) { message(error.message); event.target.value = activeSuiteKey; } };
$('#create-suite').onclick = () => void openSuiteEditor(true);
$('#edit-suite').onclick = () => void openSuiteEditor(false);
$('#validate-suite').onclick = async () => {
  try { const snapshot = await api(`/api/suites/${encodeURIComponent(activeSuiteKey)}`); const result = await api('/api/suites/validate', { method: 'POST', body: snapshot }); renderSuiteDiagnostics($('#suite-diagnostics'), result); }
  catch (error) { message(error.message); }
};
$('#suite-editor-validate').onclick = () => void validateEditor();
$('#suite-json-editor').addEventListener('input', () => {
  $('#suite-editor-save').disabled = true;
  $('#suite-editor-diagnostics').textContent = 'محتوا تغییر کرده است؛ برای بررسی دوباره اعتبارسنجی را اجرا کن.';
  $('#suite-editor-diagnostics').classList.remove('has-errors', 'has-warnings');
});
$('#suite-editor-save').onclick = async () => {
  const diagnostics = await validateEditor(); if (!diagnostics?.valid) return;
  const snapshot = JSON.parse($('#suite-json-editor').value);
  try {
    const saved = editorSuiteKey
      ? await api(`/api/suites/${encodeURIComponent(editorSuiteKey)}`, { method: 'PUT', body: snapshot })
      : await api('/api/suites', { method: 'POST', body: snapshot });
    $('#suite-editor-dialog').close(); await activateSuite(saved.suite_key); message(`مجموعهٔ ${snapshot.id} ذخیره و انتخاب شد.`);
  } catch (error) { renderSuiteDiagnostics($('#suite-editor-diagnostics'), { valid: false, errors: [{ path: '$', message: error.message }], warnings: [] }); }
};
async function saveReview(review) {
  if (!runId || saving || loadingRun || report?.run_id !== runId) return; const caseId = suite.cases[selected].id, id = runId;
  reviewRevision += 1;
  saving = true; renderResponse(); $('#run-history').disabled = true; $('#start-run').disabled = true; $('#dashboard-run').disabled = true;
  try {
    const updated = await api(`/api/runs/${id}/reviews/${encodeURIComponent(caseId)}`, { method: 'PUT', body: review });
    if (id !== runId) return;
    reviews = updated; reviewRevision += 1;
    delete drafts[caseId]; choose(review ? Math.min(selected + 1, suite.cases.length - 1) : selected); renderDashboard(); renderRuns();
    message(review ? 'نظر روی سرور ثبت شد.' : 'نظر این پرسش پاک شد.');
  } catch (error) { message(error.message); }
  finally { saving = false; renderResponse(); const busy = Boolean(polling); $('#run-history').disabled = busy; $('#start-run').disabled = busy; $('#dashboard-run').disabled = busy; }
}
$('#review-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  if (!form.has('answer_correct') || !form.has('sources_correct')) { message('هر دو معیار را مشخص کن.'); return; }
  await saveReview({ answer_correct: form.get('answer_correct') === 'true', sources_correct: form.get('sources_correct') === 'true', notes: $('#notes').value });
});
$('#review-form').addEventListener('input', () => {
  const form = new FormData($('#review-form'));
  drafts[suite.cases[selected].id] = { answer_correct: form.has('answer_correct') ? form.get('answer_correct') === 'true' : null, sources_correct: form.has('sources_correct') ? form.get('sources_correct') === 'true' : null, notes: $('#notes').value };
  $('#review-state').textContent = 'پیش‌نویس';
});
$('#previous').onclick = () => { if (!saving && !loadingRun) choose(Math.max(0, selected - 1)); };
$('#next').onclick = () => { if (!saving && !loadingRun) choose(Math.min(suite.cases.length - 1, selected + 1)); };
$('#search').oninput = renderList;
$('#clear').onclick = () => confirmAction({ title: 'پاک‌کردن ارزیابی', description: `نظر ثبت‌شده برای پرسش ${suite.cases[selected].id} حذف شود؟`, confirm: 'پاک‌کردن ارزیابی', danger: true, run: () => saveReview(null) });
$('#theme').onclick = () => { const dark = document.documentElement.classList.toggle('dark'); $('#theme').setAttribute('aria-pressed', String(dark)); $('#theme').setAttribute('aria-label', dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'); $('#theme').title = dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'; };
$('#latest-run').onclick = () => {
  if (!runs.length || saving || loadingRun) return;
  void openRun(runs[0].run_id).then(() => showView('review')).catch((error) => message(error.message));
};
const globalSearch = $('#global-search');
globalSearch.addEventListener('input', renderGlobalSearch);
globalSearch.addEventListener('focus', renderGlobalSearch);
globalSearch.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeGlobalSearch(); });
document.addEventListener('click', (event) => { if (!event.target.closest('.global-search-wrap')) closeGlobalSearch(); });
$('#export').onclick = async () => { if (!runId) { message('ابتدا یک اجرا انتخاب کن.'); return; } try { download(await api(`${runUrl()}/reviews.json`), `${runId}-reviews.json`); } catch (error) { message(error.message); } };
$('#export-review').onclick = $('#export').onclick;
function confirmAction({ title, description, confirm, danger, run }) {
  $('#confirm-title').textContent = title; $('#confirm-description').textContent = description; $('#confirm-content').replaceChildren();
  const action = $('#confirm-action'); action.textContent = confirm; action.classList.toggle('danger-action', Boolean(danger)); action.onclick = () => { $('#confirm-dialog').close(); void run(); };
  $('#confirm-dialog').showModal();
}
document.querySelectorAll('.dialog-close').forEach((button) => button.onclick = () => button.closest('dialog').close());
document.querySelectorAll('.dialog-cancel').forEach((button) => button.onclick = () => button.closest('dialog').close());
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
document.querySelectorAll('[data-view]').forEach((button) => button.onclick = () => showView(button.dataset.view));
sidebarToggle.onclick = () => {
  const collapsed = !appShell.classList.contains('sidebar-collapsed');
  setSidebarCollapsed(collapsed);
};
$('#sidebar-open').onclick = () => { $('#sidebar').classList.add('is-open'); $('#sidebar-backdrop').classList.add('is-open'); };
$('#sidebar-close').onclick = () => showView(document.querySelector('.nav-item.is-active')?.dataset.view || 'dashboard');
$('#sidebar-backdrop').onclick = () => showView(document.querySelector('.nav-item.is-active')?.dataset.view || 'dashboard');
$('#open-latest').onclick = () => showView('review');
$('#dashboard-reviews').onclick = () => showView('review');
$('#suite-details').onclick = () => { const selectedSuite = activeSuite || suite; showDetail(selectedSuite?.id || 'مجموعهٔ آزمون', `${selectedSuite?.description || ''}\n\nنسخه: ${selectedSuite?.version || 'ثبت‌نشده'}\n${selectedSuite?.documents.length || 0} سند\n${selectedSuite?.cases.length || 0} پرسش\n\nشناسهٔ اسناد: ${selectedSuite?.documents.map((item) => item.id).join('، ')}`, 'مجموعهٔ انتخاب‌شده برای اجرای بعدی'); };
for (const selector of ['#export', '#export-review', '#previous', '#next', '#run-history', '#search', '#category-filter', '#difficulty-filter', '#dashboard-run', '#dashboard-reviews', '#open-latest', '#suite-details', '#suite-select', '#edit-suite', '#validate-suite', '#create-suite']) $(selector).disabled = true;
$('#review-form').querySelectorAll('input, textarea, button').forEach((control) => { control.disabled = true; });
try {
  const info = await api('/api/info'); suite = info.suite; activeSuite = info.suite; activeSuiteKey = info.suite_key || '';
  $('#adapter-label').textContent = info.adapter === 'fixture' ? 'اجرای محلی fixture' : 'Nexora'; $('#suite-label').textContent = suite.id;
  updateSuiteHeader(); populateCaseFilters(); await reloadSuiteCatalog();
  $('#dialog-adapter').textContent = info.adapter === 'fixture' ? 'Fixture محلی · پاسخ ساختگی' : 'Nexora · API متصل';
  choose(0); await history();
  if (runs[0]) await openRun(runs[0].run_id);
  renderDashboard();
  for (const selector of ['#start-run', '#dashboard-run', '#export', '#export-review', '#run-history', '#search', '#category-filter', '#difficulty-filter', '#suite-details', '#create-suite']) $(selector).disabled = false;
  $('#suite-select').disabled = false; $('#edit-suite').disabled = !activeSuiteKey; $('#validate-suite').disabled = !activeSuiteKey;
  showView('dashboard');
} catch (error) { message(error.message); document.querySelectorAll('button').forEach((button) => { button.disabled = true; }); }
