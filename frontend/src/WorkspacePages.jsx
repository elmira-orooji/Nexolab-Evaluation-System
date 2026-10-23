import React from 'react';

export { default as SuitesPage } from './SuitesPage.jsx';

export function GuidePage({ criteria }) {
  return <><section className="page-heading"><div><h1>راهنمای ارزیابی</h1><p className="muted">مبنای مشترک برای بازبینی پاسخ‌ها و منابع</p></div></section><section className="panel"><div className="workspace-page-body"><p>ابتدا پرسش، پاسخ مرجع و اسناد را بخوانید؛ سپس پاسخ سیستم را برای هر معیار جداگانه ارزیابی کنید.</p>{criteria.map((item) => <section className="guide-criterion" key={item.key}><h2>{item.title}</h2><p>{item.guide}</p></section>)}<p className="muted">نام ارزیاب را ثبت کنید و برای امتیازهای پایین، دلیل و شاهد بنویسید. هر ثبت یا حذف ارزیابی در تاریخچهٔ همان پرسش باقی می‌ماند.</p></div></section></>;
}

export function ConnectionPage({ adapter }) {
  return <><section className="page-heading"><div><h1>اتصال و تنظیمات</h1><p className="muted">روش اتصال فعال برای اجرای آزمون‌ها</p></div></section><section className="panel"><div className="panel-title"><h2>آداپتر فعال</h2><strong>{adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'}</strong></div><div className="workspace-page-body"><p>{adapter === 'fixture' ? 'سرور در حالت آزمایشی اجرا شده و پاسخ‌های ساختگی بازمی‌گرداند.' : 'سرور برای ارسال پرسش‌ها به API سرویس Nexora تنظیم شده است.'}</p><p>آداپتر، نشانی سرویس و timeout از فایل پیکربندی مشخص‌شده با گزینهٔ <code dir="ltr">--config</code> هنگام راه‌اندازی سرور خوانده می‌شوند. برای اعمال تغییرات فایل، سرور را دوباره راه‌اندازی کنید.</p><p className="muted">این صفحه وضعیت آداپتر را نمایش می‌دهد؛ ویرایش تنظیمات اتصال و توکن از داخل رابط هنوز پشتیبانی نمی‌شود. توکن در این صفحه نمایش داده نمی‌شود.</p></div></section></>;
}
