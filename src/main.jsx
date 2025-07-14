// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   // ← NEW
import App from './App.jsx';

import './index.css';
import './css/theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/">   {/* basename optional here */}
      <App />
    </BrowserRouter>
  </StrictMode>
);
