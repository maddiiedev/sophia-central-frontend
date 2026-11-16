import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi } from '../api/resources';
import type { Resource } from '../types';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { ReportContentButton } from '../components/ReportContentButton';

type LibraryResource = Resource & { origin?: string; license?: string; attribution?: string };
export function LibraryPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const isModerator = user?.role === 'moderator';
  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer';
  const oversight = isModerator || isAdmin;
  const reviewRole = oversight || isReviewer;
  const departmentOnly = params.get('departmentOnly') === '1';
  const hasProfile = Boolean(user?.institution && user?.faculty && user?.department);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const publicQuery = useQuery({
    queryKey: ['academic-library-community', q, course, topic, page, departmentOnly, user?.institution, user?.faculty, user?.department],
    queryFn: () => resourcesApi.publicList({ q, course, topic, page, limit: 18, ...(departmentOnly ? { departmentOnly: true, institution: user?.institution, faculty: user?.faculty, department: user?.department } : {}) }),
    enabled: !reviewRole && (!departmentOnly || hasProfile),
    staleTime: 60_000,
  });
  const oversightQuery = useQuery({
    queryKey: ['academic-library-community-oversight', user?.id],
    queryFn: () => resourcesApi.list(),
    enabled: reviewRole,
    staleTime: 30_000,
  });
  const items = useMemo(() => (oversightQuery.data ?? []).filter((item) => {
    const value = item as LibraryResource;
    const haystack = [value.title, value.description, value.course, value.topic, value.institution, value.faculty, value.department].filter(Boolean).join(' ').toLowerCase();
    return value.origin === 'community_upload' && (!q || haystack.includes(q.toLowerCase())) &&
      (!course || String(value.course ?? '').toLowerCase().includes(course.toLowerCase())) &&
      (!topic || String(value.topic ?? '').toLowerCase().includes(topic.toLowerCase())) &&
      (!status || String(value.moderationStatus || 'pending').toLowerCase() === status);
  }), [oversightQuery.data, q, course, topic, status]);
  const visibleItems = reviewRole ? items.slice((page - 1) * 18, page * 18) : publicQuery.data?.items ?? [];
  const total = reviewRole ? items.length : publicQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 18));
  const loading = reviewRole ? oversightQuery.isLoading : publicQuery.isLoading;
  const error = reviewRole ? oversightQuery.error : publicQuery.error;
  const failed = reviewRole ? oversightQuery.isError : publicQuery.isError;
  const retry = reviewRole ? oversightQuery.refetch : publicQuery.refetch;
  const input = 'w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';
  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-5 px-3 sm:px-4 lg:px-6">
    <section className="rounded-2xl bg-[#2C36D9] p-5 text-white sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/80">Sophis Central · Academic Library</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{departmentOnly ? 'Department uploads' : 'Academic Library'}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/90">Browse learning materials contributed by students and lecturers, including lecture notes, past questions, projects and research shared with the Sophis Central community. Centrally imported research is organised separately in the Open Source Library.</p>
      <Link to="/open-source-library" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2C36D9]">Explore Open Source Library</Link>
    </section>
    <section className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Search community uploads">
      <form className="flex min-w-0 flex-col gap-2 rounded-xl sm:col-span-2 sm:flex-row sm:overflow-hidden sm:gap-0" role="search" onSubmit={event => { event.preventDefault(); setQ(searchInput.trim()); setPage(1); }}>
        <label className="min-w-0 flex-1"><span className="sr-only">Search academic uploads</span><input className={input+' flex-1 sm:rounded-r-none sm:border-r-0'} value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Search community uploads…" /></label>
        <button type="submit" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-3 py-3 text-sm font-semibold text-white sm:w-auto sm:rounded-l-none sm:rounded-r-xl sm:py-0 sm:px-4"><Search size={16}/><span className="hidden sm:inline">Search</span></button>
      </form>
      <input className={input} value={course} onChange={event=>{setCourse(event.target.value);setPage(1)}} placeholder="Course / subject"/>
      <input className={input} value={topic} onChange={event=>{setTopic(event.target.value);setPage(1)}} placeholder="Topic"/>
      {oversight && <select aria-label="Filter community upload status" className={input} value={status} onChange={event=>{setStatus(event.target.value);setPage(1)}}><option value="">All submission statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="revision_requested">Revision requested</option></select>}
      <p className="self-center text-xs text-[#5C6982] sm:col-span-2 lg:col-span-3">{total} {reviewRole ? 'community submissions' : 'approved community uploads'} · Open-source imports are excluded.</p>
    </section>
    {departmentOnly && !hasProfile && !reviewRole ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-8 text-center"><h2 className="font-semibold text-[#091F5B]">Complete your academic profile</h2><p className="mt-1 text-sm text-[#5C6982]">Set your institution, faculty and department to browse this scoped library.</p><Link to="/profile" className="mt-3 inline-flex text-sm font-semibold text-[#6121D0] underline">Update academic profile</Link></div> : loading ? <LoadingState message="Loading community academic uploads…"/> : failed ? <ErrorState message={error instanceof Error ? error.message : 'Unable to load community uploads.'} onRetry={()=>void retry()}/> : <>
      {visibleItems.length ? <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleItems.map(item=><article key={item.id} className="flex min-w-0 flex-col break-words rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>{String(item.type).replace(/_/g,' ')}{reviewRole && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{String(item.moderationStatus || 'pending').replace(/_/g,' ')}</span>}</div><h2 className="mt-3 break-words text-lg font-bold text-[#091F5B]">{item.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#4B5563]">{item.description || 'Open this resource for details.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.course,item.topic,item.institution,item.faculty,item.department,item.level].filter(Boolean).join(' · ')}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4EF] pt-3"><Link to={reviewRole ? `/resource/${encodeURIComponent(item.id)}` : `/open-resource/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/>{isModerator ? 'Open submission' : 'View material'}</Link>{!reviewRole && (user?.role === 'student' || user?.role === 'lecturer') && <ReportContentButton targetType="resource" targetId={item.id} label="Report" compact/>}</div></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-10 text-center"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h2 className="mt-3 font-semibold text-[#091F5B]">No community uploads found</h2><p className="mt-1 text-sm text-[#5C6982]">Try another search or check back as students and lecturers contribute materials.</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3"><button disabled={page<=1} onClick={()=>setPage(value=>value-1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-[#5C6982]">Page {page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(value=>value+1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>
    </>}
  </main>;
}
