import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, ChartNoAxesCombined, LifeBuoy, ShieldCheck, Users, WalletCards, RefreshCw, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '../lib/api/client';
import { SectionTitle } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';

type OverviewMetrics = {
  totalResources?: number;
  activeResources?: number;
  totalReviews?: number;
  totalUsers?: number;
  totalStudents?: number;
  totalLecturers?: number;
};

type MetricCardProps = { label: string; value: number | string; helper: string; icon: typeof Users };
function MetricCard({ label, value, helper, icon: Icon }: MetricCardProps) {
  return <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#5C6982]">{label}</span><Icon size={19} className="text-[#6121D0]" /></div>
    <div className="mt-3 text-3xl font-bold text-[#091F5B]">{value}</div>
    <p className="mt-1 text-xs text-[#5C6982]">{helper}</p>
  </div>;
}

const shortcuts = [
  { title: 'Reports & moderation', description: 'Review user and content reports assigned to the moderator workspace.', href: '/moderation', icon: ShieldCheck },
  { title: 'Platform resource library', description: 'Browse and view platform resources across student, lecturer and open-source contributions.', href: '/library', icon: BookOpen },
  { title: 'Student and lecturer analytics', description: 'Inspect account activity and resource engagement by account type.', href: '/moderation/analytics', icon: ChartNoAxesCombined },
  { title: 'Support requests', description: 'Review and respond to platform support requests.', href: '/moderation/support', icon: LifeBuoy },
  { title: 'Accounts & Wisdom Points', description: 'Access the moderator account oversight tools.', href: '/moderation/management', icon: Users },
  { title: 'Wisdom Points oversight', description: 'Review account Wisdom Points activity and balances.', href: '/moderation/management/wisdom-points', icon: WalletCards },
];

export function ModeratorDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [users, resources, moderation] = await Promise.all([
        apiRequest<OverviewMetrics>('/analytics/users'),
        apiRequest<OverviewMetrics>('/analytics/resources'),
        apiRequest<OverviewMetrics>('/analytics/moderation'),
      ]);
      setMetrics({
        ...users,
        ...resources,
        totalStudents: users.totalStudents,
        totalLecturers: users.totalLecturers,
        totalUsers: users.totalUsers,
        totalResources: resources.totalResources,
        activeResources: resources.activeResources,
        totalReviews: moderation.totalReviews,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the moderator overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadOverview(); }, [user?.id]);

  const cards: MetricCardProps[] = [
    { label: 'Student accounts', value: metrics?.totalStudents ?? '—', helper: 'Student accounts on the platform', icon: Users },
    { label: 'Lecturer accounts', value: metrics?.totalLecturers ?? '—', helper: 'Lecturer accounts on the platform', icon: Users },
    { label: 'Platform resources', value: metrics?.totalResources ?? '—', helper: 'Resources recorded across the platform', icon: BookOpen },
    { label: 'Resource reviews', value: metrics?.totalReviews ?? '—', helper: 'Recorded moderation review activity', icon: Activity },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><SectionTitle eyebrow="Moderator workspace" title="Welcome back Sophis" /><p className="-mt-3 text-sm text-[#5C6982]">Your overview of moderation operations, platform resources and account activity.</p></div>
      <button type="button" onClick={() => void loadOverview(true)} disabled={loading || refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh overview</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => void loadOverview()} className="ml-2 font-semibold underline">Try again</button></div>}
    {loading ? <div className="rounded-2xl border border-[#DCE4EF] bg-white p-8 text-sm text-[#5C6982]">Loading moderator overview…</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <MetricCard key={card.label} {...card} />)}</div>}
    <section>
      <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-[#091F5B]">Moderator workspace</h3><p className="mt-1 text-sm text-[#5C6982]">Open a tool to continue your work.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6121D0]"><ShieldCheck size={13} /> Moderator access</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        {shortcuts.map(({ title, description, href, icon: Icon }) => <Link key={href} to={href} className="group rounded-2xl border border-[#DCE4EF] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#B8A0ED] hover:shadow-md">
          <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F0FF] text-[#6121D0]"><Icon size={19} /></div><ArrowUpRight size={17} className="text-[#8A94A6] transition group-hover:text-[#6121D0]" /></div>
          <h4 className="mt-4 font-semibold text-[#091F5B]">{title}</h4><p className="mt-1 text-sm leading-6 text-[#5C6982]">{description}</p>
        </Link>)}
      </div>
    </section>
  </div>;
}
