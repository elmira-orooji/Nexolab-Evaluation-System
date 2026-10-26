import React, {useEffect, useState} from 'react';
import App from './App.jsx';
import LoginPage from './LoginPage.jsx';
import {api} from './api.js';

export default function EntryApp() {
  const [user,setUser] = useState(null);
  const [checking,setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const expire = () => { if (active) setUser(null); };
    window.addEventListener('nexolab:auth-expired', expire);
    api('/api/auth/session')
      .then((session) => { if (active && session.authenticated) setUser(session.user); })
      .catch(() => {})
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; window.removeEventListener('nexolab:auth-expired', expire); };
  }, []);

  const enter = async (username, password, remember) => {
    const session = await api('/api/auth/login', {
      method: 'POST', body: { username, password, remember },
    });
    setUser(session.user);
  };
  const exit = async () => {
    try { await api('/api/auth/logout', { method: 'POST', body: {} }); }
    finally { setUser(null); }
  };

  if (checking) return <div className="dig-surface" role="status" style={{display:'grid',minHeight:'100dvh',placeItems:'center',color:'var(--muted-foreground)'}}>در حال بررسی نشست…</div>;
  return user ? <App onLogout={exit}/> : <LoginPage onEnter={enter}/>;
}
