import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './themes.css';
import { applyColorPalette, readColorPalette } from './lib/colorPalettes.js';

applyColorPalette(readColorPalette());

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
