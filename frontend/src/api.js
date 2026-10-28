const errors = {
  invalid_credentials: 'نام کاربری یا رمز عبور نادرست است.',
  invalid_connection: 'نشانی API یا کلید واردشده معتبر نیست؛ اتصال باید با قرارداد Nexora سازگار باشد.',
  too_many_attempts: 'تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقهٔ دیگر دوباره امتحان کن.',
  authentication_required: 'نشست ورود پایان یافته است؛ دوباره وارد شو.',
  run_in_progress: 'آزمونی در حال اجراست؛ پس از پایان دوباره تلاش کن.',
  suite_already_exists: 'شناسهٔ این مجموعه قبلاً استفاده شده است؛ شناسهٔ دیگری انتخاب کن.',
  invalid_configuration_or_request: 'تنظیمات یا توکن Nexora معتبر نیست. تنظیمات و متغیر محیطی NEXORA_TOKEN را بررسی کن.',
  storage_error: 'خواندن یا ذخیرهٔ فایل روی سرور ناموفق بود.',
  invalid_review: 'اطلاعات ارزیابی معتبر نیست.',
  not_found: 'اجرا یا فایل پیدا نشد.',
};

export async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-NexoLab-Request': '1', ...options.headers },
      body: Object.hasOwn(options, 'body') ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('ارتباط با سرور NexoLab برقرار نشد. سرور را اجرا کن.');
  }
  let data;
  try { data = await response.json(); }
  catch {
    throw new Error('سرور FastAPI در دسترس نیست یا پاسخ غیر JSON داده است. اگر هنوز حساب مدیر نساخته‌ای، یک بار nexolab --create-admin --output runs را اجرا کن. سپس سرور را با nexolab --serve --suite datasets/persian.synthetic.json --config configs/fixture.json --output runs --port 8013 روشن نگه دار و صفحهٔ http://127.0.0.1:8013 را باز کن.');
  }
  if (response.status === 401 && data.error === 'authentication_required') {
    window.dispatchEvent(new CustomEvent('nexolab:auth-expired'));
  }
  if (!response.ok) {
    const details = [...(data.errors || []), ...(data.warnings || [])]
      .map((item) => `${item.path}: ${item.message}`).join('\n');
    if (response.status === 404 && url.startsWith('/api/suites')) {
      throw new Error('API مدیریت مجموعه‌ها در سرور فعلی وجود ندارد؛ سرور را با نسخهٔ فعلی NexoLab دوباره اجرا کن.');
    }
    throw new Error(details || errors[data.error] || 'درخواست ناموفق بود. تنظیمات سرور را بررسی کن.');
  }
  return data;
}

export function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadUrl(url, filename) {
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
}
