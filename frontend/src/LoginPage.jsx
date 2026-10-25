import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Languages, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { ControlSizeProvider } from '@/components/ui/control-size';
import './login.css';

export default function LoginPage({onEnter}) {
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [remember,setRemember] = useState(false);
  const [dark,setDark] = useState(() => {try{return localStorage.getItem('nexolab-theme') === 'dark';}catch{return false;}});
  const [language,setLanguage] = useState(() => {try{return localStorage.getItem('nexolab-login-language') === 'en' ? 'en':'fa';}catch{return 'fa';}});
  const english = language === 'en';
  useEffect(() => {document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('nexolab-theme',dark ? 'dark':'light');}catch{/* Browser storage may be unavailable. */}},[dark]);
  useEffect(() => {try{localStorage.setItem('nexolab-login-language',language);}catch{/* Browser storage may be unavailable. */}},[language]);
  const submit = (event) => {event.preventDefault();if(username.trim() && password) onEnter(remember);};
  return <ControlSizeProvider size="default"><div className="dig-surface nexolab-login" dir="ltr" lang={language}>
    <aside className="nexolab-login__visual" aria-label={english ? 'AI response evaluation lab':'آزمایشگاه ارزیابی پاسخ‌های هوش مصنوعی'}/>
    <main className="nexolab-login__main" dir={english ? 'ltr':'rtl'} aria-labelledby="login-title">
      <div className="nexolab-login__toolbar">
        <Button variant="ghost" aria-label={dark ? (english ? 'Enable light mode':'فعال‌کردن حالت روشن') : (english ? 'Enable dark mode':'فعال‌کردن حالت تیره')} onClick={() => setDark(!dark)} className="shadow-none hover:bg-primary-subtle">{dark ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}</Button>
        <Button variant="ghost" aria-label={english ? 'Switch to Persian':'Switch to English'} onClick={() => setLanguage(english ? 'fa':'en')} className="nexolab-login__language shadow-none hover:bg-primary-subtle"><Languages aria-hidden="true"/><span>{english ? 'FA':'EN'}</span></Button>
      </div>
      <div className="nexolab-login__form-wrap">
        <img className="nexolab-login__logo" src={dark ? '/assets/nexolab-login-dark.svg' : '/assets/nexolab-horizontal.svg'} alt="Nexolab"/>
        <header className="nexolab-login__heading"><h1 id="login-title">{english ? 'Welcome':'خوش آمدید'}</h1><p>{english ? 'Enter your account details to continue.':'برای ادامه، اطلاعات حساب خود را وارد کنید.'}</p></header>
        <form onSubmit={submit} className="nexolab-login__form">
          <TextField id="demo-username" className="nexolab-login__field" label={english ? 'Username':'نام کاربری'} placeholder={english ? 'Enter your username':'نام کاربری خود را وارد کنید'} variant="underlined" value={username} onValueChange={setUsername} autoComplete="username" spellCheck={false} dir={english ? 'ltr':'rtl'} required maxLength={120}/>
          <TextField id="demo-password" className="nexolab-login__field" label={english ? 'Password':'رمز عبور'} placeholder={english ? 'Enter your password':'رمز عبور خود را وارد کنید'} variant="underlined" type={showPassword ? 'text':'password'} value={password} onValueChange={setPassword} autoComplete="current-password" dir={english ? 'ltr':'rtl'} required maxLength={120} endContent={<Button type="button" variant="ghost" aria-label={showPassword ? (english ? 'Hide password':'پنهان‌کردن رمز') : (english ? 'Show password':'نمایش رمز')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="px-2 shadow-none hover:bg-primary-subtle">{showPassword ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>}</Button>}/>
          <label htmlFor="demo-remember" className="nexolab-login__remember"><Checkbox id="demo-remember" checked={remember} onCheckedChange={(value) => setRemember(value === true)}/><span>{english ? 'Remember me':'مرا به خاطر بسپار'}</span></label>
          <Button type="submit" className="nexolab-login__submit rounded-full font-normal shadow-none hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100">{english ? 'Sign in':'ورود'}</Button>
        </form>
      </div>
    </main>
  </div></ControlSizeProvider>;
}
