import { api, download } from './client.js';
const $ = (selector) => document.querySelector(selector);
const number = (value) => new Intl.NumberFormat('fa-IR').format(value);
let suite, selected = 0, runId = '', report = null, reviews = {}, drafts = {}, polling = null, saving = false, runs = [];
let reviewRevision = 0;
let loadingRun = false;
let runRequest = 0;
const message = (text) => { $('#message').textContent = text; };
const currentResult = () => report?.results.find((result) => result.case_id === suite.cases[selected].id);
const runUrl = () => `/api/runs/${runId}`;

function renderList() {
  const query = $('#search').value.trim(), list = $('#case-list'); list.replaceChildren();
  suite.cases.forEach((item, index) => {
    if (query && !item.question.includes(query)) return;
    const button = document.createElement('button'); button.className = `case-item${index === selected ? ' active' : ''}`;
    button.setAttribute('aria-current', String(index === selected));
    const top = document.createElement('span'); top.className = 'case-top';
    const id = document.createElement('span'); id.className = 'mono'; id.textContent = item.id;
    const result = report?.results.find((entry) => entry.case_id === item.id);
    const state = document.createElement('span'); state.textContent = reviews[item.id] ? 'بررسی شده' : result?.error ? 'خطای اجرا' : result ? 'آمادهٔ بررسی' : 'در انتظار';
    if (reviews[item.id]) state.className = 'done';
    const question = document.createElement('p'); question.textContent = item.question;
    top.append(id, state); button.append(top, question); button.onclick = () => { if (!saving && !loadingRun) choose(index); }; list.append(button);
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
  $('#breadcrumb-title').textContent = titles[name] || titles.dashboard;
  $('#sidebar').classList.remove('is-open'); $('#sidebar-backdrop').classList.remove('is-open');
  if (name === 'review' && suite) choose(selected);
}
function runLabel(item) { return `${new Date(item.started_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })} · ${item.run_id.slice(0, 8)}`; }
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
}
function renderDashboard() {
  if (!suite) return;
  $('#stat-cases').textContent = number(suite.cases.length); $('#stat-suite').textContent = suite.id;
  $('#dashboard-suite-name').textContent = suite.id; $('#dashboard-suite-description').textContent = suite.description || `${number(suite.documents.length)} سند ساختگی · ${number(suite.cases.length)} پرسش`;
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
  select.value = runId; renderRuns(); renderDashboard();
}
async function refresh(id) {
  const revision = reviewRevision;
  const data = await api(`/api/runs/${id}`); if (id !== runId) return;
  if (saving || revision !== reviewRevision) {
    polling = setTimeout(() => refresh(id).catch((error) => message(error.message)), 800);
    return;
  }
  report = data.report; suite = report.suite; reviews = data.reviews;
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
$('#theme').onclick = () => { const dark = document.documentElement.classList.toggle('dark'); $('#theme').textContent = dark ? 'حالت روشن' : 'حالت تیره'; $('#theme').setAttribute('aria-pressed', String(dark)); };
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
$('#sidebar-open').onclick = () => { $('#sidebar').classList.add('is-open'); $('#sidebar-backdrop').classList.add('is-open'); };
$('#sidebar-close').onclick = () => showView(document.querySelector('.nav-item.is-active')?.dataset.view || 'dashboard');
$('#sidebar-backdrop').onclick = () => showView(document.querySelector('.nav-item.is-active')?.dataset.view || 'dashboard');
$('#open-latest').onclick = () => showView('review');
$('#dashboard-reviews').onclick = () => showView('review');
$('#suite-details').onclick = () => showDetail(suite?.id || 'مجموعهٔ آزمون', `${suite?.description || ''}\n\n${suite?.documents.length || 0} سند ساختگی\n${suite?.cases.length || 0} پرسش\n\nشناسهٔ اسناد: ${suite?.documents.map((item) => item.id).join('، ')}`, 'اطلاعات بارگذاری‌شده از تنظیمات فعلی سرور');
for (const selector of ['#export', '#export-review', '#previous', '#next', '#run-history', '#search', '#dashboard-run', '#dashboard-reviews', '#open-latest', '#suite-details']) $(selector).disabled = true;
$('#review-form').querySelectorAll('input, textarea, button').forEach((control) => { control.disabled = true; });
try {
  const info = await api('/api/info'); suite = info.suite;
  $('#adapter-label').textContent = info.adapter === 'fixture' ? 'اجرای محلی fixture' : 'Nexora'; $('#suite-label').textContent = suite.id;
  $('#dialog-suite').textContent = suite.id; $('#dashboard-suite-name').textContent = suite.id;
  $('#dialog-adapter').textContent = info.adapter === 'fixture' ? 'Fixture محلی · پاسخ ساختگی' : 'Nexora · API متصل';
  choose(0); await history();
  if (runs[0]) await openRun(runs[0].run_id);
  renderDashboard();
  for (const selector of ['#start-run', '#dashboard-run', '#export', '#export-review', '#run-history', '#search', '#suite-details']) $(selector).disabled = false;
  showView('dashboard');
} catch (error) { message(error.message); document.querySelectorAll('button').forEach((button) => { button.disabled = true; }); }
