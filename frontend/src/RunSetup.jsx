import React from 'react';
import { Icon } from './components.jsx';
import './run-setup.css';

export default function RunSetup({ suite, suiteKey, suites, adapter, busy, running, onSelect, onStart, onBack }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">اجرای جدید</p><h1>اجرای آزمون</h1><p className="muted">مجموعهٔ آزمون و مشخصات اتصال را پیش از شروع بررسی کنید.</p></div><button className="secondary" onClick={onBack}>بازگشت به داشبورد</button></section>
    <div className="run-setup-grid">
      <section className="panel"><div className="panel-title"><h2>مجموعهٔ آزمون</h2></div><div className="run-setup-body">
        <label htmlFor="new-run-suite">انتخاب مجموعه</label><select id="new-run-suite" value={suiteKey} disabled={busy || running} onChange={(event) => onSelect(event.target.value)}>{suites.map((item) => <option key={item.suite_key} value={item.suite_key} disabled={!item.valid}>{item.id || item.suite_key} · {item.version || 'بدون نسخه'}</option>)}</select>
        {suite ? <><h3>{suite.id}</h3><p className="muted">{suite.description}</p><dl className="run-setup-facts"><div><dt>پرسش‌ها</dt><dd>{(suite.cases?.length || 0).toLocaleString('fa-IR')}</dd></div><div><dt>اسناد</dt><dd>{(suite.documents?.length || 0).toLocaleString('fa-IR')}</dd></div><div><dt>نسخه</dt><dd>{suite.version || 'ثبت‌نشده'}</dd></div></dl></> : <p className="muted">مجموعه‌ای برای اجرا در دسترس نیست.</p>}
      </div></section>
      <aside className="panel"><div className="panel-title"><h2>مشخصات اجرا</h2></div><div className="run-setup-body"><span className="muted">آداپتر فعال سرور</span><h3>{adapter === 'fixture' ? 'Fixture محلی' : 'Nexora'}</h3><p className="muted">{adapter === 'fixture' ? 'این حالت پاسخ‌های ساختگی را برای آزمایش جریان اجرا بازمی‌گرداند.' : 'پرسش‌ها با تنظیمات اتصال فعلی سرور به Nexora ارسال می‌شوند.'}</p><p className="run-setup-note">پاسخ‌ها، منابع، زمان و خطاهای هر درخواست همراه تنظیمات اجرا در گزارش مستقل ذخیره می‌شوند.</p><button className="primary run-setup-start" disabled={busy || running || !suite?.cases?.length} onClick={onStart}><Icon name="play" />{busy ? 'در حال آماده‌سازی…' : running ? 'یک آزمون در حال اجراست' : 'شروع آزمون'}</button></div></aside>
    </div>
  </>;
}
