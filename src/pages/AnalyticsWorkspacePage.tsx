import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, Download, Eye, Search, Users, Repeat2 } from 'lucide-react';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import { SectionTitle } from '../components/layout/AppShell';

type ResourceMetric = { id: string; title: string; course?: string; views: number; downloads: number; contributor?: string };
type SearchMetric = { query: string; count: number };
type Metrics = {
  totalResources?: number; totalViews?: number; totalDownloads?: number; totalUsers?: number;
  totalReviews?: number; totalStudents?: number; totalLecturers?: number; searches?: number;
  uniqueUsers?: number; returningUsers?: number; retentionRate?: number; contributors?: number;
  views?: number; downloads?: number; popularResources?: ResourceMetric[]; topSearches?: SearchMetric[];
};
function MetricCard({ label, value, icon: Icon, helper }: { label: string; value: string | number; icon: typeof BookOpen; helper?: string }) {
  return <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#5C6982]">{label}</span><Icon size={18} className="text-[#6121D0}" /></div><div className="mt-3 text-3xl font-bold text-[#091F5B]">{value}</div>{helper && <p className="mt-1 text-xs text-[#5C6982]">{helper}</p>}</div>;
}
export function AnalyticsWorkspacePage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'students' | 'lecturers'>('students');
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        let result: Metrics;
        if (user?.role === 'lecturer') {
          result = await apiRequest<Metrics>('/analytics/lecturer/resources');
        } else {
          const role = view === 'students' ? 'student' : 'lecturer';
          const [resources, moderation, users, activity] = await Promise.all([
            apiRequest<Metrics>('/analytics/resources'),
            apiRequest<Metrics>('/analytics/moderation'),
            apiRequest<Metrics>('/analytics/users'),
            apiRequest<Metrics>(`/analytics/activity?role=${role}`),
          ]);
          result = {
            ...resources, ...activity,
            totalViews: activity.views ?? resources.totalViews,
            totalDownloads: activity.downloads ?? resources.totalDownloads,
            totalReviews: moderation.totalReviews,
            totalStudents: users.totalStudents,
            totalLecturers: users.totalLecturers,
            totalUsers: users.totalUsers,
          };
        }
        if (active) setMetrics(result);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load analytics.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [user?.id, user?.role, view]);
  const moderator = user?.role === 'moderator' || user?.role === 'admin';
  const cards = moderator
    ? view === 'students'
      ? [
          { label: 'Student accounts', value: metrics?.totalStudents ?? '—', icon: Users },
          { label: 'Searches', value: metrics?.searches ?? 0, icon: Search },
          { label: 'Resource views', value: metrics?.totalViews ?? '—', icon: Eye },
          { label: 'Downloads', value: metrics?.totalDownloads ?? '—', icon: Download },
        ]
      : [
          { label: 'Lecturer accounts', value: metrics?.totalLecturers ?? '—', icon: Users },
          { label: 'Searches', value: metrics?.searches ?? 0, icon: Search },
          { label: 'Contributors', value: metrics?.contributors ?? 0, icon: BookOpen },
          { label: 'Returning-user retention', value: `${metrics?.retentionRate ?? 0}%`, icon: Repeat2 },
        ]
    : [
        { label: 'My resources', value: metrics?.totalResources ?? '—', icon: BookOpen },
        { label: 'Resource views', value: metrics?.totalViews ?? '—', icon: Eye },
        { label: 'Downloads', value: metrics?.totalDownloads ?? '—', icon: Download },
        { label: 'Returning-user retention', value: `${metrics?.retentionRate ?? 0}%`, icon: Repeat2 },
      ];
  return <div className="space-y-6">
    <SectionTitle eyebrow={moderator ? 'Platform insights' : 'Private lecturer insights'} title={moderator ? 'Analytics' : 'My resource analytics'} />
    {moderator && <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics account type"><button type="button" role="tab" aria-selected={view === 'students'} onClick={() => setView('students')} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === 'students' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Student accounts</button><button type="button" role="tab" aria-selected={view === 'lecturers'} onClick={() => setView('lecturers')} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === 'lecturers' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Lecturer accounts</button></div>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    {loading ? <div className="rounded-2xl border border-[#DCE4EF] p-8 text-sm text-[#5C6982]">Loading analytics…</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} />)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5"><div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-[#6121D0]"/><h3 className="font-semibold text-[#091F5B]">Popular resources</h3></div>{metrics?.popularResources?.length ? <div className="space-y-3">{metrics.popularResources.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 border-b border-[#EEF1F6] pb-3 last:border-0"><div className="min-w-0"><p className="font-medium text-[#091F5B]">{item.title}</p><p className="mt-1 text-xs text-[#5C6982]">{item.course || 'Course not specified'}{item.contributor ? ` · ${item.contributor}` : ''}</p></div><p className="shrink-0 text-right text-xs text-[#5C6982]"><span className="block">{item.views} views</span><span>{item.downloads} downloads</span></p></div>)}</div> : <p className="text-sm text-[#5C6982]">No resource activity has been recorded yet.</p>}</section>
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5"><div className="mb-4 flex items-center gap-2"><Search size={18} className="text-[#6121D0]"/><h3 className="font-semibold text-[#091F5B]">Popular search terms</h3></div>{metrics?.topSearches?.length ? <div className="space-y-3">{metrics.topSearches.map((item) => <div key={item.query} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFD] p-3"><span className="text-sm text-[#091F5B]">{item.query}</span><span className="rounded-full bg-[#F3F0FF] px-2.5 py-1 text-xs font-semibold text-[#6121D0]">{item.count} searches</span></div>)}</div> : <p className="text-sm text-[#5C6982]">Search analytics will populate as authenticated users search the library.</p>}</section>
      </div>
      <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5"><h3 className="font-semibold text-[#091F5B]">How these metrics are calculated</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">Searches are counted when an authenticated user submits a library search. Views and downloads are recorded by the backend after access checks. Returning-user retention is the share of users with more than one recorded activity event in the available event history; it is an engagement indicator, not a cohort-based retention study. Lecturer analytics are restricted to resources owned by the signed-in lecturer.</p></div>
    </>}
  </div>;
}
