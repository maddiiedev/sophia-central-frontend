import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-lg font-bold text-[#091F5B]">Sophis Central</Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]"><ArrowLeft size={16} /> Back to home</Link>
        </header>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Your privacy</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#091F5B] sm:text-4xl">Cookie Policy</h1>
          <p className="mt-3 text-sm text-[#5C6982]">Last updated: 19 November 2026</p>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E4DDF7] bg-[#F8F7FF] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-bold text-[#091F5B]">Cookie settings and browser storage</h2>
              <p className="mt-1 text-sm leading-6 text-[#52627B]">Review the essential browser technologies currently used by Sophis Central. Optional category controls are not currently offered.</p>
            </div>
            <Link to="/cookie-settings" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4C1D95]">View Cookie Settings</Link>
          </div>

          <div className="mt-7 space-y-7 text-sm leading-7 text-[#475569]">
            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">1. About this policy</h2>
              <p className="mt-2">This policy explains how Sophis Central uses cookies and similar browser technologies to support secure access and core platform functions. It should be read alongside our <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">2. What are cookies?</h2>
              <p className="mt-2">Cookies are small files stored in your browser when you visit a website. Similar technologies, such as local storage and session storage, can also retain information or support website features.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">3. How we use these technologies</h2>
              <p className="mt-2">Sophis Central uses essential cookies and browser storage where needed for secure access, account sessions, security and core website functions. The cookie notice also stores your acknowledgement in browser local storage so it does not need to be shown on every visit.</p>
              <p className="mt-3">Optional third-party analytics and advertising cookies are not currently enabled on the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">4. Information involved</h2>
              <p className="mt-2">Essential technologies may process information needed to maintain a session, remember the cookie notice acknowledgement, support security, and operate requested features. Other account, resource and platform activity information is described in our <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">5. Third-party services</h2>
              <p className="mt-2">Some features may link to external websites or use service providers to deliver core platform functions. Those providers may have their own privacy notices and technologies. Optional third-party analytics and advertising cookies are not currently enabled. If this changes, we will update this policy and request consent where required by applicable law.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">6. Reviewing essential technologies</h2>
              <p className="mt-2">You can review the technologies currently used on our <Link to="/cookie-settings" className="font-semibold text-[#6121D0] underline">Cookie Settings</Link> page. You can also clear or block cookies and browser storage through your browser settings. Blocking essential technologies may affect sign-in, session continuity and core platform functions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">7. Changes to this policy</h2>
              <p className="mt-2">We may update this policy when our services, technologies or applicable requirements change. The latest version and its update date will be available on this page.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">8. Contact us</h2>
              <p className="mt-2">If you have questions about cookies or your privacy choices, please <Link to="/contact" className="font-semibold text-[#6121D0] underline">contact us</Link>.</p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#DCE4EF] pt-6 text-sm">
            <Link to="/privacy" className="font-semibold text-[#6121D0] hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="font-semibold text-[#6121D0] hover:underline">Terms of Use</Link>
            <Link to="/cookie-settings" className="font-semibold text-[#6121D0] hover:underline">Cookie Settings</Link>
            <Link to="/contact" className="font-semibold text-[#6121D0] hover:underline">Contact Us</Link>
          </div>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Your academic journey, organised.</p>
      </div>
    </main>
  );
}
