const $ = (selector) => document.querySelector(selector);
const storageKey = 'nexolab.prototype.reviews.v1';
const number = (value) => new Intl.NumberFormat('fa-IR').format(value);
let suite, selected = 0, reviews = {};
const drafts = {};
let storageAvailable = true;
try { reviews = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (!reviews || typeof reviews !== 'object' || Array.isArray(reviews)) reviews = {}; }
catch { storageAvailable = false; }
const message = (text) => { $('#message').textContent = text; };

function renderList() {
  const query = $('#search').value.trim();
  const list = $('#case-list'); list.replaceChildren();
  suite.cases.forEach((item, index) => {
    if (query && !item.question.includes(query)) return;
    const button = document.createElement('button');
    button.className = `case-item${index === selected ? ' active' : ''}`;
    button.setAttribute('aria-current', String(index === selected));
    const top = document.createElement('span'); top.className = 'case-top';
    const id = document.createElement('span'); id.className = 'mono'; id.textContent = item.id;
    const state = document.createElement('span'); state.textContent = reviews[item.id] ? 'بررسی شده' : 'در انتظار';
    if (reviews[item.id]) state.className = 'done';
    const question = document.createElement('p'); question.textContent = item.question;
    top.append(id, state); button.append(top, question); button.onclick = () => choose(index); list.append(button);
  });
  if (!list.children.length) list.textContent = 'پرسشی پیدا نشد.';
  const done = suite.cases.filter((item) => reviews[item.id]).length;
  $('#progress').value = done;
  $('#progress-label').textContent = `${number(done)} از ${number(suite.cases.length)} بررسی شده`;
}

function choose(index) {
  selected = index;
  const item = suite.cases[index];
  $('#case-id').textContent = item.id;
  $('#question').textContent = item.question;
  $('#answer').textContent = item.reference_answer;
  $('#reference').textContent = item.reference_answer;
  $('#position').textContent = `${number(index + 1)} از ${number(suite.cases.length)}`;
  $('#previous').disabled = index === 0;
  $('#next').disabled = index === suite.cases.length - 1;
  const sources = $('#sources'); sources.replaceChildren();
  item.expected_document_ids.forEach((id) => {
    const doc = suite.documents.find((document) => document.id === id);
    const source = document.createElement('article'); source.className = 'source';
    const title = document.createElement('h4'); title.textContent = doc.title;
    const content = document.createElement('p'); content.textContent = doc.text;
    source.append(title, content); sources.append(source);
  });
  if (!sources.children.length) { const note = document.createElement('p'); note.className = 'muted'; note.textContent = 'پاسخ این پرسش در اسناد نیست. انتظار می‌رود سیستم نبود اطلاعات را اعلام کند.'; sources.append(note); }
  $('#review-form').reset();
  const review = drafts[item.id] || reviews[item.id];
  if (review) {
    for (const key of ['answer_correct', 'sources_correct']) {
      const input = document.querySelector(`input[name="${key}"][value="${review[key]}"]`);
      if (input) input.checked = true;
    }
    $('#notes').value = review.notes || '';
  }
  $('#review-state').textContent = drafts[item.id] ? 'پیش‌نویس' : reviews[item.id] ? 'ثبت شده' : 'بررسی نشده';
  renderList();
}

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(reviews)); storageAvailable = true; }
  catch { storageAvailable = false; }
}

$('#review-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (!form.has('answer_correct') || !form.has('sources_correct')) { message('درستی پاسخ و پشتیبانی منابع را مشخص کن.'); return; }
  reviews[suite.cases[selected].id] = { answer_correct: form.get('answer_correct') === 'true', sources_correct: form.get('sources_correct') === 'true', notes: $('#notes').value, reviewed_at: new Date().toISOString() };
  delete drafts[suite.cases[selected].id];
  persist();
  const next = selected < suite.cases.length - 1 ? selected + 1 : selected;
  choose(next);
  message(storageAvailable ? 'نظر ثبت شد.' : 'نظر در حافظه ثبت شد؛ ذخیرهٔ مرورگر در دسترس نیست. پیش از بستن صفحه خروجی بگیر.');
});
$('#review-form').addEventListener('input', () => {
  if (!suite) return;
  const form = new FormData($('#review-form'));
  drafts[suite.cases[selected].id] = {
    answer_correct: form.has('answer_correct') ? form.get('answer_correct') === 'true' : null,
    sources_correct: form.has('sources_correct') ? form.get('sources_correct') === 'true' : null,
    notes: $('#notes').value,
  };
  $('#review-state').textContent = 'پیش‌نویس';
});
$('#previous').onclick = () => choose(Math.max(0, selected - 1));
$('#next').onclick = () => choose(Math.min(suite.cases.length - 1, selected + 1));
$('#search').oninput = renderList;
$('#clear').onclick = () => {
  delete reviews[suite.cases[selected].id]; delete drafts[suite.cases[selected].id];
  persist(); choose(selected);
  message(storageAvailable ? 'نظر این پرسش پاک شد.' : 'نظر فقط از حافظه پاک شد؛ ذخیرهٔ مرورگر در دسترس نیست و ممکن است پس از بازکردن صفحه بازگردد.');
};
$('#theme').onclick = () => { const dark = document.documentElement.classList.toggle('dark'); $('#theme').textContent = dark ? 'حالت روشن' : 'حالت تیره'; $('#theme').setAttribute('aria-pressed', String(dark)); };
$('#export').onclick = () => {
  const blob = new Blob([JSON.stringify({ schema_version: 1, prototype: true, suite_id: suite.id, exported_at: new Date().toISOString(), reviews }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'nexolab-demo-reviews.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('فایل ارزیابی‌ها آمادهٔ دریافت شد.');
};
try { const response = await fetch('cases.json'); if (!response.ok) throw new Error('load'); suite = await response.json(); choose(0); }
catch { message('بارگذاری مجموعه ناموفق بود. صفحه را از سرور محلی باز کن.'); document.querySelectorAll('button').forEach((button) => { button.disabled = true; }); }
