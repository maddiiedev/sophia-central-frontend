import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, FileImage, Link2, LifeBuoy, Loader2, Paperclip, Send, ExternalLink, RefreshCw } from 'lucide-react';
import { supportApi, type SupportRequest } from '../api/support';
import { supportAttachmentApi } from '../api/upload';
import { useAuth } from '../context/AuthContext';

const categories = [
  { value: 'account', label: 'Account access' },
  { value: 'profile', label: 'Profile and settings' },
  { value: 'resources', label: 'Academic resources' },
  { value: 'payments', label: 'Wallet and payments' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'other', label: 'Other' },
];

export function SupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [description, setDescription] = useState('');
  const [linkText, setLinkText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supportApi.mine();
      setRequests(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your support requests.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Each image must be smaller than 5 MB.');
      return;
    }
    if (attachments.length >= 5) {
      setError('You can attach up to five images.');
      return;
    }
    setUploading(true); setError('');
    try {
      const result = await supportAttachmentApi.upload(file);
      setAttachments(current => [...current, result.url]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to upload this image.');
    } finally { setUploading(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setConfirmation('');
    const links = linkText.split('\n').map(value => value.trim()).filter(Boolean);
    if (links.length > 5) { setError('Add no more than five links.'); return; }
    if (links.some(value => { try { const url = new URL(value); return !['http:', 'https:'].includes(url.protocol); } catch { return true; } })) {
      setError('Enter valid links beginning with https:// or http://.');
      return;
    }
    setSending(true);
    try {
      const result = await supportApi.create({ subject: subject.trim(), category, description: description.trim(), links, attachments });
      setConfirmation(result.confirmationMessage || 'Your message has been sent to Support. Our administration team will review your request and update you through notifications.');
      setSubject(''); setCategory('technical'); setDescription(''); setLinkText(''); setAttachments([]);
      await loadRequests();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send your support request. Please try again.');
    } finally { setSending(false); }
  };

  const displayName = user?.firstName || user?.name || 'there';

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Help centre</p><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Contact support</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">Hi {displayName}, tell our administration team what you need help with. You can include useful links and screenshots to help us understand the issue.</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3"><span className="rounded-xl bg-[#F3F0FF] p-3 text-[#6121D0]"><LifeBuoy size={21}/></span><div><h3 className="font-bold text-[#091F5B]">Submit a support request</h3><p className="mt-1 text-sm text-[#5C6982]">Fields marked with * are required. Your account details are attached automatically.</p></div></div>
      {confirmation && <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={19} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Message sent to Support</p><p className="mt-1 leading-6">{confirmation}</p></div></div>}
      {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="shrink-0"/>{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Subject *</span><input required minLength={4} maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="Briefly describe the issue" className="brand-input"/></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Issue category *</span><select value={category} onChange={event => setCategory(event.target.value)} className="brand-input">{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Describe the problem *</span><textarea required minLength={10} maxLength={10000} rows={6} value={description} onChange={event => setDescription(event.target.value)} placeholder="What happened? What were you trying to do? Include any error message and the steps that led to it." className="brand-input"/><span className="mt-1 block text-right text-xs text-[#71809A]">{description.length}/10,000</span></label>
        <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#091F5B]"><Link2 size={16}/> Helpful links (optional)</span><textarea rows={3} value={linkText} onChange={event => setLinkText(event.target.value)} placeholder="Paste one link per line (e.g. the page where the issue occurred)" className="brand-input"/></label>
        <div><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#091F5B]"><Paperclip size={16}/> Screenshots or images (optional)</span><label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#C9D3E3] bg-[#F8FAFD] px-4 py-6 text-center transition hover:border-[#6121D0]"><FileImage size={22} className="mb-2 text-[#6121D0]"/><span className="text-sm font-semibold text-[#091F5B]">{uploading ? 'Uploading image…' : 'Choose an image'}</span><span className="mt-1 text-xs text-[#71809A]">JPG, PNG or WebP · Up to 5 MB each · Maximum 5 images</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading || attachments.length >= 5} onChange={event => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ''; }}/></label>
          {attachments.length > 0 && <ul className="mt-3 space-y-2">{attachments.map((url,index) => <li key={url} className="flex items-center justify-between gap-3 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm"><a href={url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-medium text-[#6121D0]">Attached image {index+1}</a><button type="button" onClick={() => setAttachments(current => current.filter(item => item !== url))} className="text-xs font-semibold text-rose-700">Remove</button></li>)}</ul>}
        </div>
        <div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-xs leading-5 text-[#5C6982]">Your request will be linked to your account: {user?.name || [user?.firstName,user?.lastName].filter(Boolean).join(' ')} · {user?.email} · {user?.role}. Please do not include passwords or other sensitive login information.</div>
        <div className="flex justify-end"><button type="submit" disabled={sending || uploading} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50">{sending ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {sending ? 'Sending request…' : 'Send to support'}</button></div>
      </form>
    </section>
    <section className="glass-panel p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-[#091F5B]">Your support requests</h3><p className="mt-1 text-sm text-[#5C6982]">Track the status of requests you have sent.</p></div><button type="button" onClick={() => void loadRequests()} disabled={loading} aria-label="Refresh support requests" className="rounded-xl border border-[#DCE4EF] p-2 text-[#091F5B] hover:border-[#6121D0]"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button></div>
      <div className="mt-4 space-y-3">{loading ? <p className="rounded-xl bg-[#F8FAFD] p-4 text-sm text-[#5C6982]">Loading requests…</p> : requests.length === 0 ? <p className="rounded-xl bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">You have not sent a support request yet.</p> : requests.map(request => <article key={request.id} className="rounded-xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold text-[#091F5B]">{request.subject}</h4><p className="mt-1 text-xs capitalize text-[#71809A]">{request.category.replace('_',' ')} · {new Date(request.createdAt).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'concluded' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{request.status === 'concluded' ? 'Concluded' : 'Pending review'}</span></div>{request.status === 'concluded' && request.resolutionMessage && <p className="mt-3 rounded-lg bg-[#F3F6FC] p-3 text-sm leading-6 text-[#374151]">{request.resolutionMessage}</p>}</article>)}</div>
    </section>
  </div>;
}
