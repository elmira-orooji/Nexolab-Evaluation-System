import React, {useState} from 'react';
import App from './App.jsx';
import LoginPage from './LoginPage.jsx';

// A demo navigation preference only. This is not authentication or API protection.
export default function EntryApp() {
  const [entered,setEntered] = useState(() => {try{return localStorage.getItem('nexolab-demo-access') === 'true' || sessionStorage.getItem('nexolab-demo-access') === 'true';}catch{return false;}});
  const enter = (remember) => {try{sessionStorage.setItem('nexolab-demo-access','true');if(remember) localStorage.setItem('nexolab-demo-access','true');else localStorage.removeItem('nexolab-demo-access');}catch{/* Demo navigation works without storage. */}setEntered(true);};
  const exit = () => {try{localStorage.removeItem('nexolab-demo-access');sessionStorage.removeItem('nexolab-demo-access');}catch{/* No stored preference to clear. */}setEntered(false);};
  return entered ? <App onExitDemo={exit}/> : <LoginPage onEnter={enter}/>;
}
