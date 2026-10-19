import React from 'react';

const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  sidebar: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M9 4v16m7-11-3 3 3 3" /></>,
  sidebarOpen: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M9 4v16m4-11 3 3-3 3" /></>,
  theme: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  review: <path d="m5 12.5 4.2 4.2L19 7" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  play: <path d="m9 6 10 6-10 6z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3" />,
  bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 20h4" />,
};

export function Icon({ name, className = 'ui-icon', ...props }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.info}</svg>;
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
      <header className="dialog-header"><span className="dialog-icon"><Icon name={icon} /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button dialog-close" onClick={onClose} aria-label="بستن پنجره"><Icon name="close" /></button></header>
      <div className="dialog-content">{children}</div>{footer && <footer className="dialog-footer">{footer}</footer>}
    </section>
  </div>;
}

export function StatusToast({ message, onClose }) {
  if (!message) return null;
  return <div className="react-toast" role="status" aria-live="polite"><span>{message}</span><button className="icon-button" onClick={onClose} aria-label="بستن پیام"><Icon name="close" /></button></div>;
}

export function Empty({ children }) { return <p className="empty-runs">{children}</p>; }

export function SourceCard({ title, children }) {
  return <details className="source"><summary>{title}</summary><p>{children}</p></details>;
}
