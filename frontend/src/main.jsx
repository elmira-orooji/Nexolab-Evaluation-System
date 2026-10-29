import React from 'react';
import './app/globals.css';
import { createRoot } from 'react-dom/client';
import EntryApp from './EntryApp.jsx';
import './styles.css';
import './sidebar.css';
import './topbar.css';
import './dashboard-simple.css';
import './reference-dashboard.css';
import './i18n.css';
import './dark-theme.css';

createRoot(document.getElementById('root')).render(<EntryApp />);
