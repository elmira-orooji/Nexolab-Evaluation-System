const errors = {
  run_in_progress: 'آزمونی در حال اجراست؛ پس از پایان دوباره تلاش کن.',
  suite_already_exists: 'شناسهٔ این مجموعه قبلاً استفاده شده است؛ شناسهٔ دیگری انتخاب کن.',
  invalid_configuration_or_request: 'تنظیمات یا توکن Nexora معتبر نیست. تنظیمات و متغیر محیطی NEXORA_TOKEN را بررسی کن.',
  storage_error: 'خواندن یا ذخیرهٔ فایل روی سرور ناموفق بود.',
  invalid_review: 'اطلاعات ارزیابی معتبر نیست.',
  not_found: 'اجرا یا فایل پیدا نشد.',
};
export async function api(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'X-NexoLab-Request': '1' }, body: Object.hasOwn(options, 'body') ? JSON.stringify(options.body) : undefined }); }
  catch { throw new Error('ارتباط با سرور NexoLab برقرار نشد. سرور را اجرا کن.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('پاسخ معتبر نیست؛ رابط را با nexolab --serve باز کن.'); }
  if (!response.ok) {
    const details = [...(data.errors || []), ...(data.warnings || [])].map((item) => `${item.path}: ${item.message}`).join('\n');
    throw new Error(details || errors[data.error] || 'درخواست ناموفق بود. تنظیمات سرور را بررسی کن.');
  }
  return data;
}
export function download(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
