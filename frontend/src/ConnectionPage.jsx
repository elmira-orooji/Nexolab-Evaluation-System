import { useEffect, useState } from 'react';
import { Palette, Sun, Moon, Plug, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ControlSizeProvider } from '@/components/ui/control-size';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TextField } from '@/components/ui/text-field';
import { api } from './api.js';

function Heading({id,icon:Icon,title,description}) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle text-primary-subtle-foreground"><Icon className="size-4" aria-hidden="true"/></span><div className="min-w-0 space-y-1"><h2 id={id} className="m-0 text-body font-normal">{title}</h2><p className="text-caption text-muted-foreground">{description}</p></div></div>;
}

function ThemePreview({dark}) {
  return <div aria-hidden="true" className={'flex h-24 overflow-hidden rounded-md border border-border ' + (dark ? 'bg-inverse' : 'bg-subtle')}><div className={'flex w-1/4 flex-col gap-2 border-e border-border p-3 ' + (dark ? 'bg-inverse-raised' : 'bg-card')}><span className="h-1 rounded bg-primary"/><span className="h-1 rounded bg-placeholder"/><span className="h-1 rounded bg-placeholder"/></div><div className="flex flex-1 flex-col gap-3 p-3"><span className="h-1 w-1/2 rounded bg-placeholder"/><div className="grid flex-1 grid-cols-2 gap-2"><span className={'rounded border border-border ' + (dark ? 'bg-inverse-raised' : 'bg-card')}/><span className={'rounded border border-border ' + (dark ? 'bg-inverse-raised' : 'bg-card')}/></div><span className="h-1 w-3/4 rounded bg-placeholder"/></div></div>;
}

export default function ConnectionPage({adapter,dark,onThemeChange,onAdapterChange}) {
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
      setConnectionMessage('اتصال ذخیره شد و برای اجراهای بعدی استفاده می‌شود.');
    } catch (error) { setConnectionError(error.message); }
    finally { setSavingConnection(false); }
  };
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem('nexolab-login-language') === 'en' ? 'en' : 'fa'; } catch { return 'fa'; } });
  const chooseLanguage = (value) => { setLanguage(value); try { localStorage.setItem('nexolab-login-language', value); } catch { /* Browser storage may be unavailable. */ } };
  const fixture = adapter === 'fixture';
  return <ControlSizeProvider size="default"><div className="dig-surface mx-auto w-full max-w-3xl space-y-4 text-foreground">
    <header className="mb-6 space-y-2"><h1 className="text-subheading font-normal">اتصال و تنظیمات</h1><p className="text-description text-muted-foreground">ظاهر محیط را انتخاب کنید و روش اجرای آزمون‌ها را ببینید.</p></header>
    <section aria-labelledby="settings-appearance-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-appearance-title" icon={Palette} title="ظاهر محیط" description="تغییرها بلافاصله اعمال و در همین مرورگر ذخیره می‌شوند."/>
      <RadioGroup aria-labelledby="settings-appearance-title" name="settings-theme" value={dark ? 'dark' : 'light'} onValueChange={(value) => onThemeChange(value === 'dark')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[{value:'light',label:'روشن',icon:Sun},{value:'dark',label:'تیره',icon:Moon}].map(({value,label,icon:Icon}) => <label htmlFor={'theme-'+value} key={value} className="min-w-0 cursor-pointer space-y-3 rounded-lg border border-border p-3 transition-colors hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle"><ThemePreview dark={value === 'dark'}/><span className="flex items-center gap-2 text-label"><Icon className="size-4 text-muted-foreground" aria-hidden="true"/>{label}<span className="ms-auto"><RadioGroupItem id={'theme-'+value} value={value} aria-label={'حالت '+label}/></span></span></label>)}</RadioGroup>
    </section>
    <section aria-labelledby="settings-language-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-language-title" icon={Languages} title="زبان" description="زبان مورد استفاده در صفحهٔ ورود را انتخاب کنید."/>
      <div className="flex flex-wrap gap-3" role="group" aria-label="انتخاب زبان صفحهٔ ورود">
        <Button type="button" variant={language === 'fa' ? 'default' : 'outline'} aria-pressed={language === 'fa'} onClick={() => chooseLanguage('fa')} className="font-normal">فارسی</Button>
        <Button type="button" variant={language === 'en' ? 'default' : 'outline'} aria-pressed={language === 'en'} onClick={() => chooseLanguage('en')} className="font-normal">English</Button>
      </div>
    </section>
    <section aria-labelledby="settings-rag-api-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-rag-api-title" icon={Plug} title="اتصال API سامانهٔ RAG" description="نشانی سرویس و کلید API سامانه‌ای را وارد کنید که پاسخ‌ها و منابع را برمی‌گرداند."/>
      <form className="space-y-4" onSubmit={saveConnection}>
        <TextField id="rag-api-url" label="نشانی پایهٔ API" description="برای نمونه: https://rag.example.com . مسیر /api/v1/rag/answer به نشانی افزوده می‌شود." value={baseUrl} onValueChange={setBaseUrl} dir="ltr" autoComplete="url" placeholder="https://"/>
        <TextField id="rag-api-token" label="کلید API" description={connection.token_configured ? 'کلید قبلی ثبت شده است؛ برای جایگزینی، کلید جدید را وارد کنید. خالی گذاشتن، کلید فعلی را نگه می‌دارد.' : 'کلید فقط در حافظهٔ سرور تا زمان خاموش‌شدن آن نگه‌داری می‌شود.'} type="password" value={apiToken} onValueChange={setApiToken} dir="ltr" autoComplete="new-password" placeholder={connection.token_configured ? 'کلید API ثبت شده' : 'Bearer token'}/>
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" loading={savingConnection} disabled={savingConnection || !baseUrl.trim()}>ذخیرهٔ اتصال</Button><span className="text-caption text-muted-foreground">{connection.token_configured ? 'کلید ثبت شده است' : 'کلیدی ثبت نشده است'}</span></div>
        {connectionMessage && <p role="status" className="m-0 text-caption text-muted-foreground">{connectionMessage}</p>}
        {connectionError && <p role="alert" className="m-0 text-caption text-destructive">{connectionError}</p>}
      </form>

    </section>    <section aria-labelledby="settings-connection-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Heading id="settings-connection-title" icon={Plug} title="اتصال آزمون‌ها" description="روش دریافت پاسخ بر اساس تنظیمات فعلی سرور"/>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-subtle p-4"><div className="min-w-0 space-y-2"><h3 className="m-0 text-label font-normal">{fixture ? 'اجرای آزمایشی' : 'سرویس Nexora'}</h3><p className="text-description text-muted-foreground">{fixture ? 'پاسخ‌های ساختگی برای آزمایش ابزار استفاده می‌شوند.' : 'پرسش‌ها برای دریافت پاسخ و منابع به Nexora ارسال می‌شوند.'}</p></div><span className="rounded-md bg-primary-subtle px-2 py-1 text-caption text-primary-subtle-foreground">روش انتخاب‌شده در سرور</span></div>
      <p className="text-caption text-muted-foreground">{fixture ? 'این حالت برای سنجش کیفیت پاسخ‌های Nexora مناسب نیست.' : 'این اطلاعات روش اتصال را نشان می‌دهد؛ موفقیت ارتباط در زمان اجرای آزمون مشخص می‌شود.'}</p>
    </section>
    <div className="flex items-start gap-2 p-1 text-caption text-muted-foreground"><Info className="mt-1 size-4 shrink-0" aria-hidden="true"/><p>توکن اتصال در این صفحه نمایش داده نمی‌شود.</p></div>
  </div></ControlSizeProvider>;
}


