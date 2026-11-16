import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'sophis-central-cookie-consent';
const CONSENT_VERSION = 2;

export type CookieConsent = {
  version: number;
  essential: true;
  engagement: boolean;
  analytics: boolean;
  conversion: boolean;
  updatedAt: string;
  choice: 'accepted-all' | 'rejected-optional' | 'custom';
};

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION || parsed.essential !== true) return null;
    return {
      ...parsed,
      engagement: parsed.engagement === true,
      analytics: parsed.analytics === true,
      conversion: parsed.conversion === true,
    };
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsent | null {
  return readConsent();
}

/** Optional integrations must check the relevant choice before loading or storing anything. */
export function hasOptionalCookieConsent(category: 'engagement' | 'analytics' | 'conversion'): boolean {
  return readConsent()?.[category] === true;
}

export function saveCookieConsent(
  engagement: boolean,
  analytics: boolean,
  conversion: boolean,
  choice: CookieConsent['choice'],
): CookieConsent {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    essential: true,
    engagement,
    analytics,
    conversion,
    updatedAt: new Date().toISOString(),
    choice,
  };

  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // The choice remains active for this page view if browser storage is unavailable.
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

  if (consent) return null;

  return (
    <section
      aria-label="Cookie preferences"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-[#DCE4EF] bg-white p-4 text-[#243047] shadow-[0_18px_60px_rgba(9,31,91,0.22)] sm:inset-x-5 sm:bottom-5 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#091F5B]">Your privacy matters</h2>
          <p id="cookie-consent-description" className="mt-1 max-w-2xl text-sm leading-6 text-[#52627B]">
            We use essential cookies to keep Sophis Central secure and working. With your permission, we also use optional technologies to improve your experience and understand platform usage. <Link to="/cookie-policy" className="font-semibold text-[#6121D0] underline">Cookie Policy</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => saveCookieConsent(false, false, false, 'rejected-optional')} className="rounded-xl border border-[#CBD5E1] px-3.5 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FAFC]">Reject Optional</button>
          <Link to="/cookie-settings" className="rounded-xl border border-[#C4B5FD] px-3.5 py-2.5 text-sm font-semibold text-[#5B21B6] transition hover:bg-[#F5F3FF]">Manage Preferences</Link>
          <button type="button" onClick={() => saveCookieConsent(true, true, true, 'accepted-all')} className="rounded-xl bg-[#6121D0] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4C1D95]">Accept All</button>
        </div>
      </div>
    </section>
  );
}

export function CookieSettingsPage() {
  const existing = readConsent();
  const [engagement, setEngagement] = useState(existing?.engagement ?? false);
  const [analytics, setAnalytics] = useState(existing?.analytics ?? false);
  const [conversion, setConversion] = useState(existing?.conversion ?? false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveCookieConsent(engagement, analytics, conversion, 'custom');
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" aria-label="Sophis Central home"><span className="text-lg font-bold text-[#091F5B]">Sophis Central</span></Link>
          <Link to="/cookie-policy" className="text-sm font-semibold text-[#6121D0] hover:underline">Read Cookie Policy</Link>
        </header>
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6121D0]">Privacy controls</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#091F5B]">Manage Cookie Preferences</h1>
          <p className="mt-3 text-sm leading-7 text-[#52627B]">
            Choose which optional cookies and similar technologies Sophis Central may use. You can update your choices at any time.
          </p>

          <div className="mt-7 divide-y divide-[#E5EAF2] rounded-xl border border-[#E5EAF2]">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-semibold text-[#091F5B]">Strictly Necessary</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">Support secure sign-in, account sessions and the essential features of the platform.</p>
                <p className="mt-2 text-xs font-semibold text-[#64748B]">Always active</p>
              </div>
              <input aria-label="Strictly necessary cookies are always active" type="checkbox" checked disabled className="mt-1 h-5 w-5 accent-[#6121D0]" />
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-4 p-4 sm:p-5">
              <span className="min-w-0">
                <span className="block font-semibold text-[#091F5B]">User Engagement &amp; Personalization</span>
                <span className="mt-1 block text-sm leading-6 text-[#64748B]">Help remember your preferences and improve relevant platform experiences.</span>
              </span>
              <input aria-label="User Engagement and Personalization" type="checkbox" checked={engagement} onChange={(event) => { setEngagement(event.target.checked); setSaved(false); }} className="mt-1 h-5 w-5 shrink-0 accent-[#6121D0]" />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4 p-4 sm:p-5">
              <span className="min-w-0">
                <span className="block font-semibold text-[#091F5B]">Performance &amp; Behavior Analytics</span>
                <span className="mt-1 block text-sm leading-6 text-[#64748B]">Help us understand platform usage, measure performance and improve our services.</span>
              </span>
              <input aria-label="Performance and Behavior Analytics" type="checkbox" checked={analytics} onChange={(event) => { setAnalytics(event.target.checked); setSaved(false); }} className="mt-1 h-5 w-5 shrink-0 accent-[#6121D0]" />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4 p-4 sm:p-5">
              <span className="min-w-0">
                <span className="block font-semibold text-[#091F5B]">Conversion Tracking</span>
                <span className="mt-1 block text-sm leading-6 text-[#64748B]">Help measure the effectiveness of campaigns and understand how visitors discover Sophis Central.</span>
              </span>
              <input aria-label="Conversion Tracking" type="checkbox" checked={conversion} onChange={(event) => { setConversion(event.target.checked); setSaved(false); }} className="mt-1 h-5 w-5 shrink-0 accent-[#6121D0]" />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="text-center text-sm font-semibold text-[#64748B] hover:text-[#091F5B]">Back to Sophis Central</Link>
            <button type="button" onClick={save} className="rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4C1D95]">Save my choices</button>
          </div>
          {saved && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Your cookie preferences have been saved.</p>}
        </section>
      </div>
    </main>
  );
}
