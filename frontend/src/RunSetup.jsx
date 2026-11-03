import {t, locale, direction} from './i18n.js';
import React from 'react';
import { Play, LibraryBig, Files, MessageSquare, FlaskConical, Plug, Info } from 'lucide-react';
import './run-setup.css';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function RunSetup({ suite, suiteKey, suites, adapter, busy, running, onSelect, onStart, onBack }) {
  const count = suite?.cases?.length || 0;
  const available = suites.some((item) => item.valid);
  const reason = busy ? t("در حال آماده‌سازی…") : running ? t("یک آزمون در حال اجراست؛ پس از پایان آن می‌توانید آزمون جدیدی شروع کنید.") : !available ? t("ابتدا از بخش مجموعه‌های آزمون، یک مجموعهٔ معتبر بسازید.") : !count ? t("مجموعهٔ انتخاب‌شده پرسشی ندارد.") : '';
  return <ControlSizeProvider size="default"><div className="run-setup-page dig-surface space-y-6 text-foreground">
    <header className="run-setup-page__header"><span className="run-setup-page__eyebrow"><Play size={15} aria-hidden="true"/>{t("اجرای آزمون جدید")}</span><h1 className="run-setup-page__title">{t("اجرای آزمون")}</h1><p className="text-description text-muted-foreground">{t("مجموعه را انتخاب کنید و پاسخ‌ها را برای ارزیابی دریافت کنید.")}</p></header>
    <Card className="run-setup-page__card" aria-labelledby="run-form-title">
      <CardHeader><CardTitle asChild><h2 id="run-form-title"><LibraryBig size={19} aria-hidden="true"/>{t("چه مجموعه‌ای اجرا شود؟")}</h2></CardTitle><CardDescription>{t("پرسش‌های این مجموعه با تنظیمات فعلی سرور اجرا می‌شوند.")}</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2"><label id="run-suite-label" className="text-label">{t("مجموعهٔ آزمون")}</label><Select dir={direction()} value={suiteKey} disabled={busy || running || !available} onValueChange={onSelect}><SelectTrigger className="w-full" aria-labelledby="run-suite-label" aria-describedby="run-suite-description"><SelectValue placeholder={t("انتخاب مجموعه")} /></SelectTrigger><SelectContent>{suites.map((item) => <SelectItem key={item.suite_key} value={item.suite_key} disabled={!item.valid}>{item.name || item.id || item.suite_key}</SelectItem>)}</SelectContent></Select><p id="run-suite-description" className="text-description text-muted-foreground">{suite?.description || t("یک مجموعهٔ معتبر برای اجرا انتخاب کنید.")}</p></div>
        {suite && <dl className="run-setup-page__facts"><div><dt className="text-label text-muted-foreground"><MessageSquare size={15} aria-hidden="true"/>{t("پرسش")}</dt><dd className="m-0 mt-1 text-subheading font-semibold">{count.toLocaleString(locale())}</dd></div><div><dt className="text-label text-muted-foreground"><Files size={15} aria-hidden="true"/>{t("سند مرجع")}</dt><dd className="m-0 mt-1 text-subheading font-semibold">{(suite.documents?.length || 0).toLocaleString(locale())}</dd></div></dl>}
        <div className="run-setup-page__mode"><span className="run-setup-page__mode-icon">{adapter === "fixture" ? <FlaskConical size={20} aria-hidden="true"/> : <Plug size={20} aria-hidden="true"/>}</span><div className="space-y-2"><p className="text-body font-medium text-primary-subtle-foreground">{adapter === 'fixture' ? t("اجرای آزمایشی با پاسخ ساختگی") : t("دریافت پاسخ از Nexora")}</p><p className="text-description text-muted-foreground">{adapter === 'fixture' ? t("این اجرا برای آزمایش ابزار است و کیفیت پاسخ Nexora را نشان نمی‌دهد.") : t("پس از شروع، پاسخ‌ها و منابع در صفحهٔ ارزیابی قابل بررسی‌اند.")}</p></div></div>
        <details className="run-setup-page__storage"><summary className="text-description text-muted-foreground">{t("چه اطلاعاتی ذخیره می‌شود؟")}</summary><p className="text-description text-muted-foreground">{t("پاسخ، منابع، زمان، خطاها و تنظیمات در گزارشی مستقل ذخیره می‌شوند. نسخهٔ مجموعه:")} <bdi>{suite?.version || t("ثبت‌نشده")}</bdi>.</p></details>
        {reason && <p role="status" className="run-setup-page__reason"><Info size={16} aria-hidden="true"/>{reason}</p>}
      </CardContent>
      <CardFooter className="run-setup-page__footer grid min-w-0"><Button fullWidth loading={busy} disabled={Boolean(reason)} onClick={onStart}><Play size={16} aria-hidden="true"/>{t("شروع آزمون")}</Button><Button variant="outline" fullWidth onClick={onBack}>{t("بازگشت به داشبورد")}</Button></CardFooter>
    </Card>
  </div></ControlSizeProvider>;
}
