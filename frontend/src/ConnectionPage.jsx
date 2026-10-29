import {t, useLanguage} from './i18n.js';
import { useEffect, useState } from 'react';
import { Palette, Sun, Moon, Plug, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TextField } from '@/components/ui/text-field';
import { api } from './api.js';
import ProfilePhoto from './ProfilePhoto.jsx';

function Heading({id,icon:Icon,title,description}) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle text-primary-subtle-foreground"><Icon className="size-4" aria-hidden="true"/></span><div className="min-w-0 space-y-1"><h2 id={id} className="m-0 text-body font-normal">{title}</h2><p className="text-caption text-muted-foreground">{description}</p></div></div>;
}

function ThemePreview({dark}) {
  return <div aria-hidden="true" className="theme-preview" data-preview={dark ? 'dark' : 'light'}><div className="theme-preview__sidebar"><i/><i/><i/></div><div className="theme-preview__body"><i/><div className="theme-preview__cards"><i/><i/></div><i/></div></div>;
}
export default function ConnectionPage({adapter,dark,onThemeChange,onAdapterChange,avatarUrl,onAvatarChange}) {
  const [connection, setConnection] = useState({ adapter, base_url: '', token_configured: false });
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [savingConnection, setSavingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectionError, setConnectionError] = useState('');
  useEffect(() => {
    let active = true;
    api('/api/connection').then((value) => {
      if (!active) return;
      setConnection(value);
      setBaseUrl(value.base_url || '');
      onAdapterChange?.(value.adapter);
    }).catch((error) => { if (active) setConnectionError(error.message); });
    return () => { active = false; };
  }, [onAdapterChange]);
  const saveConnection = async (event) => {
    event.preventDefault();
    if (savingConnection) return;
    setSavingConnection(true); setConnectionError(''); setConnectionMessage('');
    try {
      const value = await api('/api/connection', { method: 'PUT', body: { adapter: 'nexora', base_url: baseUrl.trim(), api_token: apiToken } });
      setConnection(value); setApiToken(''); onAdapterChange?.(value.adapter);
      setConnectionMessage(t("اتصال ذخیره شد و برای اجراهای بعدی استفاده می‌شود."));
    } catch (error) { setConnectionError(error.message); }
    finally { setSavingConnection(false); }
  };
  const [language, chooseLanguage] = useLanguage();
  const fixture = adapter === 'fixture';
  return <ControlSizeProvider size="default"><div className="dig-surface mx-auto w-full max-w-3xl space-y-4 text-foreground">
    <header className="mb-6 space-y-2"><h1 className="text-subheading font-normal">{t("اتصال و تنظیمات")}</h1><p className="text-description text-muted-foreground">{t("ظاهر محیط را انتخاب کنید و روش اجرای آزمون‌ها را ببینید.")}</p></header>
    <ProfilePhoto avatarUrl={avatarUrl} onChange={onAvatarChange}/>
    <section aria-labelledby="settings-appearance-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-appearance-title" icon={Palette} title={t("ظاهر محیط")} description={t("تغییرها بلافاصله اعمال و در همین مرورگر ذخیره می‌شوند.")}/>
      <RadioGroup aria-labelledby="settings-appearance-title" name="settings-theme" value={dark ? 'dark' : 'light'} onValueChange={(value) => onThemeChange(value === 'dark')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[{value:'light',label:t("روشن"),icon:Sun},{value:'dark',label:t("تیره"),icon:Moon}].map(({value,label,icon:Icon}) => <label htmlFor={'theme-'+value} key={value} className="min-w-0 cursor-pointer space-y-3 rounded-lg border border-border p-3 transition-colors hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle"><ThemePreview dark={value === 'dark'}/><span className="flex items-center gap-2 text-label"><Icon className="size-4 text-muted-foreground" aria-hidden="true"/>{label}<span className="ms-auto"><RadioGroupItem id={'theme-'+value} value={value} aria-label={t("حالت ")+label}/></span></span></label>)}</RadioGroup>
    </section>
    <section aria-labelledby="settings-language-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-language-title" icon={Languages} title={t("زبان")} description={t("زبان برنامه و صفحهٔ ورود را انتخاب کنید.")}/>
      <div className="flex flex-wrap gap-3" role="group" aria-label={t("انتخاب زبان برنامه")}>
        <Button type="button" variant={language === 'fa' ? 'default' : 'outline'} aria-pressed={language === 'fa'} onClick={() => chooseLanguage('fa')} className="font-normal">{t("فارسی")}</Button>
        <Button type="button" variant={language === 'en' ? 'default' : 'outline'} aria-pressed={language === 'en'} onClick={() => chooseLanguage('en')} className="font-normal">English</Button>
      </div>
    </section>
    <section aria-labelledby="settings-rag-api-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-rag-api-title" icon={Plug} title={t("اتصال API سامانهٔ RAG")} description={t("نشانی سرویس و کلید API سامانه‌ای را وارد کنید که پاسخ‌ها و منابع را برمی‌گرداند.")}/>
      <form className="space-y-4" onSubmit={saveConnection}>
        <TextField id="rag-api-url" label={t("نشانی پایهٔ API")} description={t("برای نمونه: https://rag.example.com . مسیر /api/v1/rag/answer به نشانی افزوده می‌شود.")} value={baseUrl} onValueChange={setBaseUrl} dir="ltr" autoComplete="url" placeholder="https://"/>
        <TextField id="rag-api-token" label={t("کلید API")} description={connection.token_configured ? t("کلید قبلی ثبت شده است؛ برای جایگزینی، کلید جدید را وارد کنید. خالی گذاشتن، کلید فعلی را نگه می‌دارد.") : t("کلید فقط در حافظهٔ سرور تا زمان خاموش‌شدن آن نگه‌داری می‌شود.")} type="password" value={apiToken} onValueChange={setApiToken} dir="ltr" autoComplete="new-password" placeholder={connection.token_configured ? t("کلید API ثبت شده") : 'Bearer token'}/>
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" loading={savingConnection} disabled={savingConnection || !baseUrl.trim()}>{t("ذخیرهٔ اتصال")}</Button><span className="text-caption text-muted-foreground">{connection.token_configured ? t("کلید ثبت شده است") : t("کلیدی ثبت نشده است")}</span></div>
        {connectionMessage && <p role="status" className="m-0 text-caption text-muted-foreground">{connectionMessage}</p>}
        {connectionError && <p role="alert" className="m-0 text-caption text-destructive">{connectionError}</p>}
      </form>

    </section>    <section aria-labelledby="settings-connection-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-connection-title" icon={Plug} title={t("اتصال آزمون‌ها")} description={t("روش دریافت پاسخ بر اساس تنظیمات فعلی سرور")}/>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-subtle p-4"><div className="min-w-0 space-y-2"><h3 className="m-0 text-label font-normal">{fixture ? t("اجرای آزمایشی") : t("سرویس Nexora")}</h3><p className="text-description text-muted-foreground">{fixture ? t("پاسخ‌های ساختگی برای آزمایش ابزار استفاده می‌شوند.") : t("پرسش‌ها برای دریافت پاسخ و منابع به Nexora ارسال می‌شوند.")}</p></div><span className="rounded-md bg-primary-subtle px-2 py-1 text-caption text-primary-subtle-foreground">{t("روش انتخاب‌شده در سرور")}</span></div>
      <p className="text-caption text-muted-foreground">{fixture ? t("این حالت برای سنجش کیفیت پاسخ‌های Nexora مناسب نیست.") : t("این اطلاعات روش اتصال را نشان می‌دهد؛ موفقیت ارتباط در زمان اجرای آزمون مشخص می‌شود.")}</p>
    </section>
    <div className="flex w-full items-center justify-center gap-2 p-1 text-center text-caption text-muted-foreground"><Info className="size-4 shrink-0" aria-hidden="true"/><p className="m-0">{t("توکن اتصال در این صفحه نمایش داده نمی‌شود.")}</p></div>
  </div></ControlSizeProvider>;
}


