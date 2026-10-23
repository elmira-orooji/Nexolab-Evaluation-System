import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { ControlSizeProvider } from '@/components/ui/control-size';
import './login.css';

export default function LoginPage({onEnter}) {
  const [username,setUsername] = useState('demo');
  const [password,setPassword] = useState('nexolab-demo');
  const [showPassword,setShowPassword] = useState(false);
  const [remember,setRemember] = useState(false);
  const [dark,setDark] = useState(() => {try{return localStorage.getItem('nexolab-theme') === 'dark';}catch{return false;}});
  useEffect(() => {document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('nexolab-theme',dark ? 'dark':'light');}catch{/* Browser storage may be unavailable. */}},[dark]);
  const submit = (event) => {event.preventDefault();if(username.trim() && password) onEnter(remember);};
  return <ControlSizeProvider size="default"><div className="dig-surface nexolab-login" dir="ltr">
    <aside className="nexolab-login__visual" aria-label="آزمایشگاه ارزیابی پاسخ‌های هوش مصنوعی"><img className="nexolab-login__hero" src="/assets/nexolab-login-hero.webp" alt="آزمایشگاه دیجیتال با ارلن، شبکهٔ اسناد و پیوندهای ارزیابی پاسخ"/><div className="nexolab-login__visual-caption" dir="rtl"><span className="nexolab-login__eyebrow">NEXOLAB · RAG EVALUATION</span><h2>هر پاسخ، با شواهدش.</h2><p>آزمون، مقایسه و ارزیابی انسانی در یک فضای روشن.</p></div></aside>
    <main className="nexolab-login__main" dir="rtl" aria-labelledby="login-title">
      <div className="nexolab-login__toolbar"><Button variant="ghost" aria-label={dark ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت تیره'} onClick={() => setDark(!dark)} className="shadow-none hover:bg-primary-subtle">{dark ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}</Button></div>
      <div className="nexolab-login__form-wrap">
        <img className="nexolab-login__logo" src={dark ? '/assets/nexolab-login-dark.svg' : '/assets/nexolab-horizontal.svg'} alt="Nexolab"/>
        <header className="nexolab-login__heading"><h1 id="login-title">خوش آمدید</h1><p>برای آشنایی با فضای ارزیابی، وارد نسخهٔ نمایشی شوید.</p></header>
        <form onSubmit={submit} className="nexolab-login__form">
          <TextField id="demo-username" label="نام کاربری نمایشی" variant="underlined" value={username} onValueChange={setUsername} autoComplete="off" spellCheck={false} dir="ltr" required maxLength={120}/>
          <TextField id="demo-password" label="رمز عبور نمایشی" variant="underlined" type={showPassword ? 'text':'password'} value={password} onValueChange={setPassword} autoComplete="off" dir="ltr" required maxLength={120} endContent={<Button type="button" variant="ghost" aria-label={showPassword ? 'پنهان‌کردن رمز' : 'نمایش رمز'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="px-2 shadow-none hover:bg-primary-subtle">{showPassword ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>}</Button>}/>
          <label htmlFor="demo-remember" className="nexolab-login__remember"><Checkbox id="demo-remember" checked={remember} onCheckedChange={(value) => setRemember(value === true)}/><span>ورود نمایشی را در این مرورگر به خاطر بسپار</span></label>
          <Button type="submit" disabled={!username.trim() || !password} className="nexolab-login__submit rounded-full font-normal shadow-none hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100">ورود نمایشی</Button>
          <p className="nexolab-login__notice">اطلاعات نمونه از قبل وارد شده‌اند. از رمز واقعی استفاده نکنید؛ حسابی ساخته نمی‌شود و اطلاعات فرم ذخیره یا ارسال نمی‌شوند.</p>
        </form>
        <footer className="nexolab-login__footer">ارزیابی دقیق‌تر، تصمیم روشن‌تر.</footer>
      </div>
    </main>
  </div></ControlSizeProvider>;
}
