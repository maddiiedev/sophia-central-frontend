import { useEffect, useMemo, useState } from 'react';
import { Flag, RefreshCw, History, UserCheck, AlertTriangle, Search, ChevronLeft, ChevronRight, Clock3, ShieldAlert } from 'lucide-react';
import { reportsApi, type ContentReport, type ContentReportStatus, type ReportSeverity } from '../../api/reports';
import { useAuth } from '../../context/AuthContext';

const statuses: Array<{ value: ContentReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All reports' }, { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Under review' }, { value: 'actioned', label: 'Actioned' }, { value: 'dismissed', label: 'Dismissed' },
];
const label = (value: string) => value.replace(/_/g, ' ');
const PAGE_SIZE = 10;
const severityStyle: Record<ReportSeverity, string> = {
  low: 'bg-slate-100 text-slate-700', normal: 'bg-blue-50 text-blue-800',
  high: 'bg-amber-50 text-amber-900', critical: 'bg-rose-50 text-rose-900',
};

export function ContentReportsPanel() {
  const { user } = useAuth();
  const isModerator = user?.role === 'moderator';
  const [items, setItems] = useState<ContentReport[]>([]);
  const [filter, setFilter] = useState<ContentReportStatus | 'all'>('pending');
  const [ownership, setOwnership] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignmentReasons, setAssignmentReasons] = useState<Record<string, string>>({});
  const [severityReasons, setSeverityReasons] = useState<Record<string, string>>({});
  const [severityValues, setSeverityValues] = useState<Record<string, ReportSeverity>>({});
  const [history, setHistory] = useState<Record<string, Awaited<ReturnType<typeof reportsApi.history>>>>({});
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const queue = await reportsApi.moderationQueue(filter, {
        assignedToMe: ownership === 'mine',
        unassigned: ownership === 'unassigned',
        severity: severityFilter === 'all' ? undefined : severityFilter,
      });
      setItems(Array.isArray(queue) ? queue : []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load reports.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [filter, ownership, severityFilter]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter(item => !term || [item.ticketNumber, item.targetLabel, item.targetType, item.reason, item.details, item.moderatorNote, item.assignedModerator?.firstName, item.assignedModerator?.lastName, item.assignedModerator?.email].filter(Boolean).join(' ').toLowerCase().includes(term)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [items, query]);
  const pendingCount = items.filter(item => item.status === 'pending').length;
  const reviewingCount = items.filter(item => item.status === 'reviewing').length;
  const criticalCount = items.filter(item => item.severity === 'critical').length;
  const unassignedCount = items.filter(item => !item.assignedModeratorId && item.escalatedToRole !== 'admin' && item.status !== 'actioned' && item.status !== 'dismissed').length;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [query]);

  const claim = async (item: ContentReport) => {
    const reason = (assignmentReasons[item.id] ?? '').trim();
    if (reason.length < 5) { setError('Give a short reason for claiming this report.'); return; }
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await reportsApi.claim(item.id, reason);
      setAssignmentReasons(current => ({ ...current, [item.id]: '' }));
      setNotice(`You claimed report ${item.ticketNumber || item.id}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to claim this report.'); }
    finally { setBusyId(null); }
  };

  const update = async (item: ContentReport, status: ContentReportStatus) => {
    const note = (notes[item.id] ?? '').trim();
    if ((status === 'actioned' || status === 'dismissed') && note.length < 5) { setError('Add a clear moderator note before closing a report.'); return; }
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await reportsApi.update(item.id, status, note || undefined);
      setNotice(`Report updated to ${label(status)}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update this report.'); }
    finally { setBusyId(null); }
  };

  const changeSeverity = async (item: ContentReport) => {
    const severity = severityValues[item.id] ?? item.severity ?? 'normal';
    const reason = (severityReasons[item.id] ?? '').trim();
    if (reason.length < 5) { setError('Explain why this report needs a priority change.'); return; }
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await reportsApi.setSeverity(item.id, severity, reason);
      setSeverityReasons(current => ({ ...current, [item.id]: '' }));
      setNotice(`Report priority set to ${severity}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update report priority.'); }
    finally { setBusyId(null); }
  };

  const toggleHistory = async (id: string) => {
    const next = !historyOpen[id];
    setHistoryOpen(current => ({ ...current, [id]: next }));
    if (next && !history[id]) {
      try {
        const caseEvents = await reportsApi.history(id);
        setHistory(current => ({ ...current, [id]: caseEvents }));
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load case history.'); }
    }
  };

  return <section className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#64748B]">Manage reports about accounts, academic resources and chat messages.</p>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B] disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <article className="rounded-xl border border-[#DCE4EF] bg-white p-3"><p className="flex items-center gap-1 text-xs text-[#64748B]"><Clock3 size={14}/> Pending in current view</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{pendingCount}</p></article>
      <article className="rounded-xl border border-[#DCE4EF] bg-white p-3"><p className="flex items-center gap-1 text-xs text-[#64748B]"><UserCheck size={14}/> Under review</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{reviewingCount}</p></article>
      <article className="rounded-xl border border-rose-200 bg-white p-3"><p className="flex items-center gap-1 text-xs text-rose-700"><ShieldAlert size={14}/> Critical priority</p><p className="mt-1 text-2xl font-bold text-rose-800">{criticalCount}</p></article>
      <article className="rounded-xl border border-amber-200 bg-white p-3"><p className="flex items-center gap-1 text-xs text-amber-800"><Flag size={14}/> Unassigned active</p><p className="mt-1 text-2xl font-bold text-amber-900">{unassignedCount}</p></article>
    </div>
    <p className="text-xs text-[#64748B]">Metrics reflect the currently selected status, ownership and priority filters.</p>
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reports by status">{statuses.map(item => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${filter === item.value ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#475569]'}`}>{item.label}</button>)}</div>
      {isModerator && <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reports by ownership">{[{value:'all',label:'All cases'},{value:'mine',label:'Assigned to me'},{value:'unassigned',label:'Unassigned'}].map(option => <button key={option.value} type="button" onClick={() => setOwnership(option.value as typeof ownership)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${ownership === option.value ? 'border-slate-700 bg-slate-800 text-white' : 'border-[#DCE4EF] bg-white text-[#475569]'}`}>{option.label}</button>)}</div>}
      <div className="flex flex-col gap-2 sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2"><Search size={15} className="text-[#64748B]"/><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Search report queue" placeholder="Search ticket, target, reason or assignee…" className="w-full min-w-0 bg-transparent text-sm outline-none"/></label><label className="flex items-center gap-2 text-xs font-semibold text-[#475569]">Priority<select value={severityFilter} onChange={event => setSeverityFilter(event.target.value as ReportSeverity | 'all')} className="rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-xs"><option value="all">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label></div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {loading ? <p className="rounded-xl border border-[#DCE4EF] p-5 text-sm text-[#64748B]">Loading reports…</p> : filteredItems.length === 0 ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-9 text-center"><Flag className="mx-auto text-[#6121D0]" size={24}/><p className="mt-2 font-semibold text-[#091F5B]">No reports in this view</p><p className="mt-1 text-sm text-[#64748B]">Adjust the filters or search terms to find reports.</p></div> :
      <div className="space-y-3">{pageItems.map(item => {
        const reporter = item.reporter ? [item.reporter.firstName, item.reporter.lastName].filter(Boolean).join(' ') || item.reporter.email || item.reporter.academicHandle : 'Deleted account';
        const isOpen = item.status !== 'actioned' && item.status !== 'dismissed';
        const isAssignedToMe = item.assignedModeratorId === user?.id;
        const canWork = isModerator && isOpen && item.escalatedToRole !== 'admin' && isAssignedToMe;
        const canClaim = isModerator && isOpen && item.escalatedToRole !== 'admin' && !item.assignedModeratorId;
        const severity = item.severity ?? 'normal';
        return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-[#6121D0]">{label(item.targetType)} · {label(item.reason)}</p><h3 className="mt-1 break-words text-base font-bold text-[#091F5B]">{item.targetLabel}</h3><p className="mt-1 text-xs text-[#64748B]">Reported by {reporter} · {new Date(item.createdAt).toLocaleString()}</p><p className="mt-1 text-xs font-medium text-[#64748B]">Ticket: {item.ticketNumber || item.id}</p></div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-800">{label(item.status)}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${severityStyle[severity]}`}>{severity}</span></div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-[#64748B] sm:grid-cols-2"><p>Assigned to: <strong className="text-[#334155]">{item.assignedModerator ? [item.assignedModerator.firstName, item.assignedModerator.lastName].filter(Boolean).join(' ') || item.assignedModerator.email : 'Unassigned'}</strong></p><p>Last updated: {new Date(item.updatedAt).toLocaleString()}</p></div>
          {item.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">{item.details}</p>}
          <details className="mt-3 rounded-xl bg-[#F8FAFD] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#475569]">Reported item snapshot</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-[#475569]">{JSON.stringify(item.targetSnapshot, null, 2)}</pre></details>
          {item.moderatorNote && <p className="mt-3 rounded-xl border border-[#DCE4EF] p-3 text-sm text-[#475569]"><strong>Previous note:</strong> {item.moderatorNote}</p>}
          {item.escalatedToRole === 'admin' && <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0"/> With Admin{item.escalatedAt ? ` · ${new Date(item.escalatedAt).toLocaleString()}` : ''}. Moderator changes are disabled until Admin returns the case.</p>}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EEF1F6] pt-3">
            <button type="button" onClick={() => void toggleHistory(item.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#475569]"><History size={14}/>{historyOpen[item.id] ? 'Hide case history' : 'Case history'}</button>
            {canClaim && <div className="w-full space-y-2 rounded-xl bg-[#F8FAFD] p-3"><label className="block text-xs font-semibold text-[#475569]">Reason for claiming this case<input value={assignmentReasons[item.id] ?? ''} onChange={event => setAssignmentReasons(current => ({...current,[item.id]:event.target.value}))} maxLength={1000} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Why are you taking ownership of this report?"/></label><button type="button" disabled={busyId === item.id} onClick={() => void claim(item)} className="inline-flex items-center gap-2 rounded-lg bg-[#091F5B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><UserCheck size={14}/>Claim report</button></div>}
            {canWork && <div className="w-full space-y-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end"><label className="text-xs font-semibold text-[#475569]">Priority<select value={severityValues[item.id] ?? severity} onChange={event => setSeverityValues(current => ({...current,[item.id]:event.target.value as ReportSeverity}))} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label><label className="text-xs font-semibold text-[#475569]">Reason for priority change<input value={severityReasons[item.id] ?? ''} onChange={event => setSeverityReasons(current => ({...current,[item.id]:event.target.value}))} maxLength={1000} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Explain the priority"/></label><button type="button" disabled={busyId === item.id || (severityValues[item.id] ?? severity) === severity} onClick={() => void changeSeverity(item)} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#475569] disabled:opacity-50">Save priority</button></div>
              <label className="block text-xs font-semibold text-[#475569]">Moderator note <span className="font-normal">(required to close)</span><textarea rows={2} maxLength={2000} value={notes[item.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Record what was reviewed and the outcome." className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm outline-none focus:border-[#6121D0]"/></label>
              <div className="flex flex-wrap gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'reviewing')} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#475569] disabled:opacity-50">Keep under review</button><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'actioned')} className="rounded-lg bg-[#6121D0] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Mark actioned</button><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'dismissed')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50">Dismiss report</button></div>
            </div>}
            {isModerator && isOpen && item.escalatedToRole !== 'admin' && item.assignedModeratorId && !isAssignedToMe && <p className="text-xs text-[#64748B]">This case belongs to another Moderator. Ask Admin to reassign it if a transfer is needed.</p>}
          </div>
          {historyOpen[item.id] && <div className="mt-3 rounded-xl bg-[#F8FAFD] p-3"><h4 className="text-sm font-semibold text-[#091F5B]">Case activity</h4>{!history[item.id] ? <p className="mt-2 text-xs text-[#64748B]">Loading activity…</p> : history[item.id].length === 0 ? <p className="mt-2 text-xs text-[#64748B]">No case events recorded yet.</p> : <ol className="mt-2 space-y-2">{history[item.id].map(event => <li key={event.id} className="border-l-2 border-[#C4B5FD] pl-3"><p className="text-xs font-semibold capitalize text-[#334155]">{label(event.eventType)}{event.actorEmail ? ` · ${event.actorEmail}` : ''}</p><p className="text-xs text-[#64748B]">{event.reason}</p><p className="text-[11px] text-[#94A3B8]">{new Date(event.createdAt).toLocaleString()}</p></li>)}</ol>}</div>}
        </article>;
      })}
      <div className="flex flex-col gap-2 border-t border-[#EEF1F6] pt-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#64748B]">Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of {filteredItems.length} reports</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={currentPage <= 1} className="inline-flex items-center gap-1 rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold disabled:opacity-40"><ChevronLeft size={14}/> Previous</button><span className="text-xs text-[#64748B]">Page {currentPage} of {pageCount}</span><button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount} className="inline-flex items-center gap-1 rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold disabled:opacity-40">Next <ChevronRight size={14}/></button></div></div></div>}
  </section>;
}
