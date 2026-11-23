import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ExternalLink, FileImage, RefreshCw, Send, ShieldCheck, Search, MailCheck, MailX } from 'lucide-react';
import { supportApi, type SupportRequest, type SupportRequestStatus, type SupportEmailStatus } from '../../api/support';
import { ProfileImage } from '../ProfileImage';

export function SupportRequestsPanel() {
  const [status, setStatus] = useState<SupportRequestStatus | 'history'>('pending');
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [queueStats, setQueueStats] = useState({ pending: 0, underReview: 0, reviewed: 0, responded: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [emailStatus, setEmailStatus] = useState<SupportEmailStatus | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; firstName?: string; lastName?: string; email: string }[]>([]);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [caseNotes, setCaseNotes] = useState<Record<string, { id: string; authorEmail: string; body: string; createdAt: string }[]>>({});
  const [caseTimeline, setCaseTimeline] = useState<Record<string, { id: string; actorEmail: string; eventType: string; details: Record<string, unknown>; createdAt: string }[]>>({});
  const [caseActionId, setCaseActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    void supportApi.emailStatus().then(setEmailStatus).catch(() => setEmailStatus(null));
    void supportApi.caseAssignees().then(setAssignees).catch(() => setAssignees([]));
    try {
      const pending = await supportApi.queue('pending');
      const underReview = await supportApi.queue('under_review');
      const reviewed = await supportApi.queue('reviewed');
      const responseSent = await supportApi.queue('response_sent');
      const concluded = await supportApi.queue('concluded');
      setPendingCount(pending.length);
      setQueueStats({ pending: pending.length, underReview: underReview.length, reviewed: reviewed.length, responded: responseSent.length + concluded.length });
      if (status === 'history') {
        setItems([...pending, ...underReview, ...reviewed, ...responseSent, ...concluded].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else if (status === 'pending') setItems(pending);
      else setItems(await supportApi.queue(status));
    }
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
      const result = await supportApi.conclude(item.id, message);
      setItems(current => current.filter(request => request.id !== item.id));
      if (item.status === 'pending') setPendingCount(current => Math.max(0, current - 1));
      setResolution(current => { const next = { ...current }; delete next[item.id]; return next; });
      setNotice(result.responseEmailSent ? 'Response saved and email notification sent. Registered users can read the full response in My Activity.' : 'Response saved, but email notification was not confirmed. Check the Support email configuration; the response remains recorded in the workspace.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to conclude this request.');
    } finally { setProcessingId(null); }
  };


  const toggleCaseDetails = async (id: string) => {
    if (expandedCaseId === id) { setExpandedCaseId(null); return; }
    setExpandedCaseId(id);
    try {
      const [notes, timeline] = await Promise.all([supportApi.getInternalNotes(id), supportApi.getCaseTimeline(id)]);
      setCaseNotes(current => ({ ...current, [id]: notes }));
      setCaseTimeline(current => ({ ...current, [id]: timeline }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load private case history.');
    }
  };

  const saveInternalNote = async (item: SupportRequest) => {
    const body = (noteDraft[item.id] || '').trim();
    if (!body || caseActionId) return;
    setCaseActionId(item.id); setError('');
    try {
      await supportApi.addInternalNote(item.id, body);
      const [notes, timeline] = await Promise.all([supportApi.getInternalNotes(item.id), supportApi.getCaseTimeline(item.id)]);
      setCaseNotes(current => ({ ...current, [item.id]: notes }));
      setCaseTimeline(current => ({ ...current, [item.id]: timeline }));
      setNoteDraft(current => ({ ...current, [item.id]: '' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save internal note.');
    } finally { setCaseActionId(null); }
  };

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item => [item.ticketNumber, item.id, item.subject, item.category, item.description, item.senderName, item.senderEmail, item.senderInstitution, item.senderFaculty, item.senderDepartment, item.user?.email, item.user?.firstName, item.user?.lastName, item.user?.name].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [items, query]);

  const accountName = (item: SupportRequest) =>
    item.user?.name || [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || item.senderName || item.user?.email || item.senderEmail || 'Visitor';

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Sophis Central Support</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Support requests</h2><p className="mt-1 text-sm text-[#5C6982]">Review registered-account and guest requests, record resolutions and keep the support conversation history together.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#091F5B] hover:border-[#6121D0]"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button></div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Support queue overview">
      {[{label:'Submitted',value:queueStats.pending,description:'Awaiting review',tone:'amber'},{label:'Under review',value:queueStats.underReview,description:'Being handled',tone:'blue'},{label:'Reviewed',value:queueStats.reviewed,description:'Ready for response',tone:'violet'},{label:'Responded',value:queueStats.responded,description:'Response sent',tone:'emerald'}].map(card=><div key={card.label} className="min-w-0 rounded-2xl border border-[#DCE4EF] bg-white p-3 sm:p-4"><p className="text-xs font-medium text-[#5C6982]">{card.label}</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{card.value}</p><p className="mt-1 text-xs text-[#71809A]">{card.description}</p></div>)}
    </div>
    <div className="flex items-start gap-3 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
      {emailStatus?.configured ? <MailCheck size={19} className="mt-0.5 shrink-0 text-emerald-700"/> : <MailX size={19} className="mt-0.5 shrink-0 text-amber-700"/>}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#091F5B]">{emailStatus?.configured ? 'Support email notifications are enabled' : 'Support email notifications are unavailable'}</p>
        <p className="mt-1 text-xs leading-5 text-[#5C6982]">{emailStatus?.configured ? 'Users can receive email updates about their support requests.' : 'Support requests remain available for review in this workspace.'}</p>
      </div>
    </div>
    <label className="flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5">
      <Search size={17} className="shrink-0 text-[#71809A]"/>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search ticket, requester, email, subject or category…" aria-label="Search support requests" className="w-full text-sm outline-none"/>
    </label>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Support request views"><button type="button" role="tab" aria-selected={status === 'pending'} onClick={() => { setStatus('pending'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'pending' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`} >Submitted ({pendingCount})</button><button type="button" role="tab" aria-selected={status === 'under_review'} onClick={() => { setStatus('under_review'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'under_review' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Under review</button><button type="button" role="tab" aria-selected={status === 'reviewed'} onClick={() => { setStatus('reviewed'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'reviewed' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Reviewed</button><button type="button" role="tab" aria-selected={status === 'response_sent'} onClick={() => { setStatus('response_sent'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'response_sent' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Response sent</button><button type="button" role="tab" aria-selected={status === 'history'} onClick={() => { setStatus('history'); setNotice(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${status === 'history' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Request history</button></div>
    <div className="space-y-4">{loading ? <p className="rounded-xl bg-[#F8FAFD] p-6 text-sm text-[#5C6982]">Loading support requests…</p> : visibleItems.length === 0 ? <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-8 text-center"><ShieldCheck size={24} className="mx-auto text-[#6121D0]"/><p className="mt-3 font-semibold text-[#091F5B]">{items.length === 0 ? (status === 'history' ? 'No support request history' : `No ${status} support requests`) : 'No matching support requests'}</p><p className="mt-1 text-sm text-[#5C6982]">Registered student/lecturer tickets and guest Contact Us enquiries appear in this workspace.</p></div> : visibleItems.map(item => {
      const owner = item.user;
      const requesterName = accountName(item);
      const requesterEmail = owner?.email || item.senderEmail || 'Email unavailable';
      const requesterRole = owner?.role || item.senderAccountType || 'visitor';
      const busy = processingId === item.id;
      return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-base font-bold text-[#091F5B]">{item.subject}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'response_sent' || item.status === 'concluded' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{item.status === 'response_sent' || item.status === 'concluded' ? 'Response sent' : item.status === 'reviewed' ? 'Reviewed' : item.status === 'under_review' ? 'Under review' : 'Submitted'}</span></div><p className="mt-1 text-xs capitalize text-[#71809A]">{item.category} · Submitted {new Date(item.createdAt).toLocaleString()}</p><p className="mt-1 break-all text-[11px] text-[#71809A]">Ticket: {item.ticketNumber || item.id}</p></div></div>
        <div className="mt-4 grid gap-3 rounded-xl border border-[#E7E1F5] bg-[#FBFAFF] p-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#091F5B]">Priority
            <select value={item.priority || 'normal'} onChange={async event => { try { await supportApi.setCasePriority(item.id, event.target.value as 'low' | 'normal' | 'high' | 'urgent'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update priority.'); } }} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm">
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#091F5B]">Assigned Support agent
            <select value={item.assignedSupportId || ''} onChange={async event => { try { await supportApi.assignCase(item.id, event.target.value || null); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to assign case.'); } }} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm">
              <option value="">Unassigned</option>{assignees.map(agent => <option key={agent.id} value={agent.id}>{[agent.firstName, agent.lastName].filter(Boolean).join(' ') || agent.email}</option>)}
            </select>
          </label>
          <div className="text-xs text-[#5C6982] sm:col-span-2">
            <span className="font-semibold text-[#091F5B]">SLA target: </span>{item.slaDueAt ? new Date(item.slaDueAt).toLocaleString() : 'Not set'}
            {item.overdue && <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 font-semibold text-rose-800">Overdue</span>}
          </div>
          <button type="button" onClick={() => void toggleCaseDetails(item.id)} className="justify-self-start rounded-lg border border-[#D8C9F4] px-3 py-2 text-xs font-semibold text-[#6121D0] sm:col-span-2">{expandedCaseId === item.id ? 'Hide internal notes & case history' : 'Internal notes & case history'}</button>
          {expandedCaseId === item.id && <div className="space-y-3 sm:col-span-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">Private internal notes — visible only to authorized Support staff</p>
              <textarea rows={2} maxLength={4000} value={noteDraft[item.id] || ''} onChange={event => setNoteDraft(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Add an internal handover or investigation note…" className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2 text-sm"/>
              <button type="button" disabled={!noteDraft[item.id]?.trim() || caseActionId === item.id} onClick={() => void saveInternalNote(item)} className="mt-2 rounded-lg bg-[#6121D0] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{caseActionId === item.id ? 'Saving…' : 'Add private note'}</button>
              <div className="mt-3 space-y-2">{(caseNotes[item.id] || []).map(note => <div key={note.id} className="rounded-lg bg-white p-2"><p className="whitespace-pre-wrap text-sm text-[#091F5B]">{note.body}</p><p className="mt-1 text-[11px] text-[#71809A]">{note.authorEmail} · {new Date(note.createdAt).toLocaleString()}</p></div>)}{(caseNotes[item.id] || []).length === 0 && <p className="text-xs text-amber-800">No internal notes yet.</p>}</div>
            </div>
            <div className="rounded-lg border border-[#DCE4EF] p-3"><p className="text-xs font-bold text-[#091F5B]">Case activity timeline</p><ol className="mt-2 space-y-2">{(caseTimeline[item.id] || []).map(event => <li key={event.id} className="border-l-2 border-[#D8C9F4] pl-3"><p className="text-xs font-semibold text-[#091F5B]">{event.eventType.replace(/_/g, ' ')}</p><p className="text-[11px] text-[#71809A]">{event.actorEmail} · {new Date(event.createdAt).toLocaleString()}</p></li>)}</ol></div>
          </div>}
        </div>
        <div className="mt-4 rounded-xl bg-[#F8FAFD] p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2C36D9] text-sm font-bold text-white">{owner?.profileImage ? <ProfileImage userId={owner.id || item.userId || ''} reference={owner.profileImage} className="h-full w-full object-cover"/> : requesterName.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="font-semibold text-[#091F5B]">{requesterName} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{item.requesterType === "guest" || !owner ? "Guest" : "Registered account"}</span></p><p className="break-all text-xs text-[#5C6982]">{requesterEmail} · <span className="capitalize">{requesterRole}</span></p></div></div><dl className="mt-3 grid gap-2 text-xs text-[#5C6982] sm:grid-cols-3"><div><dt className="inline font-semibold text-[#091F5B]">Institution: </dt><dd className="inline">{owner?.institution || item.senderInstitution || 'Not provided'}</dd></div><div><dt className="inline font-semibold text-[#091F5B]">Faculty: </dt><dd className="inline">{owner?.faculty || item.senderFaculty || 'Not provided'}</dd></div><div><dt className="inline font-semibold text-[#091F5B]">Department: </dt><dd className="inline">{owner?.department || item.senderDepartment || 'Not provided'}</dd></div>{(owner?.id || item.userId) && <div><dt className="inline font-semibold text-[#091F5B]">Account ID: </dt><dd className="inline break-all">{owner?.id || item.userId}</dd></div>}</dl></div>
        <div className="mt-4"><h4 className="text-sm font-semibold text-[#091F5B]">Problem description</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4B5563]">{item.description}</p></div>
        {item.links?.length > 0 && <div className="mt-4"><h4 className="text-xs font-semibold uppercase tracking-wide text-[#5C6982]">Related links</h4><ul className="mt-2 space-y-1">{item.links.map(link => <li key={link}><a href={link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-[#6121D0] underline underline-offset-2">{link}<ExternalLink size={13} className="shrink-0"/></a></li>)}</ul></div>}
        {item.attachments?.length > 0 && <div className="mt-4"><h4 className="text-xs font-semibold uppercase tracking-wide text-[#5C6982]">Attachments</h4><div className="mt-2 flex flex-wrap gap-3">{item.attachments.map((url,index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#6121D0]"><FileImage size={15}/> Image {index+1}<ExternalLink size={13}/></a>)}</div></div>}
        {item.status === 'response_sent' || item.status === 'concluded' ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 size={16}/> Response sent to user</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{item.resolutionMessage}</p><p className="mt-2 text-xs text-emerald-800">Sent {item.concludedAt ? new Date(item.concludedAt).toLocaleString() : ''} · Handled by: {item.reviewer?.email || [item.reviewer?.firstName,item.reviewer?.lastName].filter(Boolean).join(' ') || 'Support'}</p></div> : <div className="mt-4 space-y-4 border-t border-[#E5E7EB] pt-4"><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || item.status !== 'pending'} onClick={async()=>{try{await supportApi.updateStatus(item.id,'under_review');await load();}catch(cause){setError(cause instanceof Error?cause.message:'Unable to update ticket status.');}}} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#091F5B] disabled:opacity-50">Mark under review</button><button type="button" disabled={busy || item.status !== 'under_review'} onClick={async()=>{try{await supportApi.updateStatus(item.id,'reviewed');await load();}catch(cause){setError(cause instanceof Error?cause.message:'Unable to update ticket status.');}}} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#091F5B] disabled:opacity-50">Mark reviewed</button><button type="button" disabled={Boolean(item.escalatedToRole) || busy} onClick={async()=>{const reason=window.prompt('Reason for escalation to Admin?');if(!reason?.trim())return;try{await supportApi.escalate(item.id,'admin',reason);setNotice('Ticket escalated to Admin.');await load();}catch(cause){setError(cause instanceof Error?cause.message:'Unable to escalate ticket.');}}} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50">{item.escalatedToRole ? 'Escalated to Admin' : 'Escalate to Admin'}</button></div><label className="block"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Response to user *</span><textarea rows={3} minLength={10} maxLength={3000} value={resolution[item.id] || ''} onChange={event => setResolution(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Explain what was reviewed, the resolution, or the next steps taken…" className="brand-input"/></label><div className="flex justify-end"><button type="button" onClick={() => void conclude(item)} disabled={busy || item.status !== 'reviewed'} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2C36D9] disabled:opacity-50">{busy ? <Clock3 size={15}/> : <Send size={15}/>} {busy ? 'Sending…' : 'Send response & notify user'}</button></div></div>}
      </article>;
    })}</div>
  </section>;
}
