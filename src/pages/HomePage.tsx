import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { featureHighlights } from '../lib/mock-data';

export default function HomePage() {
  return (
    <div className="homepage min-h-screen bg-white text-[#1F2937]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo variant="full" tone="dark" />
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium text-[#091F5B] md:flex">
          <a href="#features" className="transition hover:text-[#2C36D9]">Features</a>
          <a href="#community" className="transition hover:text-[#2C36D9]">Community</a>
          <a href="#about" className="transition hover:text-[#2C36D9]">About</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link to="/login" className="rounded-xl border-2 border-[#004BEC] bg-white px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC] sm:px-4">Sign in</Link>
          <Link to="/login" className="brand-button px-3 py-2 text-sm font-semibold shadow-sm sm:px-4">Get started</Link>
        </div>
      </header>

      <main>
        <section className="brand-gradient relative overflow-hidden text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="relative z-10 page-shell max-w-4xl">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Your academic resources. One central destination.</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">Find course materials, research papers, past questions, and final-year projects in one organized academic platform.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2C36D9]">Explore Resources <ArrowRight size={18} /></Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/70 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Browse Courses</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 text-center"><h2 className="text-3xl font-bold text-[#091F5B]">Everything students need to study without the chaos.</h2></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2C36D9]/40 hover:shadow-md">
                <div className="mb-4 inline-flex rounded-xl bg-[#F3F6FC] p-2 text-[#2C36D9]"><Sparkles size={18} /></div>
                <div className="text-lg font-bold text-[#091F5B]">{feature.title}</div>
                <p className="mt-3 text-sm leading-6 text-[#4B5563]">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl bg-[#F8FAFD] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">About Sophis Central</p><h2 className="mt-3 text-3xl font-bold leading-tight text-[#091F5B]">A more organized home for academic knowledge.</h2></div>
            <div><p className="text-base leading-7 text-[#374151]">Sophis Central brings verified academic resources, research materials, lecturer contributions, and study support into one structured space. Resources are reviewed before they enter the shared library, helping students discover materials relevant to their school, faculty, and department.</p><Link to="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white transition hover:bg-[#2C36D9]">Join the community <ArrowRight size={17}/></Link></div>
          </div>
        </section>

        <section id="community" className="mx-auto max-w-7xl bg-white px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
          <div className="brand-gradient rounded-[28px] p-8 text-center shadow-lg sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Academic community</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Build a better academic resource experience together.</h2>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/login" className="rounded-xl bg-[#6121D0] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2C36D9]">Start studying smarter</Link><Link to="/login" className="rounded-xl border border-white/70 px-6 py-3.5 font-semibold text-white">Become a contributor</Link></div>
          </div>
        </section>
      </main>

      <footer className="bg-[#091F5B] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div><BrandLogo variant="full" tone="light" linked={false} className="brightness-0 invert" /><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">Your academic resources. One central destination.</p></div>
          <div><h3 className="font-semibold text-white">Resources</h3><div className="mt-3 space-y-2 text-sm text-blue-100"><div>Courses</div><div>Academic library</div><div>Research materials</div></div></div>
          <div><h3 className="font-semibold text-white">Contact</h3><div className="mt-3 space-y-2 text-sm text-blue-100"><div>Resource Template</div><div>Terms of Use</div><div>Contact Us</div></div></div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-blue-100 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} Sophis Central
          </div>
        </div>
      </footer>
    </div>
  );
}
