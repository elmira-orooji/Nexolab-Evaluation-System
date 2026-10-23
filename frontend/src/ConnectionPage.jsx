import React from 'react';
import { Palette, Sun, Moon, Plug, Info } from 'lucide-react';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function Heading({id,icon:Icon,title,description}) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle text-primary-subtle-foreground"><Icon className="size-4" aria-hidden="true"/></span><div className="min-w-0 space-y-1"><h2 id={id} className="m-0 text-body font-normal">{title}</h2><p className="text-caption text-muted-foreground">{description}</p></div></div>;
}

function ThemePreview({dark}) {
  return <div aria-hidden="true" className={'flex h-24 overflow-hidden rounded-md border border-border ' + (dark ? 'bg-inverse' : 'bg-subtle')}><div className={'flex w-1/4 flex-col gap-2 border-e border-border p-3 ' + (dark ? 'bg-inverse-raised' : 'bg-card')}><span className="h-1 rounded bg-primary"/><span className="h-1 rounded bg-placeholder"/><span className="h-1 rounded bg-placeholder"/></div><div className="flex flex-1 flex-col gap-3 p-3"><span className="h-1 w-1/2 rounded bg-placeholder"/><div className="grid flex-1 grid-cols-2 gap-2"><span className={'rounded border border-border ' + (dark ? 'bg-inverse-raised' : 'bg-card')}/><span className={'rounded border border-border ' + (dark ? 'bg-inverse-raised' : 'bg-card')}/></div><span className="h-1 w-3/4 rounded bg-placeholder"/></div></div>;
}

export default function ConnectionPage({adapter,dark,onThemeChange}) {
  const fixture = adapter === 'fixture';
  return <ControlSizeProvider size="default"><div className="dig-surface mx-auto w-full max-w-3xl space-y-4 text-foreground">
    <header className="mb-6 space-y-2"><h1 className="text-subheading font-normal">اتصال و تنظیمات</h1><p className="text-description text-muted-foreground">ظاهر محیط را انتخاب کنید و روش اجرای آزمون‌ها را ببینید.</p></header>
    <section aria-labelledby="settings-appearance-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-appearance-title" icon={Palette} title="ظاهر محیط" description="تغییرها بلافاصله اعمال و در همین مرورگر ذخیره می‌شوند."/>
      <RadioGroup aria-labelledby="settings-appearance-title" name="settings-theme" value={dark ? 'dark' : 'light'} onValueChange={(value) => onThemeChange(value === 'dark')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[{value:'light',label:'روشن',icon:Sun},{value:'dark',label:'تیره',icon:Moon}].map(({value,label,icon:Icon}) => <label htmlFor={'theme-'+value} key={value} className="min-w-0 cursor-pointer space-y-3 rounded-lg border border-border p-3 transition-colors hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle"><ThemePreview dark={value === 'dark'}/><span className="flex items-center gap-2 text-label"><Icon className="size-4 text-muted-foreground" aria-hidden="true"/>{label}<span className="ms-auto"><RadioGroupItem id={'theme-'+value} value={value} aria-label={'حالت '+label}/></span></span></label>)}</RadioGroup>
    </section>
    <section aria-labelledby="settings-connection-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-connection-title" icon={Plug} title="اتصال آزمون‌ها" description="روش دریافت پاسخ بر اساس تنظیمات فعلی سرور"/>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-subtle p-4"><div className="min-w-0 space-y-2"><h3 className="m-0 text-label font-normal">{fixture ? 'اجرای آزمایشی' : 'سرویس Nexora'}</h3><p className="text-description text-muted-foreground">{fixture ? 'پاسخ‌های ساختگی برای آزمایش ابزار استفاده می‌شوند.' : 'پرسش‌ها برای دریافت پاسخ و منابع به Nexora ارسال می‌شوند.'}</p></div><span className="rounded-md bg-primary-subtle px-2 py-1 text-caption text-primary-subtle-foreground">روش انتخاب‌شده در سرور</span></div>
      <p className="text-caption text-muted-foreground">{fixture ? 'این حالت برای سنجش کیفیت پاسخ‌های Nexora مناسب نیست.' : 'این اطلاعات روش اتصال را نشان می‌دهد؛ موفقیت ارتباط در زمان اجرای آزمون مشخص می‌شود.'}</p>
      <details className="border-t border-border pt-4 pb-0"><summary className="text-label font-normal">تغییر تنظیمات اتصال</summary><div className="mt-3 space-y-3 text-description text-muted-foreground"><p>روش اتصال، نشانی سرویس و مهلت انتظار در فایل پیکربندی سرور تعیین می‌شوند. پس از تغییر این فایل، سرور را دوباره راه‌اندازی کنید.</p><p>فایل پیکربندی هنگام اجرای سرور با گزینهٔ <bdi dir="ltr">--config</bdi> مشخص می‌شود. ویرایش اتصال و توکن از این صفحه در دسترس نیست.</p></div></details>
    </section>
    <div className="flex items-start gap-2 p-1 text-caption text-muted-foreground"><Info className="mt-1 size-4 shrink-0" aria-hidden="true"/><p>توکن اتصال در این صفحه نمایش داده نمی‌شود.</p></div>
  </div></ControlSizeProvider>;
}
