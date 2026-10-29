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
import type { Resource } from '../types';

type MaterialFilter = 'academic' | 'research';
type AcademicResource = Resource & {
  uploader?: { faculty?: string; department?: string; institution?: string; name?: string; firstName?: string; lastName?: string };
};

function academicValue(resource: Resource, key: 'faculty' | 'department' | 'institution') {
  const academic = resource as AcademicResource;
  if (key === 'institution') return String(academic.uploader?.institution || resource.institution || '').trim();
  return String(academic.uploader?.[key] || '').trim();
}

export function LibraryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('academic');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [researchType, setResearchType] = useState('');
  const [researchDate, setResearchDate] = useState('');
  const [institution, setInstitution] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['resources', 'approved-library'],
    queryFn: () => resourcesApi.list(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const institutions = useMemo(() => Array.from(new Set((data ?? []).map((item) => academicValue(item, 'institution')).filter(Boolean))).sort(), [data]);
  const faculties = useMemo(() => Array.from(new Set((data ?? []).filter((item) => !institution || academicValue(item, 'institution') === institution).map((item) => academicValue(item, 'faculty')).filter(Boolean))).sort(), [data, institution]);
  const departments = useMemo(() => Array.from(new Set((data ?? []).filter((item) => (!institution || academicValue(item, 'institution') === institution) && (!faculty || academicValue(item, 'faculty') === faculty)).map((item) => academicValue(item, 'department')).filter(Boolean))).sort(), [data, institution, faculty]);

  const filteredResources = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    const saved = new Set(user ? getSavedResourceIds(user.id) : []);
    return data.filter((resource) => {
      const status = String(resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending')).toLowerCase();
      // Defensive UI guard; the backend also enforces approved-only library access.
      if (status !== 'approved') return false;
      const isResearch = /research|paper|journal|thesis|dissertation/i.test([resource.type, resource.title, resource.course, resource.topic].filter(Boolean).join(' '));
      if (materialFilter === 'research' && !isResearch) return false;
      if (materialFilter === 'academic' && isResearch) return false;
      if (institution && academicValue(resource, 'institution') !== institution) return false;
      if (faculty && academicValue(resource, 'faculty') !== faculty) return false;
      if (department && academicValue(resource, 'department') !== department) return false;
      if (normalized && ![resource.title, resource.description, resource.course, resource.topic, academicValue(resource, 'institution'), ...(resource.tags ?? []), academicValue(resource, 'faculty'), academicValue(resource, 'department')].filter(Boolean).join(' ').toLowerCase().includes(normalized)) return false;
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
  }, [data, materialFilter, query, course, topic, researchType, researchDate, institution, faculty, department, user]);

  if (isLoading) return <LoadingState message="Loading approved academic and research materials..." />;
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Unable to load approved resources.'} onRetry={() => void refetch()} />;

  const selectClass = 'w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-[#091F5B] outline-none transition focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';

  return <div className="space-y-6">
    <div className="rounded-3xl border border-[#2C36D9]/20 bg-[#2C36D9] p-5 text-white sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/85">Sophis Central · {user?.institution || 'Academic library'}</p><h2 className="mt-2 text-2xl font-semibold text-white">{materialFilter === 'academic' ? 'Academic materials' : 'Research materials'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">{materialFilter === 'academic' ? 'Browse moderator-approved course notes and past questions by school, faculty, department, course or topic.' : 'Browse approved research papers by academic community, topic, research type and date.'}</p></div>{user?.role === 'student' && <Link to="/saved" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"><Bookmark size={16} /> Saved resources</Link>}</div>
      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/30 bg-white px-4 py-3 focus-within:border-white"><Search size={18} className="shrink-0 text-[#6121D0]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, school, faculty, department, course or topic…" aria-label="Search approved resources" className="w-full bg-transparent text-sm text-[#091F5B] outline-none placeholder:text-[#5C6982]" /></label>
    </div>

    <div className="flex flex-wrap items-center gap-2" aria-label="Material type"><button type="button" onClick={() => setMaterialFilter('academic')} aria-pressed={materialFilter === 'academic'} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${materialFilter === 'academic' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9] hover:text-[#6121D0]'}`}>Academic materials</button><button type="button" onClick={() => setMaterialFilter('research')} aria-pressed={materialFilter === 'research'} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${materialFilter === 'research' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9] hover:text-[#6121D0]'}`}>Research materials</button><span className="ml-auto self-center text-xs font-medium text-[#5C6982]">{filteredResources.length} approved result{filteredResources.length === 1 ? '' : 's'}</span></div>

    <section aria-label="Filter approved resources" className="grid gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:grid-cols-2 xl:grid-cols-3">
      <select value={institution} onChange={(event) => { setInstitution(event.target.value); setFaculty(''); setDepartment(''); }} className={selectClass} aria-label="Filter by school or institution"><option value="">All schools / institutions</option>{institutions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <select value={faculty} onChange={(event) => { setFaculty(event.target.value); setDepartment(''); }} className={selectClass} aria-label="Filter by faculty"><option value="">All faculties</option>{faculties.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <select value={department} onChange={(event) => setDepartment(event.target.value)} className={selectClass} aria-label="Filter by department"><option value="">All departments</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      {materialFilter === 'academic' ? <><input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Filter course" className={selectClass} aria-label="Filter by course" /><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Filter topic" className={selectClass} aria-label="Filter by topic" /></> : <><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Filter research topic" className={selectClass} aria-label="Filter by research topic" /><select value={researchType} onChange={(event) => setResearchType(event.target.value)} className={selectClass} aria-label="Filter by research type"><option value="">All research types</option><option value="research_paper">Research paper</option><option value="thesis">Thesis</option><option value="dissertation">Dissertation</option><option value="journal">Journal</option></select><input type="date" value={researchDate} onChange={(event) => setResearchDate(event.target.value)} aria-label="Filter research by date" className={selectClass} /></>}
    </section>

    {filteredResources.length === 0 ? <EmptyState title="No approved resources found" description="Try a different keyword, academic section, filter, or category." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredResources.map((resource) => {
      const research = /research|paper|journal|thesis|dissertation/i.test([resource.type, resource.title].join(' '));
      const facultyValue = academicValue(resource, 'faculty');
      const departmentValue = academicValue(resource, 'department');
      return <button type="button" key={resource.id} onClick={() => navigate(`/resource/${encodeURIComponent(resource.id)}`)} className="group rounded-2xl border border-[#DCE4EF] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#6121D0] hover:bg-[#F8F5FF] focus:outline-none focus:ring-2 focus:ring-[#2C36D9]"><div className="mb-4 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6121D0]">{research ? <FlaskConical size={14} /> : <FileText size={14} />}{research ? 'Research' : 'Academic'}</span><BookOpen size={17} className="text-[#5C6982] transition group-hover:text-[#6121D0]" /></div><h3 className="text-lg font-semibold text-[#091F5B]">{resource.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{resource.description || 'Open this resource to view its details.'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5C6982]">{resource.course && <span>{resource.course}</span>}{resource.topic && <span>· {resource.topic}</span>}{academicValue(resource, 'institution') && <span>· {academicValue(resource, 'institution')}</span>}{facultyValue && <span>· {facultyValue}</span>}{departmentValue && <span>· {departmentValue}</span>}</div><div className="mt-5 flex items-center gap-2 border-t border-[#DCE4EF] pt-3 text-sm font-semibold text-[#6121D0] group-hover:text-[#2C36D9]"><BookOpen size={15} /> Open resource <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></div></button>;
    })}</div>}
  </div>;
}
