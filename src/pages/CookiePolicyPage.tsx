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
          <p className="mt-3 text-sm text-[#5C6982]">Last updated: 16 November 2026</p>

          <div className="mt-7 space-y-7 text-sm leading-7 text-[#475569]">
            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">1. About this policy</h2>
              <p className="mt-2">This policy explains how Sophis Central uses cookies and similar technologies to support the platform, improve your experience and understand how our services are used. It should be read alongside our <Link to="/privacy" className="font-semibold text-[#6121D0] underline">Privacy Policy</Link>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">2. What are cookies?</h2>
              <p className="mt-2">Cookies are small files stored in your browser when you visit a website. Similar technologies, such as local storage and session storage, may also remember information or support website features.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">3. How we use cookies</h2>
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="font-semibold text-[#091F5B]">Strictly Necessary</h3>
                  <p className="mt-1">These technologies support secure access, account sessions, platform security and essential website functions. They are always active and cannot be switched off through the preference manager.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#091F5B]">User Engagement &amp; Personalization</h3>
                  <p className="mt-1">These technologies may remember selected preferences and help make your experience more relevant and convenient.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#091F5B]">Performance &amp; Behavior Analytics</h3>
                  <p className="mt-1">These technologies help us understand how the platform is used, identify areas for improvement and monitor overall performance.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#091F5B]">Conversion Tracking</h3>
                  <p className="mt-1">These technologies help measure the effectiveness of outreach and campaigns, such as how visitors arrive at or engage with Sophis Central.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">4. Information that may be collected</h2>
              <p className="mt-2">Depending on your choices and the features you use, cookies and similar technologies may collect information such as browser and device details, approximate location, pages visited, interactions with platform features and referral or campaign information. We do not use these technologies to intentionally collect sensitive personal information.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">5. Third-party services</h2>
              <p className="mt-2">Some platform features may involve trusted service providers, who may process technical information in accordance with their own privacy policies. Where optional third-party cookies or similar technologies are used, they will be subject to your applicable preferences and consent.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">6. Managing your preferences</h2>
              <p className="mt-2">You can accept or reject optional cookies, or choose your preferences by category. You can change your choices at any time through <Link to="/cookie-settings" className="font-semibold text-[#6121D0] underline">Manage Cookie Preferences</Link>. You can also clear or block cookies through your browser settings. Disabling essential cookies may affect sign-in and core platform functions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">7. Changes to this policy</h2>
              <p className="mt-2">We may update this policy when our services, technologies or applicable requirements change. The latest version and its update date will always be available on this page.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#091F5B]">8. Contact us</h2>
              <p className="mt-2">If you have questions about cookies or your privacy choices, please <Link to="/contact" className="font-semibold text-[#6121D0] underline">contact us</Link>.</p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#DCE4EF] pt-6 text-sm">
            <Link to="/privacy" className="font-semibold text-[#6121D0] hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="font-semibold text-[#6121D0] hover:underline">Terms of Use</Link>
            <Link to="/cookie-settings" className="font-semibold text-[#6121D0] hover:underline">Manage Cookie Preferences</Link>
            <Link to="/contact" className="font-semibold text-[#6121D0] hover:underline">Contact Us</Link>
          </div>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Your academic journey, organised.</p>
      </div>
    </main>
  );
}
