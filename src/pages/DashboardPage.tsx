import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, UserRound, Settings, ChevronLeft, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';
import { OverviewCard, UserBadge } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import { useAuth } from '../context/AuthContext';
import type { Resource } from '../types';

type ResourceWithUploader = Resource & {
  uploader?: {
    institution?: string;
    faculty?: string;
    department?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
};

function normalize(value?: string | null) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function academicValue(resource: Resource, key: 'institution' | 'faculty' | 'department') {
  const item = resource as ResourceWithUploader;
  if (key === 'institution') return normalize(item.uploader?.institution || resource.institution);
  return normalize(item.uploader?.[key]);
}

export function DashboardPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const firstName = user?.firstName?.trim() || user?.name?.trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    let active = true;
    const fetchResources = async (background = false) => {
      try {
        if (background) setRefreshing(true);
        else setLoading(true);
        setError('');
        const data = await sophiaApi.resources.list();
        if (active) setResources(Array.isArray(data) ? data : []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to refresh approved resources.');
      } finally {
        if (active) { setLoading(false); setRefreshing(false); }
      }
    };
    void fetchResources(refreshVersion > 0);
    const interval = window.setInterval(() => { void fetchResources(true); }, 60_000);
    const onFocus = () => { void fetchResources(true); };
    window.addEventListener('focus', onFocus);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refreshVersion]);

  const relatedResources = useMemo(() => {
    if (!user?.institution || !user?.faculty || !user?.department) return [];
    return resources.filter((resource) => {
      const status = normalize(resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending'));
      if (status !== 'approved') return false;
      return academicValue(resource, 'institution') === normalize(user.institution)
        && academicValue(resource, 'faculty') === normalize(user.faculty)
        && academicValue(resource, 'department') === normalize(user.department);
    }).sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [resources, user?.institution, user?.faculty, user?.department]);

  useEffect(() => { setCarouselIndex(0); }, [user?.institution, user?.faculty, user?.department, relatedResources.length]);

  const visibleResources = useMemo(() => {
    if (!relatedResources.length) return [];
    const count = Math.min(3, relatedResources.length);
    return Array.from({ length: count }, (_, offset) => relatedResources[(carouselIndex + offset) % relatedResources.length]);
  }, [relatedResources, carouselIndex]);

  const moveCarousel = (direction: -1 | 1) => {
    if (relatedResources.length < 2) return;
    setCarouselIndex((current) => (current + direction + relatedResources.length) % relatedResources.length);
  };

  return <div className="space-y-6">
    <section className="rounded-3xl bg-[#2C36D9] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">Study dashboard</p><h2 className="mt-2 text-3xl font-bold">Your academic momentum is building.</h2><p className="mt-2 text-sm text-white/90">Welcome back, {firstName}.</p></div>
        <UserBadge />
      </div>
    </section>

    {error && <div role="status" className="rounded-2xl border border-[#E6B800]/30 bg-[#FFF8D9] px-4 py-3 text-sm text-[#6B5200]">{error}<button type="button" onClick={() => setRefreshVersion((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></div>}

    <section aria-label="Student account" className="grid gap-4 sm:grid-cols-2">
      <Link to="/profile" className="group flex items-start gap-4 rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm transition hover:border-[#6121D0] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6121D0]">
        <span className="rounded-xl bg-[#6121D0]/10 p-3 text-[#6121D0]"><UserRound size={22} /></span>
        <span className="min-w-0"><span className="block font-semibold text-[#091F5B]">My profile</span><span className="mt-1 block text-sm text-[#5C6982]">View and update your institution, faculty, department, programme, and study level.</span><span className="mt-3 inline-block text-sm font-semibold text-[#6121D0]">Edit profile →</span></span>
      </Link>
      <Link to="/settings" className="group flex items-start gap-4 rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm transition hover:border-[#2C36D9] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2C36D9]">
        <span className="rounded-xl bg-[#2C36D9]/10 p-3 text-[#2C36D9]"><Settings size={22} /></span>
        <span className="min-w-0"><span className="block font-semibold text-[#091F5B]">Account settings</span><span className="mt-1 block text-sm text-[#5C6982]">Manage the academic details and bio connected to your account.</span><span className="mt-3 inline-block text-sm font-semibold text-[#2C36D9]">Open settings →</span></span>
      </Link>
    </section>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Resources', value: relatedResources.length.toLocaleString(), helper: 'approved for your department' }, { label: 'Study streak', value: '—', helper: 'study consistently to build one' }, { label: 'AI tutor', value: 'Ready', helper: 'study support' }, { label: 'Wisdom points', value: '—', helper: 'check your wallet for balance' },
    ].map((stat) => <div key={stat.label} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71809A]">{stat.label}</div><div className="mt-4 text-3xl font-bold text-[#091F5B]">{stat.value}</div><div className="mt-1 text-sm text-[#5C6982]">{stat.helper}</div></div>)}</div>

    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <OverviewCard title="Your learning path" action="Personalized"><div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><p className="font-semibold text-[#091F5B]">{user?.programme || user?.department || 'Your programme'}</p><p className="mt-1 text-sm text-[#5C6982]">{[user?.institution, user?.faculty, user?.department].filter(Boolean).join(' · ') || 'Complete your academic profile to personalize your learning path.'}</p></div></OverviewCard>
      <OverviewCard title="Quick access" action="Explore"><div className="space-y-3"><Link to="/library" className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937] hover:border-[#6121D0]"><Search size={16} className="text-[#6121D0]" /> Search academic resources</Link><div className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937]"><ShieldCheck size={16} className="text-[#2C36D9]" /> Moderator-approved resources</div><Link to="/ai" className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937] hover:border-[#2C36D9]"><BookOpen size={16} className="text-[#2C36D9]" /> Ask the AI tutor</Link></div></OverviewCard>
    </div>

    <section aria-label="Latest resources for your academic community" className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Your academic community</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Latest resources</h2><p className="mt-1 text-sm text-[#5C6982]">{[user?.institution, user?.faculty, user?.department].filter(Boolean).join(' · ') || 'Set your academic profile to see relevant resources.'}</p></div>
        <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-xs font-semibold text-[#166534]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#16A34A]" /> Live</span><button type="button" onClick={() => setRefreshVersion((value) => value + 1)} disabled={refreshing} aria-label="Refresh latest resources" title="Refresh latest resources" className="rounded-lg border border-[#DCE4EF] p-2 text-[#6121D0] hover:bg-[#F3F0FF] disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button></div>
      </div>
      {loading ? <p className="rounded-xl bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">Loading approved resources for your department…</p>
        : !user?.institution || !user?.faculty || !user?.department ? <div className="rounded-xl border border-dashed border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#4B5563]">Your school, faculty and department need to be set on your account before we can personalize this feed. <Link to="/profile" className="font-semibold text-[#6121D0] underline">Update academic profile</Link>.</div>
        : visibleResources.length === 0 ? <div className="rounded-xl border border-dashed border-[#DCE4EF] bg-[#F8FAFD] p-5"><p className="font-semibold text-[#091F5B]">No approved resources for your department yet.</p><p className="mt-1 text-sm text-[#5C6982]">As resources for your academic community are approved, they will appear here automatically.</p><Link to="/library" className="mt-3 inline-flex text-sm font-semibold text-[#6121D0] hover:underline">Browse the approved library →</Link></div>
        : <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleResources.map((resource) => <article key={resource.id} className="flex min-w-0 flex-col rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 transition hover:border-[#6121D0]/50 hover:shadow-sm"><div className="mb-3 flex items-center justify-between gap-2"><span className="rounded-full bg-[#6121D0]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><span className="text-xs font-semibold text-[#166534]">Approved</span></div><h3 className="font-semibold leading-6 text-[#091F5B]">{resource.title}</h3><p className="mt-2 text-sm text-[#5C6982]">{[resource.course, resource.topic].filter(Boolean).join(' · ') || 'Academic resource'}</p><div className="mt-auto pt-4"><Link to="/library" className="text-sm font-semibold text-[#6121D0] hover:underline">Open in library →</Link></div></article>)}</div>{relatedResources.length > 1 && <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-[#5C6982]">Showing {carouselIndex + 1}–{Math.min(carouselIndex + 3, relatedResources.length)} of {relatedResources.length} relevant resources</p><div className="flex gap-2"><button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous resources" className="rounded-xl border border-[#DCE4EF] bg-white p-2 text-[#091F5B] transition hover:border-[#6121D0] hover:text-[#6121D0]"><ChevronLeft size={18} /></button><button type="button" onClick={() => moveCarousel(1)} aria-label="Next resources" className="rounded-xl border border-[#DCE4EF] bg-white p-2 text-[#091F5B] transition hover:border-[#6121D0] hover:text-[#6121D0]"><ChevronRight size={18} /></button></div></div>}</>}
    </section>
  </div>;
}
