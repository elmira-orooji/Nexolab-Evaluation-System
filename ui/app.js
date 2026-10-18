import { api, download } from './client.js';
const $ = (selector) => document.querySelector(selector);
const number = (value) => new Intl.NumberFormat('fa-IR').format(value);
let suite, selected = 0, runId = '', report = null, reviews = {}, drafts = {}, polling = null, saving = false;
let reviewRevision = 0;
let loadingRun = false;
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
  source.append(heading, text); container.append(source);
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
  const runs = await api('/api/runs'), select = $('#run-history'); select.replaceChildren(new Option('انتخاب اجرا', ''));
  for (const item of runs) select.append(new Option(`${item.started_at.slice(0, 19)} · ${item.adapter} · ${item.run_id.slice(0, 8)}`, item.run_id));
  select.value = runId;
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
  $('#start-run').disabled = data.state === 'running' || saving || loadingRun; $('#run-history').disabled = data.state === 'running' || saving || loadingRun;
  for (const [selector, filename] of [['#download-json', 'report.json'], ['#download-csv', 'report.csv']]) { $(selector).href = `${runUrl()}/${filename}`; $(selector).hidden = selector === '#download-csv' && data.state !== 'completed'; }
  choose(Math.min(selected, suite.cases.length - 1));
  if (data.state === 'running') polling = setTimeout(() => refresh(id).catch((error) => { message(error.message); $('#start-run').disabled = true; }), 800);
  else { polling = null; await history(); }
}
async function openRun(id) {
  clearTimeout(polling); loadingRun = true; runId = id; selected = 0; drafts = {};
  renderResponse(); $('#start-run').disabled = true; $('#run-history').disabled = true;
  try { await refresh(id); }
  catch (error) { runId = ''; report = null; reviews = {}; throw error; }
  finally { loadingRun = false; renderResponse(); $('#start-run').disabled = Boolean(polling); $('#run-history').disabled = Boolean(polling); }
}
$('#start-run').onclick = async () => { $('#start-run').disabled = true; try { const data = await api('/api/runs', { method: 'POST', body: {} }); await openRun(data.run_id); message('اجرا شروع شد.'); } catch (error) { message(error.message); $('#start-run').disabled = false; } };
$('#run-history').onchange = async (event) => { if (event.target.value) try { await openRun(event.target.value); } catch (error) { message(error.message); } };
async function saveReview(review) {
  if (!runId || saving || loadingRun || report?.run_id !== runId) return; const caseId = suite.cases[selected].id, id = runId;
  reviewRevision += 1;
  saving = true; renderResponse(); $('#run-history').disabled = true; $('#start-run').disabled = true;
  try {
    const updated = await api(`/api/runs/${id}/reviews/${encodeURIComponent(caseId)}`, { method: 'PUT', body: review });
    if (id !== runId) return;
    reviews = updated; reviewRevision += 1;
    delete drafts[caseId]; choose(review ? Math.min(selected + 1, suite.cases.length - 1) : selected);
    message(review ? 'نظر روی سرور ثبت شد.' : 'نظر این پرسش پاک شد.');
  } catch (error) { message(error.message); }
  finally { saving = false; renderResponse(); $('#run-history').disabled = false; $('#start-run').disabled = Boolean(polling); }
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
$('#search').oninput = renderList; $('#clear').onclick = () => saveReview(null);
$('#theme').onclick = () => { const dark = document.documentElement.classList.toggle('dark'); $('#theme').textContent = dark ? 'حالت روشن' : 'حالت تیره'; $('#theme').setAttribute('aria-pressed', String(dark)); };
$('#export').onclick = async () => { if (!runId) { message('ابتدا یک اجرا انتخاب کن.'); return; } try { download(await api(`${runUrl()}/reviews.json`), `${runId}-reviews.json`); } catch (error) { message(error.message); } };
for (const selector of ['#start-run', '#export', '#previous', '#next', '#run-history', '#search']) $(selector).disabled = true;
$('#review-form').querySelectorAll('input, textarea, button').forEach((control) => { control.disabled = true; });
try {
  const info = await api('/api/info'); suite = info.suite;
  $('#adapter-label').textContent = info.adapter === 'fixture' ? 'اجرای محلی fixture' : 'Nexora'; $('#suite-label').textContent = suite.id;
  choose(0); await history();
  for (const selector of ['#start-run', '#export', '#run-history', '#search']) $(selector).disabled = false;
} catch (error) { message(error.message); document.querySelectorAll('button').forEach((button) => { button.disabled = true; }); }
