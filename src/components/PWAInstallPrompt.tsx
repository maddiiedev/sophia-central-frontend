import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const ios = isIosDevice();
    setIosInstructions(ios);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const onAppInstalled = () => {
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
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Install Sophis Central"
      className="fixed inset-x-3 z-[70] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-[0_12px_40px_rgba(9,31,91,0.18)]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <img src="/sophis-central-favicon.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
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
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss install message" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-[#F3F6FC]">
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
