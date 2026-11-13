import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BookMarked,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  LibraryBig,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { featureHighlights } from '../lib/mock-data';
import { publicContactEmails } from '../config/publicContact';

const featureIcons = [Search, ShieldCheck, BrainCircuit, Sparkles];
const resourceTypes = [
  { label: 'Lecture notes', detail: 'Organised course materials', icon: BookOpen, tone: 'blue' },
  { label: 'Past questions', detail: 'Prepare with confidence', icon: BookMarked, tone: 'purple' },
  { label: 'Research papers', detail: 'Explore academic work', icon: LibraryBig, tone: 'indigo' },
  { label: 'Projects', detail: 'Learn from completed work', icon: GraduationCap, tone: 'sky' },
];

const steps = [
  { number: '01', title: 'Create your account', text: 'Join with your academic details and become part of the Sophis Central community.' },
  { number: '02', title: 'Find what you need', text: 'Explore learning materials and research resources in one organised place.' },
  { number: '03', title: 'Learn and contribute', text: 'Build your knowledge, connect with your academic community, and share useful resources.' },
];

export default function HomePage() {
  return (
    <div className="homepage min-h-screen overflow-hidden bg-white text-[#1F2937]">
      <header className="homepage-nav sticky top-0 z-50 border-b border-[#E5EAF4] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo variant="full" tone="dark" />
          <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm font-semibold text-[#091F5B] md:flex">
            <a href="#features" className="homepage-nav-link">Features</a>
            <a href="#resources" className="homepage-nav-link">Resources</a>
            <a href="#community" className="homepage-nav-link">Community</a>
            <a href="#about" className="homepage-nav-link">About Us</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/login" className="rounded-xl border border-[#004BEC]/30 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#004BEC] transition hover:border-[#004BEC] hover:bg-[#F3F6FC] sm:px-4">Sign in</Link>
            <Link to="/onboarding" className="brand-button gap-2 px-3.5 py-2.5 text-sm font-semibold shadow-md shadow-[#6121D0]/20 sm:px-5">Get started <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="homepage-hero relative isolate overflow-hidden text-white">
          <div aria-hidden="true" className="homepage-orb homepage-orb-one" />
          <div aria-hidden="true" className="homepage-orb homepage-orb-two" />
          <div aria-hidden="true" className="homepage-grid absolute inset-0 opacity-20" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-16 sm:px-6 sm:pt-20 md:grid-cols-[1.02fr_0.98fr] md:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="homepage-reveal relative z-10 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-white/90 backdrop-blur">
                <Sparkles size={14} className="text-[#D9C6FF]" /> YOUR ACADEMIC COMMUNITY, CONNECTED
              </div>
              <h1 className="max-w-2xl text-[2.65rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.65rem]">
                Make room for <span className="homepage-gradient-text">better learning.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-blue-50 sm:text-lg">
                Find course materials, research papers, past questions, and final-year projects in one organised academic platform built to bring learning communities closer.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#080F45]/25 transition duration-300 hover:-translate-y-0.5 hover:bg-[#7435E5] hover:shadow-xl">
                  Explore Sophis Central <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/5 px-6 py-3.5 font-semibold text-white transition duration-300 hover:bg-white/15">
                  Sign in to your account
                </Link>
              </div>
              <a href="#features" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-blue-100/80 transition hover:text-white">
                Discover what you can do <ArrowDown size={15} />
              </a>
            </div>

            <div className="homepage-reveal homepage-reveal-delay relative mx-auto w-full max-w-[570px]">
              <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-[#7A55F2]/30 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-2.5 shadow-2xl shadow-[#050B3B]/40 backdrop-blur-md sm:p-3.5">
                <img src="/images/students-collaborating.webp" alt="University students collaborating on coursework" width="520" height="453" fetchPriority="high" decoding="async" className="aspect-[1.25/1] w-full rounded-[1.45rem] object-cover" />
                <div className="absolute -left-4 top-8 hidden items-center gap-3 rounded-2xl border border-white/60 bg-white p-3.5 text-[#091F5B] shadow-xl sm:flex">
                  <span className="rounded-xl bg-[#F0EBFF] p-2.5 text-[#6121D0]"><LibraryBig size={20} /></span>
                  <span><strong className="block text-sm">Academic library</strong><span className="text-xs text-[#64748B]">Resources in one place</span></span>
                </div>
                <div className="absolute -bottom-6 -right-3 flex max-w-[245px] items-center gap-3 rounded-2xl border border-white/60 bg-white p-3.5 text-[#091F5B] shadow-xl sm:-right-5 sm:p-4">
                  <span className="rounded-xl bg-[#EAF1FF] p-2.5 text-[#004BEC]"><Users size={20} /></span>
                  <span><strong className="block text-sm">Learn together</strong><span className="text-xs text-[#64748B]">Students and lecturers, connected</span></span>
                </div>
              </div>
              <div aria-hidden="true" className="absolute -bottom-12 left-10 -z-10 h-28 w-28 rounded-full border border-white/15" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent" />
        </section>

        <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-3 rounded-2xl border border-[#E4EAF5] bg-white p-4 shadow-[0_18px_55px_rgba(9,31,91,0.08)] sm:grid-cols-3 sm:p-6">
            <div className="flex items-center gap-3 rounded-xl bg-[#F3F6FC] p-4">
              <span className="rounded-xl bg-white p-3 text-[#004BEC] shadow-sm"><Search size={21} /></span>
              <div><p className="text-sm font-bold text-[#091F5B]">Discover resources</p><p className="mt-0.5 text-xs text-[#64748B]">Search with purpose</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#F0EBFF] p-4">
              <span className="rounded-xl bg-white p-3 text-[#6121D0] shadow-sm"><BrainCircuit size={21} /></span>
              <div><p className="text-sm font-bold text-[#091F5B]">Study smarter</p><p className="mt-0.5 text-xs text-[#64748B]">Get learning support</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#EAF1FF] p-4">
              <span className="rounded-xl bg-white p-3 text-[#2C36D9] shadow-sm"><MessageCircle size={21} /></span>
              <div><p className="text-sm font-bold text-[#091F5B]">Stay connected</p><p className="mt-0.5 text-xs text-[#64748B]">Be part of the community</p></div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6121D0]">A better way to study</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">Everything you need to move your learning forward.</h2>
              <p className="mt-4 text-base leading-7 text-[#64748B]">Less time hunting for materials. More time learning, researching, and sharing knowledge.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featureHighlights.map((feature, index) => {
                const Icon = featureIcons[index] ?? Sparkles;
                const tones = [
                  'bg-[#EAF1FF] text-[#004BEC]',
                  'bg-[#F0EBFF] text-[#6121D0]',
                  'bg-[#E9ECFF] text-[#2C36D9]',
                  'bg-[#F3F6FC] text-[#091F5B]',
                ];
                return (
                  <article key={feature.title} className="homepage-feature-card group rounded-2xl border border-[#E4EAF5] bg-white p-6 shadow-[0_5px_22px_rgba(9,31,91,0.035)] transition duration-300 hover:-translate-y-1.5 hover:border-[#B9C8F5] hover:shadow-[0_18px_40px_rgba(9,31,91,0.10)]">
                    <span className={'mb-6 inline-flex rounded-2xl p-3.5 transition duration-300 group-hover:scale-105 ' + tones[index % tones.length]}><Icon size={23} /></span>
                    <h3 className="text-lg font-bold text-[#091F5B]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#64748B]">{feature.text}</p>
                    <div className="mt-6 h-1 w-10 rounded-full bg-gradient-to-r from-[#004BEC] to-[#6121D0] transition-all duration-300 group-hover:w-16" />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="resources" className="scroll-mt-24 bg-[#F3F6FC] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#004BEC]">Your academic workspace</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">The right resource can change how you learn.</h2>
              <p className="mt-5 text-base leading-8 text-[#52627B]">Bring your study materials closer. Explore different types of academic content and find resources that support your courses, projects, and research.</p>
              <Link to="/onboarding" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#004BEC] px-5 py-3 font-semibold text-white shadow-md shadow-[#004BEC]/15 transition hover:-translate-y-0.5 hover:bg-[#2C36D9]">
                Start exploring <ArrowRight size={17} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {resourceTypes.map((item, index) => {
                const Icon = item.icon;
                const styles = [
                  'bg-white text-[#004BEC] border-[#DCE7FF]',
                  'bg-white text-[#6121D0] border-[#E4D9FF]',
                  'bg-white text-[#2C36D9] border-[#DDE0FF]',
                  'bg-white text-[#0877B9] border-[#D5EDFA]',
                ];
                return (
                  <div key={item.label} className={'homepage-resource-tile rounded-2xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ' + styles[index]}>
                    <span className="inline-flex rounded-xl bg-current/5 p-3"><Icon size={23} /></span>
                    <h3 className="mt-5 text-lg font-bold text-[#091F5B]">{item.label}</h3>
                    <p className="mt-1 text-sm text-[#64748B]">{item.detail}</p>
                    <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">Explore resource type <ArrowRight size={13} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#EAF1FF] via-[#F0EBFF] to-[#EAF7FF]" />
              <div className="relative rounded-[1.7rem] border border-[#E0E7F4] bg-white p-6 shadow-xl sm:p-8">
                <div className="flex items-center justify-between border-b border-[#E8EDF5] pb-5">
                  <div className="flex items-center gap-3"><span className="rounded-xl bg-[#F0EBFF] p-2.5 text-[#6121D0]"><BrainCircuit size={21} /></span><div><p className="text-sm font-bold text-[#091F5B]">AI learning support</p><p className="text-xs text-[#94A3B8]">Study companion</p></div></div>
                  <span className="rounded-full bg-[#F0EBFF] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6121D0]">Learning tools</span>
                </div>
                <div className="mt-6 rounded-2xl rounded-tl-sm bg-[#F3F6FC] p-4">
                  <p className="text-xs font-semibold text-[#004BEC]">You</p>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">Can you help me understand a difficult topic from my course materials?</p>
                </div>
                <div className="ml-5 mt-4 rounded-2xl rounded-tr-sm bg-[#F0EBFF] p-4 sm:ml-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6121D0]"><Sparkles size={14} /> Study support</div>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">Break the topic into smaller ideas, review the key concepts, and use examples to build your understanding step by step.</p>
                </div>
                <p className="mt-4 text-[11px] leading-5 text-[#94A3B8]">Illustrative preview of a learning-support interaction.</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6121D0]">Learning with more clarity</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">Make challenging topics feel more approachable.</h2>
              <p className="mt-5 text-base leading-8 text-[#64748B]">Learning is not just about collecting materials. Sophis Central brings learning resources and AI-powered study support into the same academic experience, helping students engage with ideas and keep moving forward.</p>
              <ul className="mt-7 space-y-4">
                <li className="flex items-start gap-3 text-sm leading-6 text-[#42516A]"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#6121D0]" /> Get help exploring and understanding study topics.</li>
                <li className="flex items-start gap-3 text-sm leading-6 text-[#42516A]"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#6121D0]" /> Keep useful academic resources close to your learning.</li>
                <li className="flex items-start gap-3 text-sm leading-6 text-[#42516A]"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#6121D0]" /> Build confidence through active study and revision.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="community" className="scroll-mt-24 bg-[#F8F7FF] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6121D0]">More than a library</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">A shared space for the people behind academic progress.</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#64748B]">Sophis Central brings students and lecturers into a connected academic environment where resources can be discovered, knowledge can be shared, and conversations can continue beyond the classroom.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#E1D8FA] bg-white px-4 py-2 text-sm font-semibold text-[#6121D0]"><GraduationCap size={16} /> Students</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E4FF] bg-white px-4 py-2 text-sm font-semibold text-[#004BEC]"><Users size={16} /> Lecturers</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE0FF] bg-white px-4 py-2 text-sm font-semibold text-[#2C36D9]"><MessageCircle size={16} /> Academic communities</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#6121D0]/15 to-[#004BEC]/10 blur-xl" />
                <div className="relative rounded-[1.7rem] bg-gradient-to-br from-[#091F5B] via-[#2C36D9] to-[#6121D0] p-7 text-white shadow-xl sm:p-9">
                  <div className="flex items-center gap-3"><span className="rounded-xl bg-white/15 p-3"><Users size={23} /></span><span className="text-sm font-semibold text-white/80">Connected by knowledge</span></div>
                  <h3 className="mt-8 text-2xl font-bold leading-snug text-white">Every academic journey is better with the right community.</h3>
                  <p className="mt-4 text-sm leading-7 text-blue-100">Discover resources, exchange ideas, and take part in a more connected learning experience.</p>
                  <div className="mt-8 flex items-center gap-2 border-t border-white/20 pt-5 text-sm font-semibold text-white"><Workflow size={17} /> Learn. Share. Grow.</div>
                  <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-5 h-24 w-24 rounded-full border border-white/15" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#004BEC]">Get started in a few steps</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">Your next step starts here.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.number} className="relative rounded-2xl border border-[#E4EAF5] bg-white p-6 shadow-sm sm:p-7">
                  <span className={'inline-flex rounded-xl px-3 py-2 text-sm font-extrabold ' + (index === 1 ? 'bg-[#F0EBFF] text-[#6121D0]' : index === 2 ? 'bg-[#E9ECFF] text-[#2C36D9]' : 'bg-[#EAF1FF] text-[#004BEC]')}>{step.number}</span>
                  <h3 className="mt-6 text-lg font-bold text-[#091F5B]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#64748B]">{step.text}</p>
                  {index < 2 && <div aria-hidden="true" className="absolute -right-3 top-10 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[#E4EAF5] bg-white text-[#6121D0] md:flex"><ArrowRight size={13} /></div>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-[#F3F6FC] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6121D0]">About Sophis Central</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-[#091F5B] sm:text-4xl">Bringing academic resources and people closer.</h2>
              </div>
              <div className="space-y-5 text-base leading-8 text-[#52627B]">
                <p>Sophis Central is an academic resource and learning platform designed to make learning, research, and academic collaboration easier for students, researchers, lecturers, and educational institutions.</p>
                <p>We understand that finding relevant and reliable academic materials can be difficult when resources are scattered across websites, messaging platforms, personal files, institutional repositories, and online libraries. Sophis Central brings academic resources into a more organised, searchable, and accessible environment.</p>
                <p>The platform is being developed to serve users across universities, polytechnics, and colleges of education, beginning in Nigeria, with an ambition to support wider academic communities across Africa.</p>
              </div>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-[#DCE5F3] bg-white p-7 shadow-sm sm:p-8">
                <span className="inline-flex rounded-xl bg-[#EAF1FF] p-3 text-[#004BEC]"><ArrowRight size={20} /></span>
                <h3 className="mt-5 text-xl font-bold text-[#091F5B]">Our Mission</h3>
                <p className="mt-3 text-sm leading-7 text-[#64748B]">Our mission is to simplify access to academic resources, encourage responsible knowledge-sharing, and support better learning and research experiences for students and academic communities.</p>
              </article>
              <article className="rounded-2xl border border-[#E4DDF7] bg-white p-7 shadow-sm sm:p-8">
                <span className="inline-flex rounded-xl bg-[#F0EBFF] p-3 text-[#6121D0]"><Sparkles size={20} /></span>
                <h3 className="mt-5 text-xl font-bold text-[#091F5B]">Our Vision</h3>
                <p className="mt-3 text-sm leading-7 text-[#64748B]">We envision a future where students and researchers can spend less time searching for learning materials and more time learning, creating, researching, and making meaningful contributions to society.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#091F5B] via-[#2C36D9] to-[#6121D0] px-4 py-16 text-center text-white sm:px-6 lg:px-8 lg:py-20">
          <div aria-hidden="true" className="homepage-cta-orb absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/15" />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">Your academic journey, connected</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">Ready to make your next learning move?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-blue-100">Join a growing academic community and bring your learning resources into one central place.</p>
            <Link to="/onboarding" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-[#2C36D9] shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#F0EBFF]">Get started with Sophis Central <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#091F5B] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:gap-7 lg:px-8 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <BrandLogo variant="full" tone="light" linked={false} className="brightness-0 invert" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">Sophis Central is an academic platform connecting students and lecturers with learning resources, research materials, and tools for knowledge-sharing.</p>
          </div>
          <div className="min-w-0"><h3 className="font-semibold text-white">Company</h3><div className="mt-4 space-y-3 break-words text-sm text-blue-100"><a href="#about" className="block transition hover:text-white">About Us</a><Link to="/careers" className="block transition hover:text-white">Careers</Link></div></div>
          <div className="min-w-0"><h3 className="font-semibold text-white">Support</h3><div className="mt-4 space-y-3 text-sm text-blue-100"><Link to="/contact" className="block transition hover:text-white">Contact Us</Link><a href={'mailto:' + publicContactEmails.support + '?subject=' + encodeURIComponent('Sophis Central Support Enquiry')} className="block transition hover:text-white">Email Support</a></div></div>
          <div className="min-w-0"><h3 className="font-semibold text-white">Policies</h3><div className="mt-4 space-y-3 text-sm text-blue-100"><Link to="/terms" className="block transition hover:text-white">Terms of Use</Link><Link to="/privacy" className="block transition hover:text-white">Privacy Policy</Link><Link to="/financial-policy" className="block transition hover:text-white">Financial Policy</Link></div></div>
          <div className="min-w-0"><h3 className="font-semibold text-white">Explore</h3><div className="mt-4 space-y-3 text-sm text-blue-100"><a href="#features" className="block transition hover:text-white">Features</a><a href="#community" className="block transition hover:text-white">Academic community</a><Link to="/library" className="block transition hover:text-white">Academic library</Link><Link to="/library" className="block transition hover:text-white">Research materials</Link></div></div>
        </div>
        <div className="border-t border-white/15"><div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-blue-100 sm:px-6 lg:px-8">© {new Date().getFullYear()} Sophis Central. All rights reserved.</div></div>
      </footer>
    </div>
  );
}
