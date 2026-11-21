import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'sophis-central-cookie-consent';
const CONSENT_VERSION = 4;

export type CookieConsent = {
  version: number;
  essential: true;
  updatedAt: string;
  noticeAction: 'acknowledged' | 'dismissed';
};

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (
      parsed.version !== CONSENT_VERSION ||
      parsed.essential !== true ||
      !['acknowledged', 'dismissed'].includes(String(parsed.noticeAction))
    ) return null;
    return parsed as CookieConsent;
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsent | null {
  return readConsent();
}

/**
 * Records only the visitor's handling of the informational notice.
 * It is not consent to analytics, advertising, profiling, or other optional
 * tracking. Those categories are not enabled by this implementation.
 */
export function saveCookieNoticeAction(
  noticeAction: CookieConsent['noticeAction'] = 'acknowledged',
): CookieConsent {
  const record: CookieConsent = {
    version: CONSENT_VERSION,
    essential: true,
    updatedAt: new Date().toISOString(),
    noticeAction,
  };

  try {
    // Persist synchronously before updating the UI or navigating/authenticating.
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    const persisted = window.localStorage.getItem(CONSENT_KEY);
    if (persisted !== JSON.stringify(record)) {
      throw new Error('Cookie notice preference could not be verified');
    }
  } catch {
    // Storage may be disabled or full. The action still dismisses the notice
    // for this page view, but it cannot be guaranteed across navigation/reloads.
  }

  window.dispatchEvent(new CustomEvent('sophis-cookie-consent-updated', { detail: record }));
  return record;
}

/** Backwards-compatible export for any existing callers. */
export function saveCookieConsent(): CookieConsent {
  return saveCookieNoticeAction('acknowledged');
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readConsent());

  useEffect(() => {
    const refresh = () => setConsent(readConsent());
    window.addEventListener('sophis-cookie-consent-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('sophis-cookie-consent-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  const handleNoticeAction = (action: CookieConsent['noticeAction']) => {
    const saved = saveCookieNoticeAction(action);
    // Update this mounted component immediately; do not rely solely on a
    // storage event (which does not fire in the same tab).
    setConsent(saved);
  };

  if (consent) return null;

  return (
    <aside
      aria-label="Privacy and cookie notice"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-[#DCE4EF] bg-white p-4 text-[#243047] shadow-[0_18px_60px_rgba(9,31,91,0.22)] sm:inset-x-5 sm:top-5 sm:p-5"
      role="region"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#091F5B]">Privacy and essential cookie notice</h2>
          <p id="cookie-consent-description" className="mt-1 max-w-2xl text-sm leading-6 text-[#52627B]">
            Sophis Central uses essential cookies and browser storage for secure access, session continuity and core platform functions. Optional analytics, advertising and marketing tracking are not currently enabled. Your choice here records only that you have acknowledged or dismissed this notice; it is not consent to optional tracking. Read our{' '}
            <Link to="/cookie-policy" className="font-semibold text-[#6121D0] underline">Cookie Policy</Link> and{' '}
            <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[240px] sm:justify-end">
          <button
            type="button"
            onClick={() => handleNoticeAction('dismissed')}
            className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FAFC]"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => handleNoticeAction('acknowledged')}
            className="rounded-xl bg-[#6121D0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4C1D95]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </aside>
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6121D0]">Privacy information</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#091F5B]">Cookie Settings</h1>
          <p className="mt-3 text-sm leading-7 text-[#52627B]">
            Sophis Central currently uses essential cookies and browser storage to support secure access, account sessions and core platform functions. These technologies cannot be disabled here because they are required for the service to work.
          </p>
          <div className="mt-7 rounded-xl border border-[#E5EAF2] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-[#091F5B]">Essential cookies and browser storage</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">Used for secure access, session continuity, security and essential platform functions.</p>
                <p className="mt-2 text-xs font-semibold text-[#64748B]">Always active</p>
              </div>
              <input aria-label="Essential cookies and browser storage are always active" type="checkbox" checked disabled className="mt-1 h-5 w-5 accent-[#6121D0]" />
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#52627B]">
            Optional analytics, advertising and marketing tracking are not currently enabled. The notice acknowledgement or dismissal is stored only to remember that you have seen the notice; it does not activate optional tracking or represent consent to it.
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
