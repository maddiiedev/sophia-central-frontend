import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, BookOpen, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
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

  const pending = useMemo(() => queue.filter(item => (item.status || 'pending').toLowerCase() === 'pending'), [queue]);
  const recent = useMemo(() => [...history].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5), [history]);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Reviewer';
  const globalReviewer = user?.isGlobalReviewer === true;

  return <main className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><SectionTitle eyebrow="Academic quality workspace" title={`Welcome, ${displayName}`} /><p className="-mt-3 max-w-2xl text-sm leading-6 text-[#5C6982]">A snapshot of your academic review workload, recent decisions and next steps.</p></div>
      <button type="button" onClick={() => void loadOverview(true)} disabled={loading || refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Refresh overview</button>
    </div>
    {globalReviewer && <section className="rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-4 sm:p-5 dark:border-[#40365A] dark:bg-[#211A34]"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#6121D0] dark:text-[#C4A7FF]" size={20}/><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6121D0] dark:text-[#C4A7FF]">Global Academic Reviewer</p><h2 className="mt-1 font-semibold text-[#091F5B] dark:text-white">Platform-wide academic review scope</h2><p className="mt-1 text-sm leading-6 text-[#52627B] dark:text-slate-300">Your academic review authority spans subjects and academic levels. Platform moderation, user administration and platform support remain separate permissions.</p></div></div></section>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => void loadOverview()} className="ml-2 font-semibold underline">Try again</button></div>}
    {loading ? <div className="rounded-2xl border border-[#DCE4EF] bg-white p-8 text-sm text-[#5C6982]">Loading your reviewer overview…</div> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Pending assignments" value={pending.length} helper="Resources awaiting your review" icon={Clock3}/>
        <SummaryCard label="Reviews completed" value={history.length} helper="Decisions recorded in your review history" icon={CheckCircle2}/>
        <SummaryCard label="Queue resources" value={queue.length} helper="Items currently visible in your review queue" icon={BookOpen}/>
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
        <article className="min-w-0 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#091F5B]">Next assignments</h2><p className="mt-1 text-sm text-[#5C6982]">Your pending academic materials.</p></div><Link to="/reviewer/governance" className="text-sm font-semibold text-[#6121D0] hover:underline">Reviewer management <ArrowUpRight size={14} className="inline"/></Link></div>
          {pending.length ? <div className="mt-4 divide-y divide-[#E8EDF4]">{pending.slice(0, 5).map(item => <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words font-semibold text-[#091F5B]">{item.title}</p><p className="mt-1 text-xs text-[#64748B]">{[item.course, item.institution, item.level].filter(Boolean).join(' · ') || 'Academic resource'}</p></div><Link to="/reviewer/governance" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#6121D0]">Open queue <ArrowUpRight size={14}/></Link></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#DCE4EF] p-6 text-center"><BookOpen size={24} className="mx-auto text-[#8B70D5]"/><p className="mt-2 text-sm font-semibold text-[#091F5B]">No pending assignments</p><p className="mt-1 text-xs text-[#64748B]">New assignments will appear here when they are ready for review.</p></div>}
          <Link to="/reviewer/governance" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5120B0]">Open review workspace <ArrowUpRight size={15}/></Link>
        </article>
        <article className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><Activity size={18} className="text-[#6121D0]"/><h2 className="text-lg font-bold text-[#091F5B]">Recent decisions</h2></div><p className="mt-1 text-sm text-[#5C6982]">Your latest completed reviews.</p>{recent.length ? <div className="mt-4 space-y-3">{recent.map(item => <div key={item.id} className="border-l-2 border-[#D9CCF5] pl-3"><p className="text-sm font-semibold capitalize text-[#091F5B]">{item.status.replace(/_/g, ' ')}</p><p className="mt-0.5 text-xs text-[#64748B]">{item.resource?.title || 'Academic resource'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</p></div>)}</div> : <p className="mt-4 rounded-xl bg-[#F8FAFD] p-4 text-sm text-[#64748B]">Your completed decisions will appear here.</p>}<Link to="/reviewer/governance?tab=history" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6121D0]">View review history <ArrowUpRight size={14}/></Link></article>
      </section>
      <section className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:p-5"><h2 className="font-semibold text-[#091F5B]">Reviewer tools</h2><div className="mt-3 flex flex-wrap gap-3"><Link to="/reviewer/governance" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B]"><ShieldCheck size={15}/> Review queue & history</Link><Link to="/reviewer/notifications" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Notifications</Link></div></section>
    </>}
  </main>;
}
