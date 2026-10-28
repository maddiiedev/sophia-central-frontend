import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, UserRound, Settings } from 'lucide-react';
import { OverviewCard, UserBadge } from '../components/layout/AppShell';
import { mockResources } from '../lib/mock-data';
import { sophiaApi } from '../api/sophiaApi';
import { useAuth } from '../context/AuthContext';
import type { Resource } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const firstName = user?.firstName?.trim() || user?.name?.trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    const fetchResources = async () => {
      try { setLoading(true); setError(''); const data = await sophiaApi.resources.list(); setResources(Array.isArray(data) ? data : mockResources); }
      catch { setError('Could not reach the backend. Showing fallback data instead.'); setResources(mockResources); }
      finally { setLoading(false); }
    };
    void fetchResources();
  }, []);

  return <div className="space-y-6">
    <section className="rounded-3xl bg-[#2C36D9] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">Study dashboard</p><h2 className="mt-2 text-3xl font-bold">Your academic momentum is building.</h2><p className="mt-2 text-sm text-white/90">Welcome back, {firstName}.</p></div>
        <UserBadge />
      </div>
    </section>

    {error && <div role="status" className="rounded-2xl border border-[#E6B800]/30 bg-[#FFF8D9] px-4 py-3 text-sm text-[#6B5200]">{error}</div>}

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
      { label: 'Resources', value: '12.4k', helper: 'verified items' }, { label: 'Study streak', value: '14 days', helper: 'best in your cohort' }, { label: 'AI tutor', value: '4.8k', helper: 'questions answered' }, { label: 'Wisdom points', value: '1,420', helper: 'ready to redeem' },
    ].map((stat) => <div key={stat.label} className="rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71809A]">{stat.label}</div><div className="mt-4 text-3xl font-bold text-[#091F5B]">{stat.value}</div><div className="mt-1 text-sm text-[#5C6982]">{stat.helper}</div></div>)}</div>

    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <OverviewCard title="Your learning path" action="Week 2"><div className="space-y-4">{['Computer Engineering', 'Software Engineering', 'Artificial Intelligence', 'Research Methodology'].map((course, idx) => <div key={course} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="mb-2 flex items-center justify-between"><div><div className="font-medium text-[#091F5B]">{course}</div><div className="text-sm text-[#5C6982]">CPE {idx + 2}1 • {idx + 2}00L</div></div><div className="font-semibold text-[#6121D0]">{72 + idx * 6}%</div></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF2F7]"><div className="h-full rounded-full bg-[#6121D0]" style={{ width: `${72 + idx * 6}%` }} /></div></div>)}</div></OverviewCard>
      <OverviewCard title="Quick access" action="Explore"><div className="space-y-3"><Link to="/library" className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937] hover:border-[#6121D0]"><Search size={16} className="text-[#6121D0]" /> Search academic resources</Link><div className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937]"><ShieldCheck size={16} className="text-[#2C36D9]" /> Check resource verification</div><Link to="/ai" className="flex items-center gap-3 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#1F2937] hover:border-[#2C36D9]"><Search size={16} className="text-[#2C36D9]" /> Ask the AI tutor</Link></div></OverviewCard>
    </div>

    <OverviewCard title="Latest resources" action={loading ? 'Syncing...' : 'Live'}>{loading ? <div className="text-[#5C6982]">Loading your feed…</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.slice(0, 6).map((resource) => <div key={resource.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="mb-2 flex items-center justify-between gap-3"><span className="rounded-full bg-[#6121D0]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6121D0]">{resource.type.replace('_', ' ')}</span>{resource.isVerified ? <span className="text-[#2C36D9]">Verified</span> : <span className="text-[#A66B00]">Pending</span>}</div><div className="text-lg font-medium text-[#091F5B]">{resource.title}</div><div className="mt-2 text-sm text-[#5C6982]">{resource.course} • {resource.topic}</div></div>)}</div>}</OverviewCard>
  </div>;
}
