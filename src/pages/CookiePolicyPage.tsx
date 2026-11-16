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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Privacy and transparency</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#091F5B] sm:text-4xl">Cookie Policy</h1>
          <p className="mt-3 text-sm text-[#5C6982]">Last updated: 16 November 2026</p>

          <div className="mt-7 space-y-7 text-sm leading-7 text-[#475569]">
            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">1. About this policy</h2>
              <p className="mt-2">This Cookie Policy explains how Sophis Central uses cookies and similar browser technologies when you visit our website or use the platform. It should be read together with our <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link> and <Link to="/terms" className="font-semibold text-[#6121D0] underline">Terms of Use</Link>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">2. What are cookies and similar technologies?</h2>
              <p className="mt-2">Cookies are small text files that a website may store in your browser. Similar technologies include local storage and session storage, which can retain information in your browser without being cookies. This policy describes these technologies together where they serve related purposes, while distinguishing them where relevant.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">3. Technologies used by Sophis Central</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead className="bg-[#F3F6FC] text-[#091F5B]"><tr><th className="p-3 font-semibold">Category</th><th className="p-3 font-semibold">Purpose</th><th className="p-3 font-semibold">Current status</th></tr></thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr><td className="p-3 font-semibold">Strictly necessary cookies</td><td className="p-3">Authentication/session continuity, CSRF protection and security.</td><td className="p-3">Used by the platform's authentication and backend services. Exact cookie names and expiry are controlled by the server and browser session.</td></tr>
                    <tr><td className="p-3 font-semibold">Functional browser storage</td><td className="p-3">Remembering selected interface preferences and supporting temporary, user-requested app functions.</td><td className="p-3">The frontend uses local storage and session storage for selected preferences and app state. These are not cookies.</td></tr>
                    <tr><td className="p-3 font-semibold">Analytics</td><td className="p-3">Understanding aggregate visits, feature use and performance.</td><td className="p-3">No third-party analytics SDK or analytics tag was identified in the current frontend implementation.</td></tr>
                    <tr><td className="p-3 font-semibold">Marketing and advertising</td><td className="p-3">Advertising, retargeting or campaign measurement.</td><td className="p-3">No advertising pixel or marketing tag was identified in the current frontend implementation.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">The platform may rely on essential cookies set by its authentication and backend services. Their exact names, domains, expiry periods and attributes can vary with the server configuration, browser and deployment environment. We do not publish an unverified cookie-name inventory here.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">4. How we use browser storage</h2>
              <p className="mt-2">Depending on the feature, browser storage may help remember your interface theme, keep temporary registration information during a session, retain selected app state, or support user-requested features. Browser storage may be cleared through your browser settings. Clearing it can reset preferences or remove locally retained state, and may require you to sign in again where the relevant session has expired.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">5. Your choices</h2>
              <p className="mt-2">Strictly necessary technologies remain active because they support core platform functions, security and account access. Optional analytics and marketing technologies are disabled by default in the current frontend. If optional services are introduced, they must not be activated before the required consent is obtained.</p>
              <p className="mt-2">You can review or change your saved choices at any time using <Link to="/cookie-settings" className="font-semibold text-[#6121D0] underline">Cookie Settings</Link>. You can also manage or clear cookies and browser storage through your browser controls. Blocking essential cookies may prevent sign-in or other parts of the platform from working correctly.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">6. Third-party services</h2>
              <p className="mt-2">Some platform features may rely on service providers for hosting, authentication, communications, payments, security or other operations. Those providers may process technical information under their own service terms and privacy commitments. External websites linked from Sophis Central operate independently and may use their own cookies and technologies.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">7. Changes to this policy</h2>
              <p className="mt-2">We may update this policy when platform features, service providers, technologies or legal requirements change. The latest version and its effective date will be published on this page. Where required, we will provide additional notice or request your consent before optional technologies are used.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">8. Contact</h2>
              <p className="mt-2">For questions about this Cookie Policy or your privacy choices, use our <Link to="/contact" className="font-semibold text-[#6121D0] underline">Contact Us</Link> page. For broader information about how personal information is handled, see the <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.</p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#DCE4EF] pt-6 text-sm">
            <Link to="/privacy" className="font-semibold text-[#6121D0] hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="font-semibold text-[#6121D0] hover:underline">Terms of Use</Link>
            <Link to="/cookie-settings" className="font-semibold text-[#6121D0] hover:underline">Cookie Settings</Link>
            <Link to="/contact" className="font-semibold text-[#6121D0] hover:underline">Contact Us</Link>
          </div>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Learn. Research. Grow.</p>
      </div>
    </main>
  );
}
