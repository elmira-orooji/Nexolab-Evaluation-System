import {useSyncExternalStore} from 'react';
import en from './locales/en.js';

const storageKey = 'nexolab-login-language';
let language = 'fa';
try { language = localStorage.getItem(storageKey) === 'en' ? 'en' : 'fa'; } catch { /* Storage is optional. */ }
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getLanguage = () => language;
export const locale = () => language === 'en' ? 'en-US' : 'fa-IR';
export const direction = () => language === 'en' ? 'ltr' : 'rtl';

function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = direction();
}
export function setLanguage(value) {
  const next = value === 'en' ? 'en' : 'fa';
  if (language === next) return;
  language = next;
  try { localStorage.setItem(storageKey, language); } catch { /* Storage is optional. */ }
  applyLanguage();
  listeners.forEach((listener) => listener());
}
export function useLanguage() {
  return [useSyncExternalStore(subscribe, getLanguage, () => 'fa'), setLanguage];
}
// Templates interpolate data without translating the data itself.
export function t(key, values = []) {
  const original = String(key);
  const trimmed = original.trim();
  const translation = language === 'en' ? en[original] ?? (en[trimmed] ? original.replace(trimmed, en[trimmed]) : original) : original;
  return translation.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match);
}
applyLanguage();
window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    let next = 'fa';
    try { next = localStorage.getItem(storageKey) === 'en' ? 'en' : 'fa'; } catch { /* Storage is optional. */ }
    if (next !== language) { language = next; applyLanguage(); listeners.forEach((listener) => listener()); }
  }
});
