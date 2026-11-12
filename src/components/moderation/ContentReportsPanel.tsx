import { useEffect, useState } from 'react';
import { Flag, RefreshCw } from 'lucide-react';
import { reportsApi, type ContentReport, type ContentReportStatus } from '../../api/reports';

const statuses: Array<{ value: ContentReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All reports' }, { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Under review' }, { value: 'actioned', label: 'Actioned' }, { value: 'dismissed', label: 'Dismissed' },
];
const label = (value: string) => value.replace(/_/g, ' ');

export function ContentReportsPanel() {
  const [items, setItems] = useState<ContentReport[]>([]);
  const [filter, setFilter] = useState<ContentReportStatus | 'all'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setItems(await reportsApi.moderationQueue(filter)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load reports.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [filter]);
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
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-[#64748B]">Reports of student and lecturer accounts, academic resources and chat messages.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B]"><RefreshCw size={15}/> Refresh</button></div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reports">{statuses.map(item => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${filter === item.value ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#475569]'}`}>{item.label}</button>)}</div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {loading ? <p className="rounded-xl border border-[#DCE4EF] p-5 text-sm text-[#64748B]">Loading reports…</p> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-9 text-center"><Flag className="mx-auto text-[#6121D0]" size={24}/><p className="mt-2 font-semibold text-[#091F5B]">No reports in this view</p></div> :
      <div className="space-y-3">{items.map(item => {
        const reporter = item.reporter ? [item.reporter.firstName, item.reporter.lastName].filter(Boolean).join(' ') || item.reporter.email || item.reporter.academicHandle : 'Deleted account';
        return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#6121D0]">{label(item.targetType)} · {label(item.reason)}</p><h3 className="mt-1 text-base font-bold text-[#091F5B]">{item.targetLabel}</h3><p className="mt-1 text-xs text-[#64748B]">Reported by {reporter} · {new Date(item.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-900">{label(item.status)}</span></div>
          {item.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">{item.details}</p>}
          <details className="mt-3 rounded-xl bg-[#F8FAFD] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#475569]">Reported item snapshot</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-[#475569]">{JSON.stringify(item.targetSnapshot, null, 2)}</pre></details>
          {item.moderatorNote && <p className="mt-3 rounded-xl border border-[#DCE4EF] p-3 text-sm text-[#475569]"><strong>Previous note:</strong> {item.moderatorNote}</p>}
          {item.status !== 'actioned' && item.status !== 'dismissed' && <div className="mt-4 space-y-3 border-t border-[#EEF1F6] pt-4"><label className="block text-xs font-semibold text-[#475569]">Moderator note <span className="font-normal">(required to close)</span><textarea rows={2} maxLength={2000} value={notes[item.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Record what was reviewed and the outcome." className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm outline-none focus:border-[#6121D0]"/></label><div className="flex flex-wrap gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'reviewing')} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#475569] disabled:opacity-50">Mark under review</button><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'actioned')} className="rounded-lg bg-[#6121D0] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Mark actioned</button><button type="button" disabled={busyId === item.id} onClick={() => void update(item, 'dismissed')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50">Dismiss report</button></div></div>}
        </article>;
      })}</div>}
  </section>;
}
