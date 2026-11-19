import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'sophis-central-cookie-consent';
const CONSENT_VERSION = 3;

export type CookieConsent = {
  version: number;
  essential: true;
  updatedAt: string;
  choice: 'acknowledged';
};

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION || parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsent | null {
  return readConsent();
}

export function saveCookieConsent(): CookieConsent {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    essential: true,
    updatedAt: new Date().toISOString(),
    choice: 'acknowledged',
  };

  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // The notice remains dismissible for this page view if browser storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent('sophis-cookie-consent-updated', { detail: consent }));
  return consent;
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readConsent());

  useEffect(() => {
    const refresh = () => setConsent(readConsent());
    window.addEventListener('sophis-cookie-consent-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('sophis-cookie-consent-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (consent) {
    return (
      <Link
        to="/cookie-settings"
        aria-label="Manage cookie preferences"
        className="fixed bottom-3 right-3 z-[90] rounded-full border border-[#DCE4EF] bg-white px-4 py-2.5 text-xs font-semibold text-[#6121D0] shadow-lg transition hover:bg-[#F8F7FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6121D0] sm:bottom-5 sm:right-5"
      >
        Cookie preferences
      </Link>
    );
  }

  return (
    <section
      aria-label="Cookie information"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-[#DCE4EF] bg-white p-4 text-[#243047] shadow-[0_18px_60px_rgba(9,31,91,0.22)] sm:inset-x-5 sm:bottom-5 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#091F5B]">Essential cookies and browser storage</h2>
          <p id="cookie-consent-description" className="mt-1 max-w-2xl text-sm leading-6 text-[#52627B]">
            Sophis Central uses essential cookies and browser storage to support secure access and core platform functions. Optional third-party analytics and advertising cookies are not currently enabled. Read our <Link to="/cookie-policy" className="font-semibold text-[#6121D0] underline">Cookie Policy</Link> and <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
          <button type="button" onClick={() => saveCookieConsent()} className="rounded-xl bg-[#6121D0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4C1D95]">Continue</button>
        </div>
      </div>
    </section>
  );
}

export function CookieSettingsPage() {
  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" aria-label="Sophis Central home"><span className="text-lg font-bold text-[#091F5B]">Sophis Central</span></Link>
          <Link to="/cookie-policy" className="text-sm font-semibold text-[#6121D0] hover:underline">Read Cookie Policy</Link>
        </header>
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6121D0]">Privacy controls</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#091F5B]">Cookie Settings</h1>
          <p className="mt-3 text-sm leading-7 text-[#52627B]">
            Sophis Central currently uses essential cookies and browser storage to support secure access, account sessions and core platform functions. These technologies cannot be disabled here because they are required for the service to work.
          </p>
          <div className="mt-7 rounded-xl border border-[#E5EAF2] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-[#091F5B]">Essential cookies and browser storage</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">Used for secure access, session continuity and essential platform functions.</p>
                <p className="mt-2 text-xs font-semibold text-[#64748B]">Always active</p>
              </div>
              <input aria-label="Essential cookies and browser storage are always active" type="checkbox" checked disabled className="mt-1 h-5 w-5 accent-[#6121D0]" />
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#52627B]">
            Optional third-party analytics and advertising cookies are not currently enabled. If optional categories are introduced, this page will be updated and your choice will be requested where required.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="text-center text-sm font-semibold text-[#64748B] hover:text-[#091F5B]">Back to Sophis Central</Link>
            <Link to="/cookie-policy" className="rounded-xl bg-[#6121D0] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#4C1D95]">View Cookie Policy</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
