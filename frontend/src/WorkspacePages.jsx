import React from 'react';

export { default as SuitesPage } from './SuitesPage.jsx';

export function GuidePage({ criteria }) {
  return <><section className="page-heading"><div><h1>راهنمای ارزیابی</h1><p className="muted">مبنای مشترک برای بازبینی پاسخ‌ها و منابع</p></div></section><section className="panel"><div className="workspace-page-body"><p>ابتدا پرسش، پاسخ مرجع و اسناد را بخوانید؛ سپس پاسخ سیستم را برای هر معیار جداگانه ارزیابی کنید.</p>{criteria.map((item) => <section className="guide-criterion" key={item.key}><h2>{item.title}</h2><p>{item.guide}</p></section>)}<p className="muted">نام ارزیاب را ثبت کنید و برای امتیازهای پایین، دلیل و شاهد بنویسید. هر ثبت یا حذف ارزیابی در تاریخچهٔ همان پرسش باقی می‌ماند.</p></div></section></>;
}

export { default as ConnectionPage } from './ConnectionPage.jsx';
