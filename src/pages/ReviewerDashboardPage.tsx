import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, BookOpen, CheckCircle2, Clock3, RefreshCw, ShieldCheck, Users, ClipboardList } from 'lucide-react';
import { SectionTitle } from '../components/layout/AppShell';
import { moderationApi, type ModerationHistoryItem } from '../api/moderation';
import type { ModerationItem } from '../types';
import { useAuth } from '../context/AuthContext';

function SummaryCard({ label, value, helper, icon: Icon }: { label: string; value: number | string; helper: string; icon: typeof BookOpen }) {
  return <article className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#5C6982]">{label}</span><Icon size={19} className="text-[#6121D0]" /></div>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#091F5B]">{value}</p>
    <p className="mt-1 text-xs text-[#5C6982]">{helper}</p>
  </article>;
}

export function ReviewerDashboardPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [history, setHistory] = useState<ModerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [assigned, completed] = await Promise.all([moderationApi.queue(), moderationApi.history()]);
      setQueue(Array.isArray(assigned) ? assigned : []);
      setHistory(Array.isArray(completed) ? completed : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your reviewer overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadOverview(); }, [user?.id]);

  const pending = useMemo(() => queue.filter(item => (item.status || 'pending').toLowerCase() === 'pending').sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()), [queue]);
  const recent = useMemo(() => [...history].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5), [history]);
  const approvedCount = useMemo(() => history.filter(item => String(item.status || item.resource?.moderationStatus || '').toLowerCase() === 'approved').length, [history]);
  const approvalRate = history.length ? `${Math.round((approvedCount / history.length) * 100)}%` : '—';
  const submittedAge = (createdAt?: string) => {
    if (!createdAt) return 'Submission date unavailable';
    const submittedAt = new Date(createdAt).getTime();
    if (!Number.isFinite(submittedAt)) return 'Submission date unavailable';
    const days = Math.max(0, Math.floor((Date.now() - submittedAt) / 86400000));
    return days === 0 ? 'Submitted today' : `Submitted ${days} day${days === 1 ? '' : 's'} ago`;
  };
  const platformAssigned = pending.filter(item => Boolean(item.assignedReviewerId)).length;
  const platformUnassigned = pending.length - platformAssigned;
  const reviewerWorkload = useMemo(() => {
    const totals = new Map<string, { name: string; count: number }>();
    for (const item of pending) {
      if (!item.assignedReviewerId) continue;
      const reviewer = (item as ModerationItem & { assignedReviewer?: { id?: string; firstName?: string; lastName?: string } }).assignedReviewer;
      const id = item.assignedReviewerId;
      const name = [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(' ') || 'Assigned reviewer';
      const current = totals.get(id) || { name, count: 0 };
      current.count += 1;
      totals.set(id, current);
    }
    return [...totals.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pending]);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Reviewer';
  const globalReviewer = user?.isGlobalReviewer === true;

  return <main className="space-y-6">
    <header className="flex flex-col gap-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 text-slate-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">Academic quality workspace</p><h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {displayName}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A snapshot of your academic review workload, recent decisions and next steps.</p></div>
      <button type="button" onClick={() => void loadOverview(true)} disabled={loading || refreshing} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-violet-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:w-auto"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Refresh overview</button>
    </header>
    {globalReviewer && <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-violet-700 dark:text-violet-200" size={20}/><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">Global Academic Reviewer</p><h2 className="mt-1 font-semibold text-slate-950 dark:text-white">Platform-wide academic review scope</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Your academic review authority spans subjects and academic levels. Platform moderation, user administration and platform support remain separate permissions.</p></div></div></section>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => void loadOverview()} className="ml-2 font-semibold underline">Try again</button></div>}
    {loading ? <div className="rounded-2xl border border-[#DCE4EF] bg-white p-8 text-sm text-[#5C6982]">Loading your reviewer overview…</div> : <>
      {globalReviewer ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Platform pending" value={pending.length} helper="All resources awaiting academic review" icon={Clock3}/>
          <SummaryCard label="Assigned" value={platformAssigned} helper="Pending resources with a reviewer" icon={Users}/>
          <SummaryCard label="Unassigned" value={platformUnassigned} helper="Pending resources needing assignment" icon={ClipboardList}/>
          <SummaryCard label="Decisions recorded" value={history.length} helper="Platform-wide review history" icon={CheckCircle2}/>
        </section>
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
          <article className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#091F5B]">Reviewer workload</h2><p className="mt-1 text-sm text-[#5C6982]">Current pending assignments by reviewer.</p></div><Link to="/reviewer/queue" className="text-sm font-semibold text-[#6121D0] hover:underline">Manage assignments <ArrowUpRight size={14} className="inline"/></Link></div>
            {reviewerWorkload.length ? <div className="mt-4 space-y-3">{reviewerWorkload.slice(0, 8).map(reviewer => <div key={reviewer.id} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-medium text-[#091F5B]">{reviewer.name}</span><span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">{reviewer.count} pending</span></div>)}</div> : <p className="mt-4 rounded-xl bg-[#F8FAFD] p-4 text-sm text-[#64748B]">No pending resources are currently assigned.</p>}
          </article>
          <article className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><h2 className="text-lg font-bold text-[#091F5B]">Academic quality snapshot</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F8FAFD] p-3"><p className="text-xs text-[#64748B]">Approved</p><p className="mt-1 text-2xl font-semibold text-[#091F5B]">{approvedCount}</p></div><div className="rounded-xl bg-[#F8FAFD] p-3"><p className="text-xs text-[#64748B]">Approval rate</p><p className="mt-1 text-2xl font-semibold text-[#091F5B]">{approvalRate}</p></div></div><p className="mt-3 text-xs text-[#64748B]">Based on recorded platform-wide decisions returned by the review history service.</p><Link to="/reviewer/queue?tab=history" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6121D0]">Explore review history <ArrowUpRight size={14}/></Link></article>
        </section>
      </> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Pending assignments" value={pending.length} helper="Resources awaiting your review" icon={Clock3}/>
        <SummaryCard label="Reviews completed" value={history.length} helper="Decisions recorded in your review history" icon={CheckCircle2}/>
        <SummaryCard label="Approval rate" value={approvalRate} helper={`${approvedCount} approved of ${history.length} recorded decisions`} icon={BookOpen}/>
      </section>}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
        <article className="min-w-0 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#091F5B]">Next assignments</h2><p className="mt-1 text-sm text-[#5C6982]">Your pending academic materials.</p></div><Link to="/reviewer/queue" className="text-sm font-semibold text-[#6121D0] hover:underline">Assignment tools <ArrowUpRight size={14} className="inline"/></Link></div>
          {pending.length ? <div className="mt-4 divide-y divide-[#E8EDF4]">{pending.slice(0, 5).map(item => <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words font-semibold text-[#091F5B]">{item.title}</p><p className="mt-1 text-xs text-[#64748B]">{[item.course, item.institution, item.level].filter(Boolean).join(' · ') || 'Academic resource'}</p><p className="mt-1 text-xs font-medium text-amber-700">{submittedAge(item.createdAt)}</p></div><Link to="/reviewer/queue" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#6121D0]">Open queue <ArrowUpRight size={14}/></Link></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#DCE4EF] p-6 text-center"><BookOpen size={24} className="mx-auto text-[#8B70D5]"/><p className="mt-2 text-sm font-semibold text-[#091F5B]">No pending assignments</p><p className="mt-1 text-xs text-[#64748B]">New assignments will appear here when they are ready for review.</p></div>}
          <Link to="/reviewer/queue" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5120B0]">Open review workspace <ArrowUpRight size={15}/></Link>
        </article>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><Activity size={18} className="text-[#6121D0]"/><h2 className="text-lg font-bold text-[#091F5B]">Recent decisions</h2></div><p className="mt-1 text-sm text-[#5C6982]">Your latest completed reviews.</p>{recent.length ? <div className="mt-4 space-y-3">{recent.map(item => <div key={item.id} className="border-l-2 border-[#D9CCF5] pl-3"><p className="text-sm font-semibold capitalize text-[#091F5B]">{item.status.replace(/_/g, ' ')}</p><p className="mt-0.5 text-xs text-[#64748B]">{item.resource?.title || 'Academic resource'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</p></div>)}</div> : <p className="mt-4 rounded-xl bg-[#F8FAFD] p-4 text-sm text-[#64748B]">Your completed decisions will appear here.</p>}<Link to="/reviewer/queue?tab=history" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6121D0]">View review history <ArrowUpRight size={14}/></Link></article>
      </section>
      <section className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:p-5"><h2 className="font-semibold text-[#091F5B]">Reviewer tools</h2><div className="mt-3 flex flex-wrap gap-3"><Link to="/reviewer/queue" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B]"><ShieldCheck size={15}/> Review queue & history</Link><Link to="/reviewer/notifications" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Notifications</Link></div></section>
    </>}
  </main>;
}
