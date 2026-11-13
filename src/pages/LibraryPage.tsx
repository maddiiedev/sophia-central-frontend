import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, FileText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi } from '../api/resources';
import type { Resource } from '../types';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { ReportContentButton } from '../components/ReportContentButton';

type LibraryResource = Resource & { license?: string; attribution?: string; origin?: string; hasFile?: boolean };

export function LibraryPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isModerator = user?.role === 'moderator';
  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer';
  const isModerationRole = isModerator || isAdmin || isReviewer;
  const isPlatformOversightRole = isModerator || isAdmin;
  const [moderationStatus, setModerationStatus] = useState('');
  const departmentOnly = searchParams.get('departmentOnly') === '1';
  const hasDepartmentProfile = Boolean(user?.institution && user?.faculty && user?.department);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [license, setLicense] = useState('');
  const [page, setPage] = useState(1);
  const publicQuery = useQuery({
    queryKey: ['public-academic-library', q, course, topic, license, page, departmentOnly, user?.institution, user?.faculty, user?.department],
    queryFn: () => resourcesApi.publicList({ q, course, topic, license, page, limit: 18, ...(departmentOnly ? { departmentOnly: true, institution: user?.institution, faculty: user?.faculty, department: user?.department } : {}) }),
    enabled: !isPlatformOversightRole && (!departmentOnly || hasDepartmentProfile),
    staleTime: 60_000,
  });
  const platformQuery = useQuery({
    queryKey: ['platform-resource-library', user?.id],
    queryFn: () => resourcesApi.list(),
    enabled: isPlatformOversightRole,
    staleTime: 30_000,
  });
  const platformItems = useMemo(() => (platformQuery.data ?? []).filter((item) => {
    const value = item as LibraryResource;
    const search = [value.title, value.description, value.course, value.topic, value.institution, value.faculty, value.department].filter(Boolean).join(' ').toLowerCase();
    return (!q || search.includes(q.toLowerCase())) &&
      (!course || String(value.course ?? '').toLowerCase().includes(course.toLowerCase())) &&
      (!topic || String(value.topic ?? '').toLowerCase().includes(topic.toLowerCase())) &&
      (!license || String(value.license ?? '').toLowerCase() === license.toLowerCase()) &&
      (!moderationStatus || String(value.moderationStatus || 'pending').toLowerCase() === moderationStatus);
  }), [platformQuery.data, q, course, topic, license, moderationStatus]);
  const items: LibraryResource[] = isPlatformOversightRole
    ? platformItems.slice((page - 1) * 18, page * 18) as LibraryResource[]
    : (publicQuery.data?.items ?? []) as LibraryResource[];
  const total = isPlatformOversightRole ? platformItems.length : publicQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 18));
  const isLoading = isPlatformOversightRole ? platformQuery.isLoading : publicQuery.isLoading;
  const isError = isPlatformOversightRole ? platformQuery.isError : publicQuery.isError;
  const error = isPlatformOversightRole ? platformQuery.error : publicQuery.error;
  const refetch = isPlatformOversightRole ? platformQuery.refetch : publicQuery.refetch;
  const input = 'w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';
  return <main className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-3xl bg-[#2C36D9] p-6 text-white sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/80">Sophis Central · Academic resource library</p>
      <h2 data-hero-middle-heading className="mt-3 text-3xl font-bold !text-white sm:text-4xl">{departmentOnly ? 'Your department library' : isModerator ? 'Resource oversight library' : isAdmin ? 'Platform resource library' : 'Learn openly. Share knowledge.'}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">{isModerator ? 'Inspect lecturer submissions and platform resources across pending, approved, rejected and revision-requested statuses. Open, preview and download attached files; use the moderation workspace for reports and operational decisions.' : isAdmin ? 'View platform resources and their moderation status as part of platform governance.' : isReviewer ? 'Browse approved academic materials here. Pending academic submissions assigned to you are available in your assigned review queue.' : departmentOnly ? 'Approved uploads and open-source research materials classified for your institution, faculty and department appear here.' : 'Explore approved academic notes, past questions, research, projects and learning materials shared by students and lecturers. Browse freely without creating an account.'}</p>
      {!isModerationRole && <div className="mt-5 flex flex-wrap gap-3"><Link to="/onboarding" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#2C36D9]">Join the community</Link></div>}
    </section>
    <section className="grid gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Search and filter resources">
      <label className="relative sm:col-span-2"><span className="sr-only">Search resources</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6121D0]"/><input className={input+' pl-10'} value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search titles, topics, courses…"/></label>
      <input className={input} value={course} onChange={e=>{setCourse(e.target.value);setPage(1)}} placeholder="Course / subject"/>
      <input className={input} value={topic} onChange={e=>{setTopic(e.target.value);setPage(1)}} placeholder="Topic"/>
      <select className={input+' sm:col-span-2 lg:col-span-1'} value={license} onChange={e=>{setLicense(e.target.value);setPage(1)}}><option value="">All licences</option><option value="CC-BY-4.0">Creative Commons BY 4.0</option><option value="CC-BY-SA-4.0">Creative Commons BY-SA 4.0</option><option value="CC0-1.0">CC0 1.0</option><option value="ALL-RIGHTS-RESERVED">All rights reserved</option></select>
      {isPlatformOversightRole && <select aria-label="Filter by moderation status" className={input+' sm:col-span-2 lg:col-span-1'} value={moderationStatus} onChange={e=>{setModerationStatus(e.target.value);setPage(1)}}><option value="">All moderation statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="revision_requested">Revision requested</option></select>}
      <div className="flex items-center justify-end text-xs text-[#5C6982] sm:col-span-2 lg:col-span-3">{total} {isPlatformOversightRole ? `platform resources${moderationStatus ? ` · ${moderationStatus.replace(/_/g, ' ')}` : ' · all moderation statuses'}` : 'approved resources'}</div>
    </section>
    {departmentOnly && !isModerationRole && !hasDepartmentProfile ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-8 text-center"><h3 className="font-semibold text-[#091F5B]">Complete your academic profile</h3><p className="mt-1 text-sm text-[#5C6982]">Set your institution, faculty and department to browse this scoped library.</p><Link to="/profile" className="mt-3 inline-flex text-sm font-semibold text-[#6121D0] underline">Update academic profile</Link></div> : isLoading ? <LoadingState message="Loading the academic resource library…"/> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Unable to load resources.'} onRetry={()=>void refetch()}/> : <>
      {items.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(item=><article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-5 transition hover:border-[#6121D0]"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>{String(item.type).replace(/_/g,' ')}<span className="rounded-full bg-[#F3F0FF] px-2 py-1">{item.origin === 'open_source' ? 'Open source' : 'Community'}</span>{isPlatformOversightRole && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{String(item.moderationStatus || 'pending').replace(/_/g,' ')}</span>}</div><h3 className="mt-3 text-lg font-bold text-[#091F5B]">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{item.description || 'Open this resource for details.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.course,item.topic,item.institution,item.faculty,item.department,item.level].filter(Boolean).join(' · ')}</p><div className="mt-4 border-t border-[#DCE4EF] pt-3"><p className="text-xs text-[#5C6982]">Licence: {String(item.license || 'Not specified')}</p><p className="mt-1 text-xs text-[#5C6982]">Attribution: {String(item.attribution || 'See resource details')}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Link to={isPlatformOversightRole ? `/resource/${encodeURIComponent(item.id)}` : `/open-resource/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/> {isModerator ? 'Open & download' : isAdmin ? 'Open resource' : 'View resource'}</Link>{(user?.role === 'student' || user?.role === 'lecturer') && <ReportContentButton targetType="resource" targetId={item.id} label="Report resource" compact />}</div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-10 text-center"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h3 className="mt-3 font-semibold text-[#091F5B]">No matching resources</h3><p className="mt-1 text-sm text-[#5C6982]">Try another search or check back as materials are added.</p></div>}
      <div className="flex items-center justify-between"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-[#5C6982]">Page {page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>
    </>}
  </main>;
}
