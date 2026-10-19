import React from 'react';
import { createRoot } from 'react-dom/client';
import BrandPage from './BrandPage.jsx';
import './styles.css';
import './brand.css';

createRoot(document.getElementById('brand-root')).render(<BrandPage />);
