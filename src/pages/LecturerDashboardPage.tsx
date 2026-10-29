import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OverviewCard, SectionTitle, UserBadge } from '../components/layout/AppShell';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';

type ResourceStatusTab = 'pending' | 'approved' | 'rejected';

export function LecturerDashboardPage() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [statusTab, setStatusTab] = useState<ResourceStatusTab>('pending');
  const { data: resources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['resources', 'mine', user?.id],
    queryFn: () => resourcesApi.mine(),
    enabled: Boolean(user?.id),
    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const ownResources = useMemo(
    () => resources.filter((item) => item.uploadedBy === user?.id || (item as { uploaderId?: string }).uploaderId === user?.id),
    [resources, user?.id],
  );
  const byStatus = (status: ResourceStatusTab) => ownResources.filter((item) => {
    const value = String(item.moderationStatus || (item.isVerified ? 'approved' : 'pending')).toLowerCase();
    return value === status;
  });
  const pendingResources = byStatus('pending');
  const approvedResources = byStatus('approved');
  const rejectedResources = byStatus('rejected');
  const visibleResources = byStatus(statusTab);

  const stats = [
    { label: 'My uploads', value: String(resources.length), helper: 'resources you submitted' },
    { label: 'Pending review', value: String(pendingResources.length), helper: 'awaiting moderator review' },
    { label: 'Approved', value: String(approvedResources.length), helper: 'available in the library' },
    { label: 'Rejected', value: String(rejectedResources.length), helper: 'review decisions to check' },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><SectionTitle eyebrow="Lecturer workspace" title="Instructor overview" /><div className="flex items-center gap-3"><Link to="/upload" className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2C36D9]"><UploadCloud size={16} /> Upload resource</Link><UserBadge /></div></div>
    {showOnboarding && <div className="rounded-3xl border border-[#6121D0]/25 bg-[#6121D0]/10 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-[10px] uppercase tracking-[0.22em] text-[#6121D0]">Lecturer workflow</div><h3 className="mt-2 text-2xl font-semibold text-[#091F5B]">Upload → submit → moderation</h3><p className="mt-2 text-sm text-[#4B5563]">Your submissions and review decisions are shown here. Only approved resources appear in the shared library.</p></div><button type="button" onClick={() => setShowOnboarding(false)} className="rounded-xl border border-[#6121D0]/30 bg-white px-4 py-2 text-sm font-semibold text-[#6121D0] hover:bg-[#F3F0FF]">Dismiss</button></div></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="glass-panel p-4"><div className="text-[10px] uppercase tracking-[0.2em] text-[#5C6982]">{stat.label}</div><div className="mt-4 text-3xl font-semibold text-[#091F5B]">{stat.value}</div><div className="mt-1 text-sm text-[#5C6982]">{stat.helper}</div></div>)}</div>
    <OverviewCard title="My resource review history" action={String(resources.length) + ' total'}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="My resource status">
          {(['pending', 'approved', 'rejected'] as const).map((status) => <button key={status} type="button" role="tab" aria-selected={statusTab === status} onClick={() => setStatusTab(status)} className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${statusTab === status ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9] hover:text-[#6121D0]'}`}>{status} ({byStatus(status).length})</button>)}
        </div>
        {isLoading ? <p className="p-4 text-sm text-[#5C6982]">Loading your submitted resources…</p> : isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Unable to load your resource history. <button type="button" onClick={() => void refetch()} className="font-semibold underline">Try again</button></div> : visibleResources.length === 0 ? <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No {statusTab} resources yet. {statusTab === 'pending' && <Link to="/upload" className="font-semibold text-[#6121D0] underline">Submit a resource</Link>}</div> : visibleResources.map((item) => <Link key={item.id} to={`/resource/${encodeURIComponent(item.id)}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DCE4EF] bg-white p-4 transition hover:border-[#6121D0] hover:bg-[#F8F5FF]"><div className="min-w-0"><div className="font-semibold text-[#091F5B]">{item.title}</div><div className="mt-1 text-sm text-[#5C6982]">{item.course || 'No course'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusTab === 'approved' ? 'bg-emerald-50 text-emerald-800' : statusTab === 'rejected' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900'}`}>{statusTab}</span><ChevronRight size={16} className="shrink-0 text-[#6121D0]" /></Link>)}
      </div>
    </OverviewCard>
    <OverviewCard title="Academic profile" action="Current"><div className="grid gap-3 text-sm sm:grid-cols-2">{[['Institution', user?.institution], ['Faculty', user?.faculty], ['Department', user?.department], ['Courses taught', user?.coursesTaught?.join(', ') || 'Not set']].map(([label, value]) => <div key={label} className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3"><div className="text-xs text-[#5C6982]">{label}</div><div className="mt-1 font-medium text-[#091F5B]">{value || 'Not set'}</div></div>)}</div></OverviewCard>
  </div>;
}
