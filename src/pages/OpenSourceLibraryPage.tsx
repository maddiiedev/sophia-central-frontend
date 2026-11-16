import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, FileText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi, type OpenSourceResearchResult, type OpenSourceResearchBulkImportReport } from '../api/resources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

export function OpenSourceLibraryPage() {
  const { user } = useAuth();
  const canImport = user?.role === 'moderator' || user?.role === 'admin';
  const hasDepartment = Boolean(user?.department);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<OpenSourceResearchResult[]>([]);
  const [researchError, setResearchError] = useState('');
  const [researchNotice, setResearchNotice] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [importing, setImporting] = useState('');
  const [selectedResearchIds, setSelectedResearchIds] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportReport, setBulkImportReport] = useState<OpenSourceResearchBulkImportReport | null>(null);
  const library = useQuery({
    queryKey: ['open-source-library', q, page],
    queryFn: () => resourcesApi.openSourceList({ q, page, limit: 18 }),
    staleTime: 60_000,
  });
  const department = useQuery({
    queryKey: ['open-source-library-department', user?.department],
    queryFn: () => resourcesApi.openSourceList({ q: user?.department, page: 1, limit: 10 }),
    enabled: hasDepartment,
    staleTime: 60_000,
  });
  const searchResearch = async () => {
    if (researchQuery.trim().length < 2) { setResearchError('Enter at least 2 characters to search research.'); return; }
    setResearchLoading(true); setResearchError(''); setResearchNotice('');
    try { const result = await resourcesApi.searchOpenSource(researchQuery.trim(), 1, 12); setResearchResults(result.results); setSelectedResearchIds([]); setBulkImportReport(null); if (!result.results.length) setResearchNotice('No matching open-access research was found.'); }
    catch (error) { setResearchError(error instanceof Error ? error.message : 'Research search failed.'); }
    finally { setResearchLoading(false); }
  };
  const importResearch = async (result: OpenSourceResearchResult) => {
    const identifier = result.doi || result.id;
    setImporting(identifier); setResearchError(''); setResearchNotice('');
    try {
      const response = await resourcesApi.importOpenSource(identifier);
      setResearchNotice(response.duplicate ? 'This research item is already in the Open Source Library.' : response.copyStatus === 'copied_to_platform' ? 'Imported with licensed full text.' : 'Imported as metadata with a link to the original source; full text was not copied.');
      await library.refetch(); await department.refetch();
    } catch (error) { setResearchError(error instanceof Error ? error.message : 'Import failed.'); }
    finally { setImporting(''); }
  };

  const importSelectedResearch = async () => {
    const identifiers = researchResults.filter(result => selectedResearchIds.includes(result.id)).map(result => result.doi || result.id).filter((value): value is string => Boolean(value));
    if (!identifiers.length) return;
    setBulkImporting(true); setResearchError(''); setResearchNotice(''); setBulkImportReport(null);
    try {
      const report = await resourcesApi.importOpenSourceBulk(identifiers);
      setBulkImportReport(report);
      setResearchNotice(`Batch complete: ${report.imported} imported, ${report.duplicates} already present, ${report.failed} failed.`);
      setSelectedResearchIds([]);
      await library.refetch(); await department.refetch();
    } catch (error) { setResearchError(error instanceof Error ? error.message : 'Batch import failed.'); }
    finally { setBulkImporting(false); }
  };
  const input = 'w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm text-[#091F5B] outline-none focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';
  const cards = (items: typeof library.data extends undefined ? never[] : NonNullable<typeof library.data>['items']) => items.map(item => <article key={item.id} className="flex min-w-0 flex-col break-words rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>Research paper<span className="rounded-full bg-[#F3F0FF] px-2 py-1">Open source</span></div><h3 className="mt-3 break-words font-bold leading-6 text-[#091F5B]">{item.title}</h3><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#5C6982]">{item.description || 'Bibliographic details and source information are available for this research item.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.department,item.faculty,item.license].filter(Boolean).join(' · ')}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4EF] pt-3"><Link to={`/open-source-resource/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/>View research</Link>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#6121D0]">Original source <ExternalLink size={13}/></a>}</div></article>);
  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-3 sm:px-4 lg:px-6">
    <section className="rounded-2xl bg-[#2C36D9] p-5 text-white sm:p-7 lg:p-9"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/80">Sophis Central · Open research repository</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Open Source Library</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/90">Explore centrally imported open-access research publications from trusted scholarly indexes and repositories. Each record includes source and attribution details. Full text is hosted only when an explicit redistribution licence permits it; otherwise, access the publisher or repository source.</p><Link to="/library" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2C36D9]">Go to Academic Library</Link></section>
    <section className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 sm:grid-cols-[1fr_auto] sm:p-4" aria-label="Search imported open-source research"><form className="flex min-w-0 flex-col gap-2 rounded-xl sm:flex-row sm:overflow-hidden sm:gap-0" role="search" onSubmit={event=>{event.preventDefault();setQ(searchInput.trim());setPage(1);}}><input className={input+' flex-1 sm:rounded-r-none sm:border-r-0'} value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Search imported research by title, author, topic or DOI…"/><button className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-3 py-3 text-sm font-semibold text-white sm:w-auto sm:rounded-l-none sm:rounded-r-xl sm:py-0 sm:px-4" type="submit"><Search size={16}/><span className="hidden sm:inline">Search</span></button></form><p className="self-center text-xs text-[#5C6982]">{library.data?.total ?? 0} imported research records</p></section>
    {hasDepartment && <section className="space-y-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Selected for your department</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Top 10 department-related research materials</h2><p className="mt-1 text-sm text-[#5C6982]">Only open-source research already imported into Sophis Central appears here.</p></div>{department.isLoading ? <p className="rounded-xl border border-[#DCE4EF] bg-white p-4 text-sm text-[#5C6982]">Loading department research…</p> : department.isError ? <p className="rounded-xl border border-[#DCE4EF] bg-white p-4 text-sm text-rose-700">Department research could not be loaded.</p> : department.data?.items.length ? <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{cards(department.data.items.slice(0,10))}</div> : <p className="rounded-xl border border-dashed border-[#DCE4EF] bg-white p-5 text-sm text-[#5C6982]">No imported research is currently tagged to your department.</p>}</section>}
    {canImport && <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Curator tools</p><h2 className="mt-1 text-lg font-bold text-[#091F5B]">Discover and import research</h2><p className="mt-1 text-sm leading-6 text-[#5C6982]">Search OpenAlex by title, topic, author or DOI. Importing adds the record to this library for all platform users. Full-text copying remains limited to explicitly redistributable licences.</p></div><form className="flex min-w-0 overflow-hidden rounded-xl" onSubmit={event=>{event.preventDefault();void searchResearch();}}><input className={input+' rounded-r-none border-r-0'} value={researchQuery} onChange={event=>setResearchQuery(event.target.value)} placeholder="Research title, topic, author or DOI…"/><button disabled={researchLoading || researchQuery.trim().length<2} className="w-full shrink-0 rounded-xl bg-[#6121D0] px-3 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto sm:rounded-l-none sm:rounded-r-xl sm:py-0 sm:px-4">{researchLoading ? 'Searching…' : 'Find research'}</button></form>{researchError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{researchError}</p>}{researchNotice && <p role="status" className="rounded-xl bg-[#F3F0FF] p-3 text-sm text-[#45209A]">{researchNotice}</p>}{bulkImportReport && <div className="rounded-xl border border-[#DCE4EF] p-3"><h3 className="text-sm font-semibold text-[#091F5B]">Batch import report</h3>{bulkImportReport.results.map(result=><p key={result.identifier} className="mt-1 break-all text-xs text-[#5C6982]">{result.identifier} · {result.status}{result.error ? ` · ${result.error}` : ''}</p>)}</div>}{researchResults.length > 0 && <div className="flex min-w-0 flex-col items-stretch justify-between gap-3 rounded-xl bg-[#F8FAFD] p-3 sm:flex-row sm:items-center"><label className="flex items-center gap-2 text-sm font-medium text-[#091F5B]"><input type="checkbox" checked={researchResults.every(result=>selectedResearchIds.includes(result.id))} onChange={event=>setSelectedResearchIds(event.target.checked ? researchResults.map(result=>result.id) : [])}/>Select all results on this page</label><button type="button" disabled={!selectedResearchIds.length || bulkImporting || Boolean(importing)} onClick={()=>void importSelectedResearch()} className="w-full rounded-xl bg-[#2C36D9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">{bulkImporting ? 'Importing batch…' : `Import selected (${selectedResearchIds.length})`}</button></div>}{researchResults.map(result=><article key={result.id} className="min-w-0 break-words rounded-xl border border-[#E5E7EB] p-3 sm:p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Select ${result.title}`} checked={selectedResearchIds.includes(result.id)} onChange={event=>setSelectedResearchIds(current=>event.target.checked ? [...current,result.id] : current.filter(id=>id!==result.id))} className="mt-1 h-4 w-4 accent-[#6121D0]"/><div className="min-w-0 flex-1"><h3 className="font-semibold text-[#091F5B]">{result.title}</h3><p className="mt-1 text-xs text-[#5C6982]">{[result.authors.join(', '),result.publicationYear,result.source,result.licence ? 'Licence: '+result.licence : 'Licence not specified'].filter(Boolean).join(' · ')}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3">{result.landingPageUrl && <a href={result.landingPageUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#6121D0] underline">Original source</a>}<button type="button" disabled={Boolean(importing)} onClick={()=>void importResearch(result)} className="rounded-xl bg-[#2C36D9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{importing === (result.doi || result.id) ? 'Importing…' : 'Import into Open Source Library'}</button></div>{!result.redistributionAllowedByLicence && <p className="mt-2 text-xs text-amber-700">Metadata and source link only; no explicit redistribution licence is provided.</p>}</div></div></article>)}</section>}
    {library.isLoading ? <LoadingState message="Loading imported research…"/> : library.isError ? <ErrorState message={library.error instanceof Error ? library.error.message : 'Unable to load the Open Source Library.'} onRetry={()=>void library.refetch()}/> : <><section className="space-y-3"><div><h2 className="text-xl font-bold text-[#091F5B]">Browse imported research</h2><p className="text-sm text-[#5C6982]">A dedicated collection of imported open-access research—not student or lecturer uploads.</p></div>{library.data?.items.length ? <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{cards(library.data.items)}</div> : <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-8 text-center"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h3 className="mt-2 font-semibold text-[#091F5B]">No imported research found</h3><p className="mt-1 text-sm text-[#5C6982]">Try another search. New research imports will appear here for everyone.</p></div>}</section><div className="flex flex-wrap items-center justify-between gap-3"><button disabled={page<=1} onClick={()=>setPage(value=>value-1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-[#5C6982]">Page {library.data?.page ?? 1} of {library.data?.totalPages ?? 1}</span><button disabled={page >= (library.data?.totalPages ?? 1)} onClick={()=>setPage(value=>value+1)} className="rounded-xl border border-[#DCE4EF] px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div></>}
  </main>;
}
