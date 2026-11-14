import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AppProviders } from './providers/AppProviders';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <AppProviders>
        <App />
        <PWAInstallPrompt />
      </AppProviders>
    </AuthProvider>
  </BrowserRouter>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Sophis Central service worker registration failed:', error);
    });
  });
}
