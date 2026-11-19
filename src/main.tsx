import './lib/polyfills/map-get-or-insert-computed';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PrivateDmInboxProvider } from './context/PrivateDmInboxContext';
import { AppProviders } from './providers/AppProviders';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <PrivateDmInboxProvider>
        <AppProviders>
        <App />
        <PWAInstallPrompt />
        </AppProviders>
      </PrivateDmInboxProvider>
    </AuthProvider>
  </BrowserRouter>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // A newly activated worker takes control without forcing a second full-page
  // reload. The current document remains usable; the updated shell is used on
  // the next navigation or user-initiated refresh.

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
      };
      checkForUpdate();
      window.addEventListener('focus', checkForUpdate);
      document.addEventListener('visibilitychange', checkForUpdate);
    }).catch((error: unknown) => {
      console.error('Sophis Central service worker registration failed:', error);
    });
  });
}
