import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './css/theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div id="zoom-wrapper">
      <App />      {/* or <Root /> if you renamed */}
    </div>
  </StrictMode>,
);
