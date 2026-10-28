import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import type { ModerationItem } from '../types';

export function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError('');
      setNotice('');
      const queue = await sophiaApi.moderation.list();
      setItems(Array.isArray(queue) ? queue : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadQueue(); }, []);
  const pending = useMemo(
    () => items.filter((item) => (item.status ?? 'pending').toLowerCase() === 'pending'),
    [items],
  );

  const review = async (id: string, status: 'approved' | 'rejected') => {
    if (processingId) return;
    setProcessingId(id);
    setError('');
    setNotice('');
    try {
      // Remove an item only after the API confirms the persisted review.
      await sophiaApi.moderation.review(id, status);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice(status === 'approved'
        ? 'Resource approved. It is now verified and removed from the pending queue.'
        : 'Resource rejected and removed from the pending queue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed. The item remains pending.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Trust & safety" title="Moderation queue" />
      {error && <div role="alert" className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">{notice}</div>}
      <OverviewCard
        title={`${pending.length} pending lecturer uploads`}
        action="Review queue"
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={loading || Boolean(processingId)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh queue
            </button>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading pending lecturer uploads…</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <ShieldCheck size={24} className="mx-auto mb-2 text-slate-500" />
              No pending uploads. Refresh to check for new submissions.
            </div>
          ) : pending.map((item) => {
            const busy = processingId === item.id;
            return (
              <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="shrink-0 text-violet-300" />
                      <h3 className="break-words font-semibold text-white">{item.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.summary || `${item.type ?? 'Resource'} • ${item.course ?? 'Course not specified'}`}
                    </p>
                    <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <div><dt className="inline text-slate-500">Lecturer: </dt><dd className="inline">{item.uploadedBy || 'Unknown lecturer'}</dd></div>
                      <div><dt className="inline text-slate-500">Institution: </dt><dd className="inline">{item.institution || 'Not specified'}</dd></div>
                      <div><dt className="inline text-slate-500">Course: </dt><dd className="inline">{item.course || 'Not specified'}</dd></div>
                      <div><dt className="inline text-slate-500">Submitted: </dt><dd className="inline">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</dd></div>
                    </dl>
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-violet-300 underline underline-offset-4 hover:text-violet-200"
                      >
                        <FileText size={15} /> Open attached upload <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void review(item.id, 'approved')}
                      disabled={Boolean(processingId)}
                      className="rounded-xl border border-emerald-800 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(item.id, 'rejected')}
                      disabled={Boolean(processingId)}
                      className="rounded-xl border border-rose-800 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Reject'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </OverviewCard>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock3 size={14} /> Approve/reject decisions are persisted by the server and update the resource moderation status.
      </div>
    </div>
  );
}
