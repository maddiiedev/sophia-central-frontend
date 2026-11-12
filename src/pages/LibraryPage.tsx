import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, FileText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi } from '../api/resources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

export function LibraryPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const departmentOnly = searchParams.get('departmentOnly') === '1';
  const hasDepartmentProfile = Boolean(user?.institution && user?.faculty && user?.department);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [license, setLicense] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['public-academic-library', q, course, topic, license, page, departmentOnly, user?.institution, user?.faculty, user?.department],
    queryFn: () => resourcesApi.publicList({ q, course, topic, license, page, limit: 18, ...(departmentOnly ? { departmentOnly: true, institution: user?.institution, faculty: user?.faculty, department: user?.department } : {}) }),
    enabled: !departmentOnly || hasDepartmentProfile,
    staleTime: 60_000,
  });
  const input = 'w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';
  return <main className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-3xl bg-[#2C36D9] p-6 text-white sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/80">Sophis Central · Open academic community</p>
      <h2 className="mt-3 text-3xl font-bold !text-white sm:text-4xl">{departmentOnly ? "Your department library" : "Learn openly. Share knowledge."}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">{departmentOnly ? "Approved uploads and open-source research materials classified for your institution, faculty and department appear here." : "Explore approved academic notes, past questions, research, projects and learning materials shared by students and lecturers. Browse freely without creating an account."}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link to="/onboarding" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#2C36D9]">Join the community</Link></div>
    </section>
    <section className="grid gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Search and filter public resources">
      <label className="relative sm:col-span-2"><span className="sr-only">Search resources</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6121D0]"/><input className={input+' pl-10'} value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search titles, topics, courses…"/></label>
      <input className={input} value={course} onChange={e=>{setCourse(e.target.value);setPage(1)}} placeholder="Course / subject"/>
      <input className={input} value={topic} onChange={e=>{setTopic(e.target.value);setPage(1)}} placeholder="Topic"/>
      <select className={input+' sm:col-span-2 lg:col-span-1'} value={license} onChange={e=>{setLicense(e.target.value);setPage(1)}}><option value="">All licences</option><option value="CC-BY-4.0">Creative Commons BY 4.0</option><option value="CC-BY-SA-4.0">Creative Commons BY-SA 4.0</option><option value="CC0-1.0">CC0 1.0</option><option value="ALL-RIGHTS-RESERVED">All rights reserved</option></select>
      <div className="flex items-center justify-end text-xs text-[#5C6982] sm:col-span-2 lg:col-span-3">{query.data?.total ?? 0} approved resources</div>
    </section>
    {departmentOnly && !hasDepartmentProfile ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-8 text-center"><h3 className="font-semibold text-[#091F5B]">Complete your academic profile</h3><p className="mt-1 text-sm text-[#5C6982]">Set your institution, faculty and department to browse this scoped library.</p><Link to="/profile" className="mt-3 inline-flex text-sm font-semibold text-[#6121D0] underline">Update academic profile</Link></div> : query.isLoading ? <LoadingState message="Loading the public academic library…"/> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load public resources.'} onRetry={()=>void query.refetch()}/> : <>
      {query.data?.items.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data.items.map(item=><article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-5 transition hover:border-[#6121D0]"><div className="flex items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>{String(item.type).replace(/_/g,' ')}</div><h3 className="mt-3 text-lg font-bold text-[#091F5B]">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{item.description || 'Open this resource for details.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.course,item.topic,item.institution,item.faculty,item.department,item.level].filter(Boolean).join(' · ')}</p><div className="mt-4 border-t border-[#DCE4EF] pt-3"><p className="text-xs text-[#5C6982]">Source: {item.origin === 'open_source' ? 'Open-source research' : 'Community contribution'}</p><p className="mt-1 text-xs text-[#5C6982]">Licence: {String(item.license || 'Not specified')}</p><p className="mt-1 text-xs text-[#5C6982]">Attribution: {String(item.attribution || 'See resource details')}</p><Link to={`/open-resource/${encodeURIComponent(item.id)}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/> View resource</Link></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-10 text-center"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h3 className="mt-3 font-semibold text-[#091F5B]">No matching public resources yet</h3><p className="mt-1 text-sm text-[#5C6982]">Try another search or check back as the community contributes.</p></div>}
      <div className="flex items-center justify-between"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-[#5C6982]">Page {query.data?.page ?? page} of {query.data?.totalPages ?? 1}</span><button disabled={page>=(query.data?.totalPages ?? 1)} onClick={()=>setPage(p=>p+1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>
    </>}
  </main>;
}
