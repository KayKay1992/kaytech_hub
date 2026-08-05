import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Registers sw.js and keeps it current — `autoUpdate` (set in vite.config.js)
// means a new service worker activates on its own on the next navigation
// rather than needing a manual "update available" prompt, which is more
// than this scope needs.
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
