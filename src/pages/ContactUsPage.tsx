import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/brand/BrandLogo';
import { contactApi } from '../api/contact';

const categories = [
  { value: 'general', label: 'General enquiry' },
  { value: 'technical', label: 'Technical question' },
  { value: 'academic', label: 'Academic resources' },
  { value: 'payments', label: 'Purchases and payments' },
  { value: 'lecturer', label: 'Lecturer and contributor enquiry' },
  { value: 'copyright', label: 'Copyright and content removal' },
  { value: 'privacy', label: 'Privacy and data protection' },
  { value: 'partnerships', label: 'Partnerships and institutional collaboration' },
  { value: 'feedback', label: 'Feedback and suggestions' },
  { value: 'other', label: 'Other' },
];

export function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setConfirmation('');
    setSending(true);
    try {
      const result = await contactApi.submit({
        name: name.trim(),
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        website,
      });
      setConfirmation(result.message);
      setName('');
      setEmail('');
      setCategory('general');
      setSubject('');
      setMessage('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your enquiry could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#1F2937] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="full" tone="dark" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C36D9] hover:text-[#6121D0]"><ArrowLeft size={16} /> Back to home</Link>
        </header>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Contact Sophis Central</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B] sm:text-4xl">How can we help?</h1>
          <p className="mt-4 text-sm leading-7 text-[#374151] sm:text-base">Have a question, suggestion, partnership idea or general enquiry? Submit it here without an account. It will become a Support ticket, and our team will reply to the email address you provide.</p>

          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {confirmation && <div role="status" aria-live="polite" className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={19} className="mt-0.5 shrink-0"/><p>{confirmation}</p></div>}

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Your name *</span><input required minLength={2} maxLength={120} value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Full name" className="brand-input"/></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Email address *</span><input required type="email" maxLength={320} value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="brand-input"/></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Enquiry category *</span><select value={category} onChange={event => setCategory(event.target.value)} className="brand-input">{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Subject *</span><input required minLength={4} maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="Briefly describe your enquiry" className="brand-input"/></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Your message *</span><textarea required minLength={10} maxLength={10000} rows={7} value={message} onChange={event => setMessage(event.target.value)} placeholder="Tell us how we can help. Please include relevant context, but never include passwords, one-time passcodes or full payment-card details." className="brand-input"/><span className="mt-1 block text-right text-xs text-[#71809A]">{message.length}/10,000</span></label>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label></div>
            <div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-xs leading-5 text-[#5C6982]"><div className="flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#6121D0]"/><p>This form creates a guest Support ticket visible to the Support team. Keep the ticket number from the confirmation and watch your email for a reply. Registered students and lecturers may also submit and track tickets after signing in.</p></div></div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="inline-flex items-center gap-2 text-xs text-[#71809A]"><Mail size={14}/> Guest ticket intake — no account required.</p><button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50">{sending ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {sending ? 'Sending enquiry…' : 'Send enquiry'}</button></div>
          </form>
        </article>
        <p className="mt-6 text-center text-xs text-[#71809A]">Sophis Central — Your Academic Resources. One Central Destination.</p>
      </div>
    </main>
  );
}
