import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moderationApi } from '../api/moderation';

type Escalation = {
  id: string;
  resourceId: string;
  resourceTitle: string;
  previousStatus: string;
  reason: string;
  status: string;
  requestedById: string;
  resolvedById?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  moderationStatus?: string;
};

type StatusFilter = 'all' | 'open' | 'resolved';

export function ReviewerEscalationsPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('open');

  const load = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await moderationApi.escalations();
      setItems(Array.isArray(result) ? result : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load academic re-review escalations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter(item => {
      const currentStatus = String(item.status || '').toLowerCase();
      if (status !== 'all' && currentStatus !== status) return false;
      return !term || [item.resourceTitle, item.resourceId, item.reason, item.previousStatus, item.resolutionNote]
        .filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [items, query, status]);

  const openCount = items.filter(item => String(item.status).toLowerCase() === 'open').length;
  const resolvedCount = items.filter(item => String(item.status).toLowerCase() === 'resolved').length;

  return <main className="mx-auto w-full max-w-6xl space-y-5">
    <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 text-slate-950 shadow-sm sm:p-7 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-200">Academic governance</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Re-review escalations</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Track completed academic decisions referred for an independent review. Platform reports and support escalations are managed separately.</p>
    </header>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <article className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Clock3 size={17}/> Awaiting re-review</div>
        <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{openCount}</p>
      </article>
      <article className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><CheckCircle2 size={17}/> Resolved</div>
        <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{resolvedCount}</p>
      </article>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
          <Search size={17} className="shrink-0 text-slate-400"/>
          <input value={query} onChange={event => setQuery(event.target.value)} aria-label="Search re-review escalations" placeholder="Search resource, reason or decision…" className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none dark:text-white"/>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {(['open', 'resolved', 'all'] as StatusFilter[]).map(value => <button key={value} type="button" onClick={() => setStatus(value)} aria-pressed={status === value} className={`rounded-full border px-3 py-2 text-xs font-semibold capitalize transition ${status === value ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{value}</button>)}
          <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Refresh</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading ? <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Loading re-review escalations…</p>
        : visibleItems.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><ShieldAlert size={26} className="mx-auto text-violet-600"/><p className="mt-3 font-semibold text-slate-900 dark:text-white">{items.length ? 'No matching escalations' : 'No re-review escalations yet'}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{items.length ? 'Try another status or search term.' : 'When a completed academic decision is escalated, it will appear here.'}</p></div>
        : <div className="mt-5 space-y-3">{visibleItems.map(item => {
          const isOpen = String(item.status).toLowerCase() === 'open';
          return <article key={item.id} className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words font-semibold text-slate-950 dark:text-white">{item.resourceTitle || 'Academic resource'}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Previous decision: <span className="font-semibold capitalize">{String(item.previousStatus).replace(/_/g, ' ')}</span> · Submitted {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'date unavailable'}</p>
              </div>
              <span className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${isOpen ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{String(item.status).replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reason for re-review</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-200">{item.reason}</p></div>
            {!isOpen && item.resolutionNote && <div className="mt-3 rounded-xl border border-emerald-100 p-3 dark:border-emerald-900"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resolution</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{item.resolutionNote}</p>{item.resolvedAt && <p className="mt-2 text-xs text-slate-500">Resolved {new Date(item.resolvedAt).toLocaleString()}</p>}</div>}
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to={isOpen ? `/reviewer/queue?focus=${encodeURIComponent(item.resourceId)}` : '/reviewer/queue?tab=history'} className="inline-flex items-center rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800">{isOpen ? 'Open pending review' : 'View review history'}</Link>
            </div>
          </article>;
        })}</div>}
    </section>
  </main>;
}
