import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import '@fontsource/roboto/latin-300.css'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/material-symbols-outlined/latin-400.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Register Service Worker for offline support (production only)
const isProduction = import.meta.env.PROD;

if ('serviceWorker' in navigator && isProduction) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration.scope);

        // Handle updates - when new SW is available
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, refresh for updates
                  console.log('[App] New content available, refresh to update');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.log('[App] Service Worker registration failed:', error);
      });
  });

  // Listen for messages from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_COMPLETE') {
      console.log(`[App] Offline caching complete! ${event.data.cached} slides cached.`);
    }
  });
}

