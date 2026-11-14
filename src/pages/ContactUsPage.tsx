import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { isConfiguredEmail, publicContactEmails } from '../config/publicContact';

const contactTopics = [
  ['General enquiries', 'questions about Sophis Central, its services, and how the platform works.'],
  ['Technical support', 'registration, sign-in, account access, downloads, or problems using platform features.'],
  ['Academic resources', 'finding, uploading, correcting, reporting, or requesting the review of academic materials.'],
  ['Purchases and payments', 'payment confirmation, failed or duplicate transactions, Wisdom Points, lecturer-material purchases, and refund enquiries.'],
  ['Lecturer and contributor support', 'material listings, pricing information, sales records, revenue shares, and account-related questions.'],
  ['Project and professional services', 'project opportunities, published project budgets, bidding procedures, assignments, and payment enquiries.'],
  ['Copyright and content removal', 'concerns about materials shared without authorization or permission.'],
  ['Privacy and data protection', 'requests concerning personal information, account data, or privacy rights.'],
  ['Partnerships and institutional collaboration', 'enquiries from educational institutions, lecturers, researchers, and potential partners.'],
  ['Feedback and suggestions', 'ideas to improve the platform for students, lecturers, and researchers.'],
];

export function ContactUsPage() {
  const contactEmail = publicContactEmails.general;
  const emailReady = isConfiguredEmail(contactEmail);

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]"><ArrowLeft size={16} /> Back to home</Link>
        </header>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Contact Sophis Central</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">We're here to help you learn and grow.</h1>
          <p className="mt-5 text-base leading-7 text-[#374151]">Do you have a question, need help accessing academic resources, want to report an issue, or have a suggestion for improving Sophis Central? We would love to hear from you.</p>
          <p className="mt-3 text-base leading-7 text-[#374151]">Our goal is to make your academic experience simpler, more organized, and more productive.</p>

          <section className="mt-8 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5">
            <h2 className="font-bold text-[#091F5B]">Get in Touch</h2>
            {emailReady ? (
              <a href={`mailto:${contactEmail}`} className="mt-3 inline-flex items-center gap-2 font-semibold text-[#6121D0] hover:underline"><Mail size={18} /> {contactEmail}</a>
            ) : <p className="mt-3 text-sm text-[#5C6982]">Our contact email is being configured.</p>}
          </section>

          <section className="mt-9">
            <h2 className="text-xl font-bold text-[#091F5B]">You Can Contact Us About</h2>
            <ul className="mt-4 space-y-3">
              {contactTopics.map(([heading, detail]) => <li key={heading} className="text-sm leading-6 text-[#374151]"><strong className="text-[#091F5B]">{heading}:</strong> {detail}</li>)}
            </ul>
          </section>

          <section className="mt-9 border-t border-[#E5E7EB] pt-7">
            <h2 className="text-xl font-bold text-[#091F5B]">Send Us an Email</h2>
            <p className="mt-3 text-sm leading-7 text-[#374151]">When contacting us, include a clear subject line, a concise description of your enquiry, and any relevant reference number or transaction ID. This helps us understand the issue and respond appropriately.</p>
            <p className="mt-3 text-sm leading-7 text-[#374151]">For account-related issues, do not send your password, one-time passcodes, full payment-card details, or other sensitive authentication information. For payment enquiries, provide only the transaction details reasonably needed for verification.</p>
          </section>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Your Academic Resources. One Central Destination.</p>
        <p className="mt-1 text-center text-xs text-[#71809A]">We look forward to hearing from you and building a better academic experience together.</p>
      </div>
    </main>
  );
}
