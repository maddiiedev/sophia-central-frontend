import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi } from '../api/resources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { ReportContentButton } from '../components/ReportContentButton';

export function LibraryPage() {
  const { user } = useAuth();
  // Match the backend's required catalogue-backed institution ID and academic scope.
  const hasProfile = Boolean(user?.institutionId && user?.faculty?.trim() && user?.department?.trim());
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [course, setCourse] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [topic, setTopic] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [page, setPage] = useState(1);
  const publicQuery = useQuery({
    queryKey: ['academic-library-own-department', q, author, course, topic, page, user?.id, user?.institutionId, user?.institution, user?.faculty, user?.department],
    queryFn: () => resourcesApi.publicList({ q, author, course, topic, page, limit: 18 }),
    enabled: Boolean(user && hasProfile),
    staleTime: 60_000,
  });
  const visibleItems = publicQuery.data?.items ?? [];
  const total = publicQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 18));
  const loading = publicQuery.isLoading;
  const error = publicQuery.error;
  const failed = publicQuery.isError;
  const retry = publicQuery.refetch;
  const input = 'w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-white px-3.5 py-3 text-sm text-[#091F5B] shadow-sm outline-none transition placeholder:text-[#8995A8] hover:border-[#B8C4D6] focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';
  return <main className="library-page mx-auto w-full min-w-0 max-w-7xl space-y-4 px-3 sm:space-y-5 sm:px-4 lg:px-6 2xl:px-8">
    <section className="min-w-0 rounded-2xl bg-[#2C36D9] p-4 text-white shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/80">Sophis Central · Academic Library</p>
      <h1 className="mt-3 break-words text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">Academic Library</h1>
      <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-[#E5E7EB] sm:text-base">Browse approved learning materials contributed by students and lecturers in your own department, including lecture notes, past questions, projects and research.</p>
      <Link to="/open-source-library" className="mt-4 inline-flex max-w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#2C36D9]">Explore Open Source Library</Link>
    </section>
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-sm sm:p-5" aria-label="Search community uploads">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Find academic materials</p><h2 className="mt-1 text-lg font-bold text-[#091F5B]">Search the Academic Library</h2><p className="mt-1 text-sm text-[#5C6982]">Find student and lecturer contributions by resource title, contributor, course code or topic.</p></div>
      <form className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" role="search" onSubmit={event=>{event.preventDefault();setQ(searchInput.trim());setAuthor(authorInput.trim());setCourse(courseInput.trim());setTopic(topicInput.trim());setPage(1);}}>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Resource title / keyword</span><input aria-label="Search resource titles and keywords" className={input} value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="e.g. Human anatomy, lecture notes, cell biology" /></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Contributor / author</span><input aria-label="Filter by contributor or author" className={input} value={authorInput} onChange={event=>setAuthorInput(event.target.value)} placeholder="Enter a lecturer, student or author name" /></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Course code / subject</span><input aria-label="Filter by course code or subject" className={input} value={courseInput} onChange={event=>setCourseInput(event.target.value)} placeholder="e.g. BIO 201 or Human Anatomy" /></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Topic / keywords</span><input aria-label="Filter by topic or keywords" className={input} value={topicInput} onChange={event=>setTopicInput(event.target.value)} placeholder="e.g. skeletal system, revision" /></label>
        <div className="col-span-full flex justify-end"><button type="submit" className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F1DB0] focus:outline-none focus:ring-2 focus:ring-[#6121D0]/30 active:scale-[.99] sm:w-auto sm:min-w-40"><Search size={16}/>Search</button></div>
      </form>
      <p className="break-words text-xs text-[#5C6982]">{total} approved resources in your department · Open-source materials are in the Open Source Library.</p>
    </section>
    {!hasProfile ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-8 text-center"><h2 className="font-semibold text-[#091F5B]">Complete your academic profile</h2><p className="mt-1 text-sm text-[#5C6982]">Set your institution, faculty and department to browse this scoped library.</p><Link to="/profile" className="mt-3 inline-flex text-sm font-semibold text-[#6121D0] underline">Update academic profile</Link></div> : loading ? <LoadingState message="Loading approved department resources…"/> : failed ? <ErrorState message={error instanceof Error ? error.message : 'Unable to load approved department resources.'} onRetry={()=>void retry()}/> : <>
      {visibleItems.length ? <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">{visibleItems.map(item=><article key={item.id} className="flex min-w-0 flex-col break-words rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm transition hover:border-[#6121D0]/50 hover:shadow-md sm:p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>{String(item.type).replace(/_/g,' ')}</div><h2 className="mt-3 break-words text-lg font-bold text-[#091F5B]">{item.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#4B5563]">{item.description || 'Open this resource for details.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.course,item.topic,item.institution,item.faculty,item.department,item.level].filter(Boolean).join(' · ')}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4EF] pt-3"><Link to={user ? `/resource/${encodeURIComponent(item.id)}` : `/open-resource/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/>Open material</Link>{(user?.role === 'student' || user?.role === 'lecturer') && <ReportContentButton targetType="resource" targetId={item.id} label="Report" compact/>}</div></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-5 text-center sm:p-8"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h2 className="mt-3 font-semibold text-[#091F5B]">No community uploads found</h2><p className="mt-1 text-sm text-[#5C6982]">Try another search or check back as students and lecturers contribute materials.</p></div>}
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center"><button disabled={page<=1} onClick={()=>setPage(value=>value-1)} className="w-full rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40 sm:w-auto">Previous</button><span className="text-center text-sm text-[#5C6982]">Page {page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(value=>value+1)} className="w-full rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40 sm:w-auto">Next</button></div>
    </>}
  </main>;
}
