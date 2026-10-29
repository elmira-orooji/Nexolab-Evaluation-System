import {t} from './i18n.js';
import React from 'react';
import { Plus, PanelRightClose, PanelRightOpen, Sun, LayoutDashboard, CheckCheck, Clock3, Menu, X, Play, Info, Search, Download, Bell, LibraryBig, GitCompareArrows, Settings2, BookOpen, LogOut, ChartNoAxesCombined } from 'lucide-react';

// Lucide is available in the 21st.dev icon catalog; distributed under the ISC license.
const icons = { plus: Plus, sidebar: PanelRightClose, sidebarOpen: PanelRightOpen, theme: Sun, dashboard: LayoutDashboard, review: CheckCheck, clock: Clock3, menu: Menu, close: X, play: Play, info: Info, search: Search, download: Download, bell: Bell, suites: LibraryBig, compare: GitCompareArrows, settings: Settings2, guide: BookOpen, logout: LogOut, analysis: ChartNoAxesCombined };

export function Icon({ name, className = 'ui-icon', ...props }) {
  const Component = icons[name] || Info;
  return <Component className={className} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
export function Modal({ open, onClose, title, subtitle, icon = 'info', children, footer, className = '' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`nexora-dialog react-dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="dialog-header"><span className="dialog-icon"><Icon name={icon} /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button dialog-close" onClick={onClose} aria-label={t("بستن پنجره")}><Icon name="close" /></button></header>
      <div className="dialog-content">{children}</div>{footer && <footer className="dialog-footer">{footer}</footer>}
    </section>
  </div>;
}

export function StatusToast({ message, onClose }) {
  if (!message) return null;
  return <div className="react-toast" role="status" aria-live="polite"><span>{message}</span><button className="icon-button" onClick={onClose} aria-label={t("بستن پیام")}><Icon name="close" /></button></div>;
}

export function Empty({ children }) { return <p className="empty-runs">{children}</p>; }

export function SourceCard({ title, children }) {
  return <details className="source"><summary>{title}</summary><p>{children}</p></details>;
}

