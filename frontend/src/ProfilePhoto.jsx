import {useRef, useState} from 'react';
import {Camera} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {api} from './api.js';
import {t} from './i18n.js';
import {preparePhoto} from './profile-photo.js';

export default function ProfilePhoto({avatarUrl, onChange}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const update = async (file) => {
    if (busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      if (file) await api('/api/profile/avatar', {method:'PUT', body:{image:await preparePhoto(file)}});
      else await api('/api/profile/avatar', {method:'DELETE'});
      onChange?.(file ? '/api/profile/avatar?v='+Date.now() : '');
      setMessage(file ? 'عکس کاربری ذخیره شد.' : 'عکس کاربری حذف شد.');
    } catch (reason) { setError(reason.message || 'ذخیرهٔ عکس انجام نشد. دوباره تلاش کنید.'); }
    finally { setBusy(false); if (input.current) input.current.value=''; }
  };
  return <section aria-labelledby="settings-photo-title" className="space-y-5 rounded-xl border border-border bg-card p-5">
    <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle text-primary-subtle-foreground"><Camera size={16} aria-hidden="true"/></span><div className="space-y-1"><h2 id="settings-photo-title" className="m-0 text-body font-normal">{t('عکس کاربری')}</h2><p className="text-caption text-muted-foreground">{t('این تصویر در پروفایل هدبار نمایش داده می‌شود.')}</p></div></div>
    <div className="flex flex-wrap items-center gap-4"><span className="profile-photo-preview">{avatarUrl ? <img src={avatarUrl} alt={t('عکس کاربری')}/> : <Camera size={24} aria-hidden="true"/>}</span><div className="space-y-2"><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy} onClick={()=>input.current?.click()} className="font-normal">{busy ? t('در حال ذخیره…') : t('انتخاب عکس')}</Button>{avatarUrl && <Button type="button" variant="ghost" disabled={busy} onClick={()=>update(null)} className="font-normal">{t('حذف عکس')}</Button>}</div><p className="text-caption text-muted-foreground">{t('PNG، JPG یا WebP؛ حداکثر ۵ مگابایت. تصویر از مرکز به شکل مربع برش می‌خورد.')}</p></div></div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-label={t('انتخاب عکس')} disabled={busy} onChange={event=>{const file=event.target.files?.[0]; if(file) void update(file);}}/>
    {message && <p role="status" className="text-caption text-muted-foreground">{t(message)}</p>}{error && <p role="alert" className="text-caption text-destructive">{t(error)}</p>}
  </section>;
}
