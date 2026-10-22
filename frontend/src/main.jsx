import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './sidebar.css';
import './topbar.css';
import './dashboard-simple.css';

createRoot(document.getElementById('root')).render(<App />);
