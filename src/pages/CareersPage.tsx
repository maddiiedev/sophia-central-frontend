import { ArrowLeft, BriefcaseBusiness, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { isConfiguredEmail, publicContactEmails } from '../config/publicContact';

export function CareersPage() {
  const careersEmail = publicContactEmails.careers;
  const emailReady = isConfiguredEmail(careersEmail);

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </header>
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-9">
          <span className="inline-flex rounded-2xl bg-[#F3F0FF] p-3 text-[#6121D0]"><BriefcaseBusiness size={25} /></span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Careers at Sophis Central</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">Help shape the future of academic learning.</h1>
          <p className="mt-5 text-base leading-7 text-[#374151]">Sophis Central is building an organized academic resource and learning platform for students, researchers, lecturers, and educational institutions. We welcome enquiries from people interested in future career opportunities, internships, collaboration, and contributing to our mission.</p>
          <p className="mt-4 text-sm leading-6 text-[#4B5563]">If you would like to introduce yourself or enquire about potential opportunities, contact our careers team by email. Please include a clear subject line and a brief introduction about your interests and experience. Sending an enquiry does not constitute a job application or guarantee an available vacancy.</p>
          <div className="mt-8 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5">
            <h2 className="font-bold text-[#091F5B]">Career enquiries</h2>
            {emailReady ? (
              <a href={`mailto:${careersEmail}?subject=${encodeURIComponent('Careers Enquiry – Sophis Central')}`} className="mt-3 inline-flex items-center gap-2 font-semibold text-[#6121D0] hover:underline">
                <Mail size={18} /> {careersEmail}
              </a>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#5C6982]">Our dedicated careers email is being configured. Please check back later for the direct email contact.</p>
            )}
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Learn. Research. Grow.</p>
      </div>
    </main>
  );
}
