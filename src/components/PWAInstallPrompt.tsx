import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSAL_KEY = 'sophis-central-pwa-install-dismissed-at';
const DISMISSAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSAL_KEY));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISSAL_PERIOD_MS;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
  } catch {
    // The install prompt remains dismissible for the current session if storage is unavailable.
  }
}

function clearDismissal() {
  try {
    window.localStorage.removeItem(DISMISSAL_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    const ios = isIosDevice();
    setIosInstructions(ios);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      clearDismissal();
      setVisible(false);
      setInstallEvent(null);
    };

    if (ios) setVisible(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'dismissed') rememberDismissal();
    } catch (error) {
      console.error('Sophis Central installation prompt failed:', error);
    } finally {
      setInstallEvent(null);
      setVisible(false);
    }
  };

  const dismiss = () => {
    rememberDismissal();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Install Sophis Central"
      aria-live="polite"
      className="fixed inset-x-3 z-[70] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-[0_12px_40px_rgba(9,31,91,0.18)]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F6FC] p-1.5">
        <img src="/sophis-central-pwa-icon.svg" alt="" className="h-full w-full object-contain object-center" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#091F5B]">Use Sophis Central like an app</p>
        <p className="text-xs leading-5 text-[#4B5563]">
          {iosInstructions ? 'Tap Share in Safari, then choose “Add to Home Screen”.' : 'Install it on your device for a faster, app-like experience.'}
        </p>
      </div>
      {installEvent && (
        <button type="button" onClick={() => void install()} className="shrink-0 rounded-xl bg-[#6121D0] px-3 py-2 text-xs font-semibold text-white">
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Dismiss install message" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-[#F3F6FC]">
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
