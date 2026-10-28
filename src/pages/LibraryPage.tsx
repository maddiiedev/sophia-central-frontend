import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Bookmark, FileText, FlaskConical, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { getSavedResourceIds } from '../lib/savedResources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { EmptyState } from '../components/states/EmptyState';

type MaterialFilter = 'academic' | 'research';

export function LibraryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('academic');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [researchType, setResearchType] = useState('');
  const [researchDate, setResearchDate] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: () => resourcesApi.list(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const filteredResources = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    const saved = new Set(user ? getSavedResourceIds(user.id) : []);
    const canSeePending = user?.role === 'lecturer' || user?.role === 'admin' || user?.role === 'moderator';
    return data.filter((resource) => {
      const isResearch = /research|paper|journal|thesis|dissertation/i.test([resource.type, resource.title, resource.course, resource.topic].filter(Boolean).join(' '));
      if (materialFilter === 'research' && !isResearch) return false;
      if (materialFilter === 'academic' && isResearch) return false;
      const status = String(resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending')).toLowerCase();
      if (!canSeePending && status !== 'approved' && resource.isVerified !== true) return false;
      if (normalized && ![resource.title, resource.description, resource.course, resource.topic, resource.institution, ...(resource.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(normalized)) return false;
      if (materialFilter === 'academic') {
        if (course && !String(resource.course ?? '').toLowerCase().includes(course.trim().toLowerCase())) return false;
        if (topic && !String(resource.topic ?? '').toLowerCase().includes(topic.trim().toLowerCase())) return false;
      } else {
        if (topic && !String(resource.topic ?? '').toLowerCase().includes(topic.trim().toLowerCase())) return false;
        if (researchType && !String(resource.type ?? '').toLowerCase().includes(researchType.trim().toLowerCase())) return false;
        if (researchDate && resource.createdAt && new Date(resource.createdAt).toISOString().slice(0, 10) !== researchDate) return false;
      }
      void saved;
      return true;
    });
  }, [data, materialFilter, query, course, topic, researchType, researchDate, user]);

  if (isLoading) return <LoadingState message="Loading academic and research materials..." />;
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Unable to load resources.'} onRetry={() => void refetch()} />;

  return <div className="space-y-6">
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-violet-950/50 to-slate-900 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-violet-200">Sophis Central · {user?.institution || 'Your institution'}</p><h2 className="mt-2 text-2xl font-semibold text-white">{materialFilter === 'academic' ? 'Academic materials' : 'Research materials'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{materialFilter === 'academic' ? 'Search course notes and past questions by course or topic.' : 'Search research papers by topic, research type and date.'}</p></div>{user?.role === 'student' && <Link to="/saved" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-violet-400"><Bookmark size={16} /> Saved resources</Link>}</div>
      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 focus-within:border-violet-400"><Search size={18} className="shrink-0 text-violet-300" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, course, topic or keyword..." aria-label="Search resources" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /></label>
    </div>

    <div className="flex flex-wrap gap-2" aria-label="Material type"><button type="button" onClick={() => setMaterialFilter('academic')} aria-pressed={materialFilter === 'academic'} className={`rounded-full border px-4 py-2 text-sm ${materialFilter === 'academic' ? 'border-violet-400 bg-violet-500/15 text-violet-100' : 'border-slate-700 text-slate-300'}`}>Academic materials</button><button type="button" onClick={() => setMaterialFilter('research')} aria-pressed={materialFilter === 'research'} className={`rounded-full border px-4 py-2 text-sm ${materialFilter === 'research' ? 'border-violet-400 bg-violet-500/15 text-violet-100' : 'border-slate-700 text-slate-300'}`}>Research materials</button><span className="ml-auto self-center text-xs text-slate-500">{filteredResources.length} result{filteredResources.length === 1 ? '' : 's'}</span></div>

    <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
      {materialFilter === 'academic' ? <><input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Filter course" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Filter topic" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /><div className="flex items-center text-xs text-slate-500">Course + topic filters follow the wireframe.</div></> : <><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Filter research topic" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /><select value={researchType} onChange={(event) => setResearchType(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">All research types</option><option value="research_paper">Research paper</option><option value="thesis">Thesis</option><option value="dissertation">Dissertation</option><option value="journal">Journal</option></select><input type="date" value={researchDate} onChange={(event) => setResearchDate(event.target.value)} aria-label="Filter research by date" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /></>}
    </div>

    {filteredResources.length === 0 ? <EmptyState title="No resources found" description="Try a different keyword, filter, or category." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredResources.map((resource) => { const research = /research|paper|journal|thesis|dissertation/i.test([resource.type, resource.title].join(' ')); return <button type="button" key={resource.id} onClick={() => navigate(`/resource/${encodeURIComponent(resource.id)}`)} className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-500/60 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"><div className="mb-4 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-200">{research ? <FlaskConical size={14} /> : <FileText size={14} />}{research ? 'Research' : 'Academic'}</span><BookOpen size={17} className="text-slate-500 group-hover:text-violet-200" /></div><h3 className="text-lg font-semibold text-white">{resource.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{resource.description || 'Open this resource to view its details.'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">{resource.course && <span>{resource.course}</span>}{resource.topic && <span>· {resource.topic}</span>}{resource.institution && <span>· {resource.institution}</span>}</div><div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-3 text-sm font-medium text-violet-200"><BookOpen size={15} /> Open resource <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></div></button>; })}</div>}
  </div>;
}
