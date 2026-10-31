import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ExternalLink, FileImage, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { supportApi, type SupportRequest, type SupportRequestStatus } from '../../api/support';

export function SupportRequestsPanel() {
  const [status, setStatus] = useState<SupportRequestStatus>('pending');
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await supportApi.moderationList(status)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load support requests.'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const conclude = async (item: SupportRequest) => {
    const message = (resolution[item.id] || '').trim();
    if (message.length < 10) { setError('Write a resolution message of at least 10 characters before concluding this request.'); return; }
    if (processingId) return;
    setProcessingId(item.id); setError(''); setNotice('');
    try {
      await supportApi.conclude(item.id, message);
      setItems(current => current.filter(request => request.id !== item.id));
      setResolution(current => { const next = { ...current }; delete next[item.id]; return next; });
      setNotice('Support request concluded. A resolution notification has been sent to the user.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to conclude this request.');
    } finally { setProcessingId(null); }
  };

  const accountName = (user?: SupportRequest['user']) =>
    user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Unknown account';

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Administration</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Support requests</h2><p className="mt-1 text-sm text-[#5C6982]">Review user issues, record the outcome and notify the account owner.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#091F5B] hover:border-[#6121D0]"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button></div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Support request status"><button type="button" role="tab" aria-selected={status === 'pending'} onClick={() => { setStatus('pending'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'pending' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Pending</button><button type="button" role="tab" aria-selected={status === 'concluded'} onClick={() => { setStatus('concluded'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'concluded' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Concluded</button></div>
    <div className="space-y-4">{loading ? <p className="rounded-xl bg-[#F8FAFD] p-6 text-sm text-[#5C6982]">Loading support requests…</p> : items.length === 0 ? <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-8 text-center"><ShieldCheck size={24} className="mx-auto text-[#6121D0]"/><p className="mt-3 font-semibold text-[#091F5B]">No {status} support requests</p><p className="mt-1 text-sm text-[#5C6982]">New requests from students and lecturers will appear here.</p></div> : items.map(item => {
      const owner = item.user;
      const busy = processingId === item.id;
      return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-base font-bold text-[#091F5B]">{item.subject}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'concluded' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{item.status === 'concluded' ? 'Concluded' : 'Pending'}</span></div><p className="mt-1 text-xs capitalize text-[#71809A]">{item.category} · Submitted {new Date(item.createdAt).toLocaleString()}</p></div></div>
        <div className="mt-4 rounded-xl bg-[#F8FAFD] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2C36D9] text-sm font-bold text-white">{owner?.profileImage ? <img src={owner.profileImage} alt="" className="h-full w-full object-cover"/> : accountName(owner).slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="font-semibold text-[#091F5B]">{accountName(owner)}</p><p className="break-all text-xs text-[#5C6982]">{owner?.email || 'Email unavailable'} · <span className="capitalize">{owner?.role || 'user'}</span></p></div></div><dl className="mt-3 grid gap-2 text-xs text-[#5C6982] sm:grid-cols-3"><div><dt className="inline font-semibold text-[#091F5B]">Institution: </dt><dd className="inline">{owner?.institution || 'Not provided'}</dd></div><div><dt className="inline font-semibold text-[#091F5B]">Faculty: </dt><dd className="inline">{owner?.faculty || 'Not provided'}</dd></div><div><dt className="inline font-semibold text-[#091F5B]">Department: </dt><dd className="inline">{owner?.department || 'Not provided'}</dd></div><div><dt className="inline font-semibold text-[#091F5B]">Account ID: </dt><dd className="inline break-all">{owner?.id || item.userId}</dd></div></dl></div>
        <div className="mt-4"><h4 className="text-sm font-semibold text-[#091F5B]">Problem description</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4B5563]">{item.description}</p></div>
        {item.links?.length > 0 && <div className="mt-4"><h4 className="text-xs font-semibold uppercase tracking-wide text-[#5C6982]">Related links</h4><ul className="mt-2 space-y-1">{item.links.map(link => <li key={link}><a href={link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-[#6121D0] underline underline-offset-2">{link}<ExternalLink size={13} className="shrink-0"/></a></li>)}</ul></div>}
        {item.attachments?.length > 0 && <div className="mt-4"><h4 className="text-xs font-semibold uppercase tracking-wide text-[#5C6982]">Attachments</h4><div className="mt-2 flex flex-wrap gap-3">{item.attachments.map((url,index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#6121D0]"><FileImage size={15}/> Image {index+1}<ExternalLink size={13}/></a>)}</div></div>}
        {item.status === 'concluded' ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 size={16}/> Resolution sent to user</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{item.resolutionMessage}</p><p className="mt-2 text-xs text-emerald-800">Concluded {item.concludedAt ? new Date(item.concludedAt).toLocaleString() : ''} · Reviewer: {item.reviewer?.email || [item.reviewer?.firstName,item.reviewer?.lastName].filter(Boolean).join(' ') || 'Administration'}</p></div> : <div className="mt-5 border-t border-[#E5E7EB] pt-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Resolution message to user *</span><textarea rows={3} minLength={10} maxLength={3000} value={resolution[item.id] || ''} onChange={event => setResolution(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Explain what was reviewed, the resolution, or the next steps taken…" className="brand-input"/></label><div className="mt-3 flex justify-end"><button type="button" onClick={() => void conclude(item)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2C36D9] disabled:opacity-50">{busy ? <Clock3 size={15}/> : <Send size={15}/>} {busy ? 'Sending…' : 'Mark concluded & notify user'}</button></div></div>}
      </article>;
    })}</div>
  </section>;
}
