import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import type { ModerationItem } from '../types';
import type { ModerationHistoryItem } from '../api/moderation';
import { SupportRequestsPanel } from '../components/moderation/SupportRequestsPanel';

type ModerationTab = 'queue' | 'history' | 'support';

export function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [history, setHistory] = useState<ModerationHistoryItem[]>([]);
  const [tab, setTab] = useState<ModerationTab>('queue');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true); setError('');
      const queue = await sophiaApi.moderation.list();
      setItems(Array.isArray(queue) ? queue : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation queue.');
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true); setError('');
      const decisions = await sophiaApi.moderation.history();
      setHistory(Array.isArray(decisions) ? decisions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation history.');
    } finally { setHistoryLoading(false); }
  };

  useEffect(() => { void loadQueue(); }, []);
  useEffect(() => { if (tab === 'history') void loadHistory(); }, [tab]);

  const pending = useMemo(() => items.filter((item) => (item.status ?? 'pending').toLowerCase() === 'pending'), [items]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    if (processingId) return;
    setProcessingId(id); setError(''); setNotice('');
    try {
      await sophiaApi.moderation.review(id, status);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice(status === 'approved'
        ? 'Resource approved. It is now visible in the library and recorded in history.'
        : 'Resource rejected and recorded in moderation history.');
      if (tab === 'history') await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed. The item remains pending.');
    } finally { setProcessingId(null); }
  };

  const historyName = (item: ModerationHistoryItem) => item.reviewer?.name ||
    [item.reviewer?.firstName, item.reviewer?.lastName].filter(Boolean).join(' ') ||
    item.reviewer?.email || 'Sophis Moderator';

  return <div className="space-y-6">
    <SectionTitle eyebrow="Trust & safety" title="Moderation queue" />
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Moderation sections">
      <button type="button" role="tab" aria-selected={tab === 'queue'} onClick={() => setTab('queue')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'queue' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Pending queue ({pending.length})</button>
      <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'history' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Decision history</button>
      <button type="button" role="tab" aria-selected={tab === 'support'} onClick={() => setTab('support')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'support' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Support requests</button>
    </div>

    {tab === 'support' ? <SupportRequestsPanel /> : tab === 'queue' ? <OverviewCard title={`${pending.length} pending lecturer uploads`} action="Review queue">
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadQueue()} disabled={loading || Boolean(processingId)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh queue</button></div>
        {loading ? <div className="p-6 text-sm text-[#5C6982]">Loading pending lecturer uploads…</div> : pending.length === 0 ? <div className="p-8 text-center text-sm text-[#5C6982]"><ShieldCheck size={24} className="mx-auto mb-2 text-[#6121D0]" />No pending uploads. Refresh to check for new submissions.</div> : pending.map((item) => {
          const busy = processingId === item.id;
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><ShieldCheck size={16} className="shrink-0 text-[#6121D0]" /><h3 className="break-words font-semibold text-[#091F5B]">{item.title}</h3></div><p className="mt-2 text-sm text-[#4B5563]">{item.summary || `${item.type ?? 'Resource'} • ${item.course ?? 'Course not specified'}`}</p><dl className="mt-3 grid gap-2 text-xs text-[#4B5563] sm:grid-cols-2"><div><dt className="inline font-medium text-[#091F5B]">Lecturer: </dt><dd className="inline">{item.uploadedBy || 'Unknown lecturer'}</dd></div><div><dt className="inline font-medium text-[#091F5B]">Institution: </dt><dd className="inline">{item.institution || 'Not specified'}</dd></div><div><dt className="inline font-medium text-[#091F5B]">Course: </dt><dd className="inline">{item.course || 'Not specified'}</dd></div><div><dt className="inline font-medium text-[#091F5B]">Submitted: </dt><dd className="inline">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</dd></div></dl>{item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] underline underline-offset-4 hover:text-[#2C36D9]"><FileText size={15} /> Open attached upload <ArrowUpRight size={14} /></a>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => void review(item.id, 'approved')} disabled={Boolean(processingId)} className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Approve'}</button><button type="button" onClick={() => void review(item.id, 'rejected')} disabled={Boolean(processingId)} className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"><XCircle size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Reject'}</button></div></div></article>;
        })}
      </div>
    </OverviewCard> : <OverviewCard title="Reviewed resources" action={String(history.length) + ' decisions'}>
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadHistory()} disabled={historyLoading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Refresh history</button></div>
        {historyLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading review history…</p> : history.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No approved or rejected decisions have been recorded yet.</p> : history.map((item) => {
          const status = String(item.status || item.resource?.moderationStatus || 'reviewed').toLowerCase();
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="font-semibold text-[#091F5B]">{item.resource?.title || 'Resource no longer available'}</h3><p className="mt-1 text-sm text-[#4B5563]">{item.resource?.course || 'Course not specified'} · {item.resource?.institution || 'Institution not specified'}</p><p className="mt-2 text-xs text-[#5C6982]">Lecturer: {item.resource?.uploader?.name || [item.resource?.uploader?.firstName, item.resource?.uploader?.lastName].filter(Boolean).join(' ') || item.resource?.uploader?.email || 'Unknown'} · Reviewed by {historyName(item)}</p>{item.note && <p className="mt-2 text-sm text-[#4B5563]">Note: {item.note}</p>}</div><div className="flex shrink-0 flex-col items-start gap-1"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : 'bg-slate-100 text-slate-800'}`}>{status}</span><span className="text-xs text-[#5C6982]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</span></div></div></article>;
        })}
      </div>
    </OverviewCard>}
    <div className="flex items-center gap-2 text-xs text-[#5C6982]"><Clock3 size={14} /> Approval and rejection decisions are saved by the server and displayed in this history.</div>
  </div>;
}
