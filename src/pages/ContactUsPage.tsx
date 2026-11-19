import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { isConfiguredEmail, publicContactEmails } from '../config/publicContact';
import { supportApi } from '../api/support';

const contactTopics = [
  ['General enquiries', 'Questions about Sophis Central, its services, and how the platform works.'],
  ['Technical support', 'Registration, sign-in, account access, downloads, or problems using platform features.'],
  ['Academic resources', 'Finding, uploading, correcting, reporting, or requesting the review of academic materials.'],
  ['Purchases and payments', 'Payment confirmation, failed or duplicate transactions, Wisdom Points, purchases, and refund enquiries.'],
  ['Lecturer and contributor support', 'Material listings, pricing information, sales records, revenue shares, and account-related questions.'],
  ['Copyright and content removal', 'Concerns about materials shared without authorization or permission.'],
  ['Privacy and data protection', 'Requests concerning personal information, account data, or privacy rights.'],
  ['Partnerships and institutional collaboration', 'Enquiries from educational institutions, lecturers, researchers, and potential partners.'],
  ['Feedback and suggestions', 'Ideas to improve the platform for students, lecturers, and researchers.'],
];

const categories = [
  { value: 'account', label: 'Account access' },
  { value: 'profile', label: 'Profile and settings' },
  { value: 'resources', label: 'Academic resources' },
  { value: 'payments', label: 'Payments and purchases' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'other', label: 'General enquiry or other' },
];

export function ContactUsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contactEmail = publicContactEmails.general;
  const emailReady = isConfiguredEmail(contactEmail);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('technical');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [linkText, setLinkText] = useState('');
  const [sending, setSending] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('verifySupport');
    if (!token) return;
    let active = true;
    setVerificationBusy(true);
    setError('');
    setVerificationMessage('');
    void supportApi.verifyPublicEmail(token)
      .then(result => {
        if (active) setVerificationMessage(result.message);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'This verification link is invalid or has expired.');
      })
      .finally(() => {
        if (active) {
          setVerificationBusy(false);
          navigate('/contact', { replace: true });
        }
      });
    return () => { active = false; };
  }, [searchParams, navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setConfirmation('');
    const links = linkText.split('\n').map(value => value.trim()).filter(Boolean);
    if (links.length > 5) { setError('Add no more than five links.'); return; }
    if (links.some(value => { try { const url = new URL(value); return !['http:', 'https:'].includes(url.protocol); } catch { return true; } })) {
      setError('Enter valid links beginning with https:// or http://.');
      return;
    }
    setSending(true);
    try {
      const result = await supportApi.publicCreate({
        name: name.trim(),
        email: email.trim(),
        institution: institution.trim() || undefined,
        faculty: faculty.trim() || undefined,
        department: department.trim() || undefined,
        category,
        subject: subject.trim(),
        description: description.trim(),
        links,
      });
      setConfirmation(`We’ve sent a verification email to ${email.trim()}. Open the message and select Verify email to submit your support request. The link expires in 30 minutes. If you do not see it shortly, check your spam or junk folder. Your request will not enter the Support queue until your email is verified.`);
      setSubject('');
      setDescription('');
      setLinkText('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your request could not be submitted. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]"><ArrowLeft size={16} /> Back to home</Link>
        </header>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Contact Sophis Central</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">How can we help?</h1>
          <p className="mt-4 text-sm leading-7 text-[#374151] sm:text-base">Send a request to the Sophis Central Support team. You can contact us without signing in. We will verify your email address before submitting a public request to Support.</p>

          {(verificationBusy || verificationMessage) && <div role="status" className="mt-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={19} className="mt-0.5 shrink-0"/><p>{verificationBusy ? 'Verifying your email address…' : verificationMessage}</p></div>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {confirmation && <div role="status" aria-live="polite" className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><Mail size={19} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Check your email to verify your address</p><p className="mt-1 break-words">{confirmation}</p></div></div>}

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Your name *</span><input required minLength={2} maxLength={120} value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Full name" className="brand-input"/></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Email address *</span><input required type="email" maxLength={320} value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="brand-input"/></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Institution <span className="font-normal text-[#71809A]">(optional)</span></span><input maxLength={180} value={institution} onChange={event => setInstitution(event.target.value)} placeholder="Institution name" className="brand-input"/></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Faculty <span className="font-normal text-[#71809A]">(optional)</span></span><input maxLength={180} value={faculty} onChange={event => setFaculty(event.target.value)} placeholder="Faculty or school" className="brand-input"/></label>
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Department <span className="font-normal text-[#71809A]">(optional)</span></span><input maxLength={180} value={department} onChange={event => setDepartment(event.target.value)} placeholder="Department" className="brand-input"/></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Enquiry category *</span><select value={category} onChange={event => setCategory(event.target.value)} className="brand-input">{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Subject *</span><input required minLength={4} maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="Briefly describe your enquiry" className="brand-input"/></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">How can we help? *</span><textarea required minLength={10} maxLength={10000} rows={6} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe what happened, what you need help with, and any relevant context." className="brand-input"/><span className="mt-1 block text-right text-xs text-[#71809A]">{description.length}/10,000</span></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Relevant links <span className="font-normal text-[#71809A]">(optional, up to 5)</span></span><textarea rows={3} value={linkText} onChange={event => setLinkText(event.target.value)} placeholder="Paste one https:// link per line" className="brand-input"/></label>
            <div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-xs leading-5 text-[#5C6982]"><div className="flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#6121D0]"/><p>We will send a verification link to your email address. Your request enters the Support queue only after you verify it. If the address belongs to a verified Sophis Central student or lecturer account, the ticket can then be linked to that account. Never include passwords, one-time passcodes, or full payment-card details.</p></div></div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#71809A]">Registered students and lecturers can also use Contact Support from their dashboard.</p><button type="submit" disabled={sending || verificationBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50">{sending ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {sending ? 'Sending request…' : 'Send support request'}</button></div>
          </form>

          <section className="mt-9 border-t border-[#E5E7EB] pt-7">
            <h2 className="text-lg font-bold text-[#091F5B]">Other ways we can help</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {contactTopics.map(([heading, detail]) => <li key={heading} className="rounded-xl border border-[#E5EAF4] bg-[#F8FAFD] p-3 text-sm leading-6 text-[#374151]"><strong className="text-[#091F5B]">{heading}:</strong> {detail}</li>)}
            </ul>
            {emailReady && <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#5C6982]"><Mail size={16}/>{contactEmail}</p>}
          </section>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Your Academic Resources. One Central Destination.</p>
      </div>
    </main>
  );
}
