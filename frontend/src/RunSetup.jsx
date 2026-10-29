import {t, locale, direction} from './i18n.js';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function RunSetup({ suite, suiteKey, suites, adapter, busy, running, onSelect, onStart, onBack }) {
  const count = suite?.cases?.length || 0;
  const available = suites.some((item) => item.valid);
  const reason = busy ? t("در حال آماده‌سازی…") : running ? t("یک آزمون در حال اجراست؛ پس از پایان آن می‌توانید آزمون جدیدی شروع کنید.") : !available ? t("ابتدا از بخش مجموعه‌های آزمون، یک مجموعهٔ معتبر بسازید.") : !count ? t("مجموعهٔ انتخاب‌شده پرسشی ندارد.") : '';
  return <ControlSizeProvider size="xl"><div className="dig-surface mx-auto max-w-form space-y-6 text-foreground">
    <header className="space-y-2"><h1 className="text-title font-bold">{t("اجرای آزمون")}</h1><p className="text-description text-muted-foreground">{t("مجموعه را انتخاب کنید و پاسخ‌ها را برای ارزیابی دریافت کنید.")}</p></header>
    <Card aria-labelledby="run-form-title">
      <CardHeader><CardTitle asChild><h2 id="run-form-title">{t("چه مجموعه‌ای اجرا شود؟")}</h2></CardTitle><CardDescription>{t("پرسش‌های این مجموعه با تنظیمات فعلی سرور اجرا می‌شوند.")}</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2"><label id="run-suite-label" className="text-label">{t("مجموعهٔ آزمون")}</label><Select dir={direction()} value={suiteKey} disabled={busy || running || !available} onValueChange={onSelect}><SelectTrigger className="w-full" aria-labelledby="run-suite-label" aria-describedby="run-suite-description"><SelectValue placeholder={t("انتخاب مجموعه")} /></SelectTrigger><SelectContent>{suites.map((item) => <SelectItem key={item.suite_key} value={item.suite_key} disabled={!item.valid}>{item.id || item.suite_key}</SelectItem>)}</SelectContent></Select><p id="run-suite-description" className="text-description text-muted-foreground">{suite?.description || t("یک مجموعهٔ معتبر برای اجرا انتخاب کنید.")}</p></div>
        {suite && <dl className="grid grid-cols-2 gap-4 rounded-lg bg-subtle p-4"><div><dt className="text-label text-muted-foreground">{t("پرسش")}</dt><dd className="m-0 mt-1 text-subheading font-semibold">{count.toLocaleString(locale())}</dd></div><div><dt className="text-label text-muted-foreground">{t("سند مرجع")}</dt><dd className="m-0 mt-1 text-subheading font-semibold">{(suite.documents?.length || 0).toLocaleString(locale())}</dd></div></dl>}
        <div className="space-y-2 rounded-lg bg-primary-subtle p-4"><p className="text-body font-medium text-primary-subtle-foreground">{adapter === 'fixture' ? t("اجرای آزمایشی با پاسخ ساختگی") : t("دریافت پاسخ از Nexora")}</p><p className="text-description text-muted-foreground">{adapter === 'fixture' ? t("این اجرا برای آزمایش ابزار است و کیفیت پاسخ Nexora را نشان نمی‌دهد.") : t("پس از شروع، پاسخ‌ها و منابع در صفحهٔ ارزیابی قابل بررسی‌اند.")}</p></div>
        <details className="border-0 p-0"><summary className="text-description text-muted-foreground">{t("چه اطلاعاتی ذخیره می‌شود؟")}</summary><p className="text-description text-muted-foreground">{t("پاسخ، منابع، زمان، خطاها و تنظیمات در گزارشی مستقل ذخیره می‌شوند. نسخهٔ مجموعه:")} <bdi>{suite?.version || t("ثبت‌نشده")}</bdi>.</p></details>
        {reason && <p role="status" className="text-description text-muted-foreground">{reason}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-3"><Button fullWidth loading={busy} disabled={Boolean(reason)} onClick={onStart}>{t("شروع آزمون")}</Button><Button variant="ghost" fullWidth onClick={onBack}>{t("بازگشت به داشبورد")}</Button></CardFooter>
    </Card>
  </div></ControlSizeProvider>;
}
