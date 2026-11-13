import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, RefreshCw, ShieldCheck, XCircle, UserCheck } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import { moderationApi, type ModerationHistoryItem } from '../api/moderation';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import type { ModerationItem } from '../types';
import { AcademicCatalogueReviewPanel } from '../components/AcademicCatalogueReviewPanel';
import { ContentReportsPanel } from '../components/moderation/ContentReportsPanel';

type ModerationTab = 'queue' | 'history' | 'catalogue' | 'reports';
type ReviewerOption = { id: string; firstName?: string; lastName?: string; email: string; role: string; reviewerExpertise?: string[]; isSuspended?: boolean };

export function ModerationPage() {
  const { user } = useAuth();
  const isPlatformModerator = user?.role === 'moderator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer';
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [history, setHistory] = useState<ModerationHistoryItem[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<ModerationTab>(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'reports' && isPlatformModerator) return 'reports';
    return user?.role === 'moderator' ? 'reports' : 'queue';
  });
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
      if (isAdmin) {
        try {
          const accounts = await apiRequest<ReviewerOption[]>('/users/management');
          setReviewers(accounts.filter((account) => account.role === 'reviewer' && !account.isSuspended));
        } catch {
          setReviewers([]);
        }
      }
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

  useEffect(() => { if (isReviewer || isAdmin) void loadQueue(); }, [user?.id, isReviewer, isAdmin]);
  useEffect(() => { if (tab === 'history' && (isReviewer || isAdmin)) void loadHistory(); }, [tab, isReviewer, isAdmin]);

  const pending = useMemo(() => items.filter((item) => (item.status ?? 'pending').toLowerCase() === 'pending'), [items]);

  const review = async (id: string, status: 'approved' | 'rejected' | 'revision_requested') => {
    if (processingId) return;
    const note = (notes[id] ?? '').trim();
    if ((status === 'rejected' || status === 'revision_requested') && !note) {
      setError(status === 'rejected' ? 'Add a reason before rejecting this resource.' : 'Add specific feedback before requesting revisions.');
      return;
    }
    setProcessingId(id); setError(''); setNotice('');
    try {
      await moderationApi.review(id, status, undefined, note || undefined);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotes((current) => ({ ...current, [id]: '' }));
      setNotice(status === 'approved'
        ? 'Resource approved and made available in the public library.'
        : status === 'revision_requested'
          ? 'Revision requested. The contributor has been notified.'
          : 'Resource rejected. The contributor has been notified.');
      if (tab === 'history') await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed. The item remains pending.');
    } finally { setProcessingId(null); }
  };

  const assignReviewer = async (resourceId: string) => {
    const reviewerId = assignments[resourceId];
    if (!reviewerId || processingId) return;
    setProcessingId(resourceId); setError(''); setNotice('');
    try {
      await moderationApi.assignReviewer(resourceId, reviewerId);
      const selected = reviewers.find((reviewer) => reviewer.id === reviewerId);
      setItems((current) => current.map((item) => item.id === resourceId ? { ...item, assignedReviewerId: reviewerId } : item));
      setNotice(`Assigned to ${selected ? [selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.email : 'the selected reviewer'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reviewer assignment failed.');
    } finally { setProcessingId(null); }
  };

  const historyName = (item: ModerationHistoryItem) => item.reviewer?.name ||
    [item.reviewer?.firstName, item.reviewer?.lastName].filter(Boolean).join(' ') ||
    item.reviewer?.email || 'Sophis reviewer';

  return <div className="space-y-6">
    <SectionTitle eyebrow={isReviewer ? "Academic quality & trust" : isAdmin ? "Platform governance" : "Moderator workspace"} title={isReviewer ? "Assigned academic reviews" : isAdmin ? "Reviewer assignment" : "User & content reports"} />
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Moderation sections">
      {(isReviewer || isAdmin) && <button type="button" role="tab" aria-selected={tab === 'queue'} onClick={() => setTab('queue')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'queue' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>{isAdmin ? 'Resource assignment queue' : `Assigned review queue (${pending.length})`}</button>}
      {(isReviewer || isAdmin) && <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'history' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Review history</button>}
      {isPlatformModerator && <button type="button" role="tab" aria-selected={tab === 'reports'} onClick={() => setTab('reports')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'reports' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>User & content reports</button>}
      {isAdmin && <button type="button" role="tab" aria-selected={tab === 'catalogue'} onClick={() => setTab('catalogue')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'catalogue' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Academic catalogue</button>}
    </div>

    {tab === 'reports' && isPlatformModerator ? <ContentReportsPanel /> : tab === 'catalogue' && isAdmin ? <AcademicCatalogueReviewPanel /> : tab === 'queue' && (isReviewer || isAdmin) ? <OverviewCard title={`${pending.length} pending academic materials`} action="Review queue">
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadQueue()} disabled={loading || Boolean(processingId)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh queue</button></div>
        {loading ? <div className="p-6 text-sm text-[#5C6982]">Loading assigned academic materials…</div> : pending.length === 0 ? <div className="p-8 text-center text-sm text-[#5C6982]"><ShieldCheck size={24} className="mx-auto mb-2 text-[#6121D0]" />No pending materials assigned to this review workspace.</div> : pending.map((item) => {
          const busy = processingId === item.id;
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="shrink-0 text-[#6121D0]" /><h3 className="break-words font-semibold text-[#091F5B]">{item.title}</h3></div>
                <p className="mt-2 text-sm text-[#4B5563]">{item.summary || `${item.type ?? 'Resource'} • ${item.course ?? 'Course not specified'}`}</p>
                <dl className="mt-3 grid gap-2 text-xs text-[#4B5563] sm:grid-cols-2">
                  <div><dt className="inline font-medium text-[#091F5B]">Contributor: </dt><dd className="inline">{item.uploadedBy || (item.uploaderId === null ? 'Former contributor' : item.origin === 'open_source' ? 'Anonymous contributor' : 'Contributor not listed')}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Institution: </dt><dd className="inline">{item.institution || 'Not specified'}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Course: </dt><dd className="inline">{item.course || 'Not specified'}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Submitted: </dt><dd className="inline">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</dd></div>
                </dl>
                {item.fileUrl && <Link to={`/resource/${encodeURIComponent(item.id)}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] underline underline-offset-4 hover:text-[#2C36D9]"><FileText size={15} /> Open attached upload in reader <ArrowUpRight size={14} /></Link>}
                {isAdmin && <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#F8FAFD] p-3 sm:flex-row sm:items-center">
                  <label className="min-w-0 flex-1 text-xs font-semibold text-[#091F5B]">Assign subject-matter reviewer
                    <select value={assignments[item.id] ?? item.assignedReviewerId ?? ''} onChange={(event) => setAssignments((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal">
                      <option value="">Select reviewer</option>
                      {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{[reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ') || reviewer.email} — {(reviewer.reviewerExpertise ?? []).join(', ')}</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={() => void assignReviewer(item.id)} disabled={busy || !(assignments[item.id] ?? item.assignedReviewerId)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#091F5B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><UserCheck size={14} /> Assign reviewer</button>
                </div>}
                {isReviewer && <label className="mt-4 block text-xs font-semibold text-[#091F5B]">Reviewer feedback (required for rejection or revision requests)
                  <textarea rows={2} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Give specific, actionable academic feedback…" />
                </label>}
              </div>
              {isReviewer && <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void review(item.id, 'approved')} disabled={Boolean(processingId)} className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Approve'}</button>
                <button type="button" onClick={() => void review(item.id, 'revision_requested')} disabled={Boolean(processingId)} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">{busy ? 'Saving…' : 'Request revision'}</button>
                <button type="button" onClick={() => void review(item.id, 'rejected')} disabled={Boolean(processingId)} className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"><XCircle size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Reject'}</button>
              </div>}
            </div>
          </article>;
        })}
      </div>
    </OverviewCard> : (tab === 'history' && (isReviewer || isAdmin)) ? <OverviewCard title="Review decisions" action={`${history.length} decisions`}>
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadHistory()} disabled={historyLoading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Refresh history</button></div>
        {historyLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading review history…</p> : history.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No review decisions have been recorded yet.</p> : history.map((item) => {
          const status = String(item.status || item.resource?.moderationStatus || 'reviewed').toLowerCase();
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="font-semibold text-[#091F5B]">{item.resource?.title || 'Resource no longer available'}</h3><p className="mt-1 text-sm text-[#4B5563]">{item.resource?.course || 'Course not specified'} · {item.resource?.institution || 'Institution not specified'}</p><p className="mt-2 text-xs text-[#5C6982]">Reviewed by {historyName(item)}</p>{item.note && <p className="mt-2 text-sm text-[#4B5563]">Feedback: {item.note}</p>}</div><div className="flex shrink-0 flex-col items-start gap-1"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : status === 'revision_requested' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-800'}`}>{status.replace(/_/g, ' ')}</span><span className="text-xs text-[#5C6982]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</span></div></div></article>;
        })}
      </div>
    </OverviewCard> : null}
    {(isReviewer || isAdmin) && <div className="flex items-center gap-2 text-xs text-[#5C6982]"><Clock3 size={14} /> Review decisions are recorded with reviewer identity and feedback.</div>}
  </div>;
}
