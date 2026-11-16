import { ArrowLeft, ArrowUpRight, Globe2, Mail, MessageCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { publicContactEmails } from '../config/publicContact';

export function CommunityPage() {
  const generalEmail = publicContactEmails.general;

  return (
    <main className="min-h-screen bg-[#F6F8FC] text-[#1F2937]">
      <header className="sticky top-0 z-50 border-b border-[#E4EAF5] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#B9C8F5] hover:bg-[#F3F6FC] sm:px-3.5 sm:py-2.5 sm:text-sm">
            <ArrowLeft size={16} /> Back to Sophis Central
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#091F5B] via-[#2C36D9] to-[#6121D0] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white/90">
            <Globe2 size={15} /> BEYOND CAMPUS, CONNECTED
          </span>
          <h1 className="mt-6 break-words text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">The Sophis Central Community</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-normal leading-8 text-[#E7E7EB] sm:text-lg">
            A shared space for everyone interested in learning, research and academic collaboration—wherever you study, teach or live.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 gap-4 px-3 py-8 sm:gap-6 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-16">
        <article className="min-w-0 rounded-2xl border border-[#E1E7F0] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
          <span className="inline-flex rounded-2xl bg-[#F0EBFF] p-3 text-[#6121D0]"><Users size={24} /></span>
          <h2 className="mt-5 break-words text-xl font-bold text-[#091F5B] sm:text-2xl">One community, many academic journeys.</h2>
          <p className="mt-4 text-sm leading-7 text-[#5C6982]">
            Sophis Central community is for all students, lecturers, researchers, graduates and supporters of education.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#5C6982]">
            Connect with the Sophis Central community, share ideas, and stay engaged with academic conversations.
          </p>
        </article>

        <article className="min-w-0 rounded-3xl border border-[#E1E7F0] bg-white p-5 shadow-sm sm:p-8">
          <span className="inline-flex rounded-2xl bg-[#EAF1FF] p-3 text-[#004BEC]"><MessageCircle size={24} /></span>
          <h2 className="mt-5 break-words text-xl font-bold text-[#091F5B] sm:text-2xl">Connect with Sophis Central</h2>
          <p className="mt-3 text-sm leading-7 text-[#5C6982]">
            Connect with the Sophis Central community through academic conversations, shared ideas, and general enquiries.
          </p>
          <div className="mt-5 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFF] px-4 py-4 text-sm font-semibold text-[#334155]">
            For general enquiries, contact the Sophis Central team by email.
          </div>
          <a href={`mailto:${generalEmail}?subject=${encodeURIComponent('Sophis Central Community')}`} className="mt-5 inline-flex w-full min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFF] px-4 py-4 text-left transition hover:border-[#B9C8F5] hover:bg-[#F3F6FC]">
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded-xl bg-white p-2.5 text-[#6121D0] shadow-sm"><Mail size={19} /></span>
              <span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wide text-[#71809A]">General enquiries</span><span className="mt-1 block break-all text-sm font-semibold text-[#091F5B]">{generalEmail}</span></span>
            </span>
            <ArrowUpRight size={18} className="shrink-0 text-[#6121D0]" />
          </a>
        </article>
      </section>

      <footer className="border-t border-[#E1E7F0] bg-white px-4 py-6 text-center text-xs text-[#71809A]">
        © {new Date().getFullYear()} Sophis Central. All rights reserved.
      </footer>
    </main>
  );
}
