import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { brandStats, featureHighlights } from '../lib/mock-data';

export default function HomePage() {
  return (
    <div className="homepage min-h-screen bg-white text-[#1F2937]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo variant="full" tone="dark" />
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium text-[#091F5B] md:flex">
          <a href="#features" className="transition hover:text-[#2C36D9]">Features</a>
          <a href="#impact" className="transition hover:text-[#2C36D9]">Impact</a>
          <a href="#community" className="transition hover:text-[#2C36D9]">Community</a>
          <a href="#about" className="transition hover:text-[#2C36D9]">About</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href="#about" className="text-xs font-semibold text-[#6121D0] transition hover:text-[#2C36D9] md:hidden">About</a>
          <Link to="/login" className="rounded-xl border-2 border-[#004BEC] bg-white px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC] sm:px-4">Sign in</Link>
          <Link to="/login" className="brand-button px-3 py-2 text-sm font-semibold shadow-sm sm:px-4">Get started</Link>
        </div>
      </header>

      <main>
        <section className="brand-gradient relative overflow-hidden text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div className="relative z-10 page-shell">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                <Sparkles size={14} />
                Academic library
              </div>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Your academic resources. One central destination.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">Find course materials, research papers, past questions, and final-year projects in one organized academic platform.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2C36D9]">Explore Resources <ArrowRight size={18} /></Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/70 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Browse Courses</Link>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {brandStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-blue-100">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center">
              <div className="w-full rounded-[28px] border border-white/20 bg-white p-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4B5563]">Academic library</div>
                    <div className="mt-2 text-xl font-bold text-[#091F5B]">Discover resources</div>
                  </div>
                  <div className="rounded-full bg-[#F3F6FC] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2C36D9]">Verified</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                    <div><div className="font-semibold text-[#091F5B]">Boolean Algebra Notes</div><div className="text-xs text-[#4B5563]">CPE 221 • University of Lagos</div></div>
                    <BookOpen size={17} className="shrink-0 text-[#2C36D9]" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                    <div><div className="font-semibold text-[#091F5B]">2024 Past Questions</div><div className="text-xs text-[#4B5563]">CPE 211 • Lagos State University</div></div>
                    <GraduationCap size={17} className="shrink-0 text-[#2C36D9]" />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F3F6FC] p-4"><div className="text-sm font-semibold text-[#6121D0]">AI Chat Assistance</div><div className="mt-2 text-2xl font-bold text-[#091F5B]">4.8k</div><div className="text-xs text-[#4B5563]">study questions answered</div></div>
                  <div className="rounded-xl border border-[#E5E7EB] p-4"><div className="text-sm font-semibold text-[#091F5B]">Academic resources</div><div className="mt-2 text-2xl font-bold text-[#2C36D9]">1,420</div><div className="text-xs text-[#4B5563]">resources organized</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Academic library</p><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Everything students need to study without the chaos.</h2></div>
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

        <section id="impact" className="mx-auto max-w-7xl bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"><div className="mb-3 flex items-center gap-2 text-[#2C36D9]"><BookOpen size={18} /><span className="text-sm font-semibold uppercase tracking-[0.18em]">Research</span></div><div className="text-3xl font-bold text-[#091F5B]">81%</div><p className="mt-3 text-[#4B5563]">of students spend over 21 minutes searching for academic resources.</p></div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"><div className="mb-3 flex items-center gap-2 text-[#2C36D9]"><Users size={18} /><span className="text-sm font-semibold uppercase tracking-[0.18em]">Community</span></div><div className="text-3xl font-bold text-[#091F5B]">71%</div><p className="mt-3 text-[#4B5563]">want topic-based search and a cleaner, more organized academic library.</p></div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"><div className="mb-3 flex items-center gap-2 text-[#6121D0]"><ShieldCheck size={18} /><span className="text-sm font-semibold uppercase tracking-[0.18em]">Trust</span></div><div className="text-3xl font-bold text-[#091F5B]">90%</div><p className="mt-3 text-[#4B5563]">of students say a verified, centralized academic platform would be extremely useful.</p></div>
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
      </footer>
    </div>
  );
}
