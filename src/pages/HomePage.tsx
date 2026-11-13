import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { featureHighlights } from '../lib/mock-data';
import { publicContactEmails } from '../config/publicContact';

export default function HomePage() {
  return (
    <div className="homepage min-h-screen bg-white text-[#1F2937]">
      <header className="sticky top-0 z-50 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 py-3 shadow-sm sm:px-6 lg:px-8">
        <BrandLogo variant="full" tone="dark" />
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium text-[#091F5B] md:flex">
          <a href="#features" className="transition hover:text-[#2C36D9]">Features</a>
          <a href="#community" className="transition hover:text-[#2C36D9]">Community</a>
          <a href="#about" className="transition hover:text-[#2C36D9]">About Us</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link to="/login" className="rounded-xl border-2 border-[#004BEC] bg-white px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC] sm:px-4">Sign in</Link>
          <Link to="/onboarding" className="brand-button px-3 py-2 text-sm font-semibold shadow-sm sm:px-4">Get started</Link>
        </div>
      </header>

      <main>
        <section className="brand-gradient relative overflow-hidden text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8 lg:px-8 lg:py-24">
            <div className="relative z-10 page-shell max-w-3xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100 sm:text-sm">Your academic community, connected</p>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Your academic resources. One central destination.</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">Find course materials, research papers, past questions, and final-year projects in one organized academic platform.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2C36D9]">Get started <ArrowRight size={18} /></Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/70 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">Already a member? Sign in</Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl md:ml-auto">
              <div aria-hidden="true" className="absolute -inset-3 rounded-[2rem] bg-white/10 blur-xl" />
              <img src="/images/students-collaborating.webp" alt="Two university students collaborating on coursework at a laptop" width="520" height="453" fetchPriority="high" decoding="async" className="relative aspect-[1.15/1] w-full rounded-3xl border border-white/25 object-cover shadow-2xl" />
              <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-white/30 bg-white/95 p-4 text-[#091F5B] shadow-xl sm:left-8 sm:right-8">
                <p className="text-sm font-bold">Learn together. Achieve more.</p>
                <p className="mt-1 text-xs leading-5 text-[#4B5563]">A shared home for students, lecturers, and academic resources.</p>
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

        <section id="about" className="scroll-mt-24 bg-[#F8FAFD] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">About Us</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">Your Academic Resources. One Central Destination.</h2>
              <p className="mt-5 text-base leading-7 text-[#374151]">Sophis Central is an academic resource and learning platform designed to make learning, research, and academic collaboration easier for students, researchers, lecturers, and educational institutions.</p>
              <p className="mt-4 text-base leading-7 text-[#374151]">We understand that finding relevant and reliable academic materials can be difficult when resources are scattered across websites, messaging platforms, personal files, institutional repositories, and online libraries. Sophis Central brings academic resources into a more organized, searchable, and accessible environment.</p>
              <p className="mt-4 text-base leading-7 text-[#374151]">The platform is being developed to serve users across universities, polytechnics, and colleges of education, beginning in Nigeria, with an ambition to support wider academic communities across Africa.</p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border border-[#DCE4EF] bg-white p-6">
                <h3 className="text-xl font-bold text-[#091F5B]">Our Mission</h3>
                <p className="mt-3 text-sm leading-7 text-[#374151]">Our mission is to simplify access to academic resources, encourage responsible knowledge-sharing, and support better learning and research experiences for students and academic communities.</p>
              </section>
              <section className="rounded-2xl border border-[#DCE4EF] bg-white p-6">
                <h3 className="text-xl font-bold text-[#091F5B]">Our Vision</h3>
                <p className="mt-3 text-sm leading-7 text-[#374151]">We envision a future where students and researchers can spend less time searching for learning materials and more time learning, creating, researching, and making meaningful contributions to society.</p>
              </section>
            </div>


          </div>
        </section>

        <section id="community" className="mx-auto max-w-7xl bg-white px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
          <div className="brand-gradient rounded-[28px] p-8 text-center shadow-lg sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Academic community</p>
            <h2 className="mt-3 text-3xl font-bold text-white">A shared space for learning, research, and knowledge-sharing.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">Sophis Central brings students, lecturers, and academic resources together in one organized learning environment.</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#091F5B] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:gap-7 lg:px-8 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <BrandLogo variant="full" tone="light" linked={false} className="brightness-0 invert" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">Sophis Central is an academic platform connecting students and lecturers with learning resources, research materials, and tools for knowledge-sharing.</p>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">Company</h3>
            <div className="mt-4 space-y-3 break-words text-sm text-blue-100">
              <a href="#about" className="block hover:text-white">About Us</a>
              <Link to="/careers" className="block hover:text-white">Careers</Link>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">Support</h3>
            <div className="mt-4 space-y-3 text-sm text-blue-100">
              <Link to="/contact" className="block hover:text-white">Contact Us</Link>
              <a href={`mailto:${publicContactEmails.support}?subject=${encodeURIComponent('Sophis Central Support Enquiry')}`} className="block hover:text-white">Email Support</a>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">Policies</h3>
            <div className="mt-4 space-y-3 text-sm text-blue-100">
              <Link to="/terms" className="block hover:text-white">Terms of Use</Link>
              <Link to="/privacy" className="block hover:text-white">Privacy Policy</Link>
              <Link to="/financial-policy" className="block hover:text-white">Financial Policy</Link>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white">Explore</h3>
            <div className="mt-4 space-y-3 text-sm text-blue-100">
              <a href="#features" className="block hover:text-white">Features</a>
              <a href="#community" className="block hover:text-white">Academic community</a>
              <Link to="/library" className="block hover:text-white">Academic library</Link>
              <Link to="/library" className="block hover:text-white">Research materials</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/15"><div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-blue-100 sm:px-6 lg:px-8">© {new Date().getFullYear()} Sophis Central. All rights reserved.</div></div>
      </footer>
    </div>
  );
}
