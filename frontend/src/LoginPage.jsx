import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const submit = (event) => {event.preventDefault();if(username.trim() && password) onEnter(remember);};
  return <ControlSizeProvider size="default"><div className="dig-surface nexolab-login" dir="ltr">
    <aside className="nexolab-login__visual" aria-label="آزمایشگاه ارزیابی پاسخ‌های هوش مصنوعی"/>
    <main className="nexolab-login__main" dir="rtl" aria-labelledby="login-title">
      <div className="nexolab-login__form-wrap">
        <header className="nexolab-login__heading"><h1 id="login-title">خوش آمدید</h1><p>برای ادامه، اطلاعات حساب خود را وارد کنید.</p></header>
        <form onSubmit={submit} className="nexolab-login__form">
          <TextField id="demo-username" className="nexolab-login__field" label="نام کاربری" placeholder="نام کاربری خود را وارد کنید" variant="underlined" value={username} onValueChange={setUsername} autoComplete="username" spellCheck={false} dir="rtl" required maxLength={120}/>
          <TextField id="demo-password" className="nexolab-login__field" label="رمز عبور" placeholder="رمز عبور خود را وارد کنید" variant="underlined" type={showPassword ? 'text':'password'} value={password} onValueChange={setPassword} autoComplete="current-password" dir="rtl" required maxLength={120} endContent={<Button type="button" variant="ghost" aria-label={showPassword ? 'پنهان‌کردن رمز' : 'نمایش رمز'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="px-2 shadow-none hover:bg-primary-subtle">{showPassword ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>}</Button>}/>
          <label htmlFor="demo-remember" className="nexolab-login__remember"><Checkbox id="demo-remember" checked={remember} onCheckedChange={(value) => setRemember(value === true)}/><span>مرا به خاطر بسپار</span></label>
          <Button type="submit" className="nexolab-login__submit rounded-full font-normal shadow-none hover:bg-(--brand-700) dark:hover:bg-(--brand-300) hover:brightness-100 dark:hover:brightness-100">ورود</Button>
        </form>
      </div>
    </main>
  </div></ControlSizeProvider>;
}
