import { useState } from 'react';
import { BookOpen, ExternalLink, FileText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourcesApi, type OpenSourceResearchResult, type OpenSourceResearchSearchPage } from '../api/resources';

export function OpenSourceLibraryPage() {
  const { user } = useAuth();
  const canImport = user?.role === 'moderator' || user?.role === 'admin';
  const [searchInput, setSearchInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [results, setResults] = useState<OpenSourceResearchSearchPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState('');
  const input = 'w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-white px-3.5 py-3 text-sm text-[#091F5B] shadow-sm outline-none transition placeholder:text-[#8995A8] hover:border-[#B8C4D6] focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';

  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filters = { q: searchInput.trim(), author: authorInput.trim(), course: courseInput.trim(), topic: topicInput.trim() };
    if (Object.values(filters).every(value => value.length < 2)) { setError('Enter at least 2 characters in one or more search fields.'); return; }
    setLoading(true); setError(''); setNotice(''); setResults(null);
    try {
      const response = await resourcesApi.searchOpenSource(filters, 1, 12);
      setResults(response);
      if (!response.results.length && !response.importedResults.length) setNotice('No matching open-access research was found. Try broader keywords or another search field.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Research search failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const importResearch = async (item: OpenSourceResearchResult) => {
    const identifier = item.doi || item.id;
    setImporting(identifier); setError(''); setNotice('');
    try {
      const response = await resourcesApi.importOpenSource(identifier);
      setNotice(response.duplicate ? 'This research item is already stored in Sophis Central.' : response.copyStatus === 'copied_to_platform' ? 'Research imported with licensed full text.' : 'Research metadata imported with a link to its original source. Full text was not copied.');
      setResults(await resourcesApi.searchOpenSource({ q: searchInput.trim(), author: authorInput.trim(), course: courseInput.trim(), topic: topicInput.trim() }, 1, 12));
    } catch (err) { setError(err instanceof Error ? err.message : 'Import failed.'); }
    finally { setImporting(''); }
  };

  return <main className="open-source-library-page mx-auto w-full min-w-0 max-w-7xl space-y-4 px-3 sm:space-y-6 sm:px-4 lg:px-6 2xl:px-8">
    <section className="min-w-0 rounded-2xl bg-[#2C36D9] p-4 text-white shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/80">Sophis Central · Open research discovery</p>
      <h1 className="mt-3 break-words text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">Open Source Library</h1>
      <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-[#E5E7EB] sm:text-base">Discover open-access academic research from around the world, alongside relevant research available on Sophis Central.</p>
      <Link to="/library" className="mt-4 inline-flex max-w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#2C36D9]">Go to Academic Library</Link>
    </section>
    <section className="min-w-0 space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-3 shadow-sm sm:p-5" aria-label="Search open-access research">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Global research discovery</p><h2 className="mt-1 text-lg font-bold text-[#091F5B]">Search academic research</h2><p className="mt-1 text-sm leading-6 text-[#5C6982]">Search by title, DOI, keywords, author, course code, subject or research topic. Sophis Central searches external open-access research and its own imported research records together.</p></div>
      <form className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" role="search" onSubmit={search}>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Research title / DOI / keyword</span><input aria-label="Search research titles, DOI and keywords" className={input} value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="e.g. DOI 10.1038…, AI in education"/></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Author</span><input aria-label="Search by author" className={input} value={authorInput} onChange={event=>setAuthorInput(event.target.value)} placeholder="Author or researcher name"/></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Course code / subject</span><input aria-label="Search by course code or subject" className={input} value={courseInput} onChange={event=>setCourseInput(event.target.value)} placeholder="e.g. CSC 301 or Computer Science"/></label>
        <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#52617A]">Research topic / keywords</span><input aria-label="Search by research topic or keywords" className={input} value={topicInput} onChange={event=>setTopicInput(event.target.value)} placeholder="e.g. machine learning, public health"/></label>
        <div className="col-span-full flex justify-end"><button type="submit" disabled={loading} className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F1DB0] disabled:opacity-50 sm:w-auto sm:min-w-40"><Search size={16}/>{loading ? 'Searching…' : 'Search research'}</button></div>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-[#F3F0FF] p-3 text-sm text-[#45209A]">{notice}</p>}
    </section>
    {results && <>
      <section className="space-y-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Sophis Central</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Research available on Sophis Central ({results.importedResults.length})</h2></div>
        {results.importedResults.length ? <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">{results.importedResults.map(item=><article key={item.id} className="flex min-w-0 flex-col break-words rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6121D0]"><FileText size={15}/>Available on Sophis Central</div><h3 className="mt-3 break-words font-bold leading-6 text-[#091F5B]">{item.title}</h3><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#5C6982]">{item.description || 'Bibliographic details and source information are available for this research item.'}</p><p className="mt-3 text-xs text-[#5C6982]">{[item.attribution,item.license].filter(Boolean).join(' · ')}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4EF] pt-3"><Link to={`/open-source-resource/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><BookOpen size={15}/>View research</Link>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#6121D0]">Original source <ExternalLink size={13}/></a>}</div></article>)}</div> : <p className="rounded-xl border border-dashed border-[#DCE4EF] bg-white p-5 text-sm text-[#5C6982]">No matching research is currently available on Sophis Central. Explore related research below.</p>}
      </section>
      <section className="space-y-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6121D0]">Research from academic databases and repositories</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">Open-access research ({results.results.length})</h2><p className="text-sm text-[#5C6982]">Explore research from OpenAlex, Crossref, Europe PMC, PubMed, CORE and DOAJ. Each result identifies its source and links to the original record.</p></div>
        {results.results.length ? results.results.map(item=><article key={item.id} className="min-w-0 break-words rounded-xl border border-[#DCE4EF] bg-white p-4 shadow-sm"><h3 className="font-semibold leading-6 text-[#091F5B]">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[#5C6982]">{[item.authors.join(', '),item.publicationYear,item.source,item.index].filter(Boolean).join(' · ')}</p><div className="mt-3 flex flex-wrap items-center gap-3">{item.landingPageUrl && <a href={item.landingPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6121D0]">Original source <ExternalLink size={13}/></a>}{item.doi && <a href={item.doi.startsWith('http') ? item.doi : `https://doi.org/${item.doi}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#52617A]">DOI</a>}{canImport && (item.doi || item.id.includes('openalex.org/W')) && <button type="button" disabled={Boolean(importing)} onClick={()=>void importResearch(item)} className="rounded-lg bg-[#2C36D9] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{importing === (item.doi || item.id) ? 'Importing…' : 'Import to Sophis Central'}</button>}</div><p className="mt-2 text-xs text-[#69758A]">{item.redistributionAllowedByLicence ? `Licence: ${item.licence}` : 'Full-text reuse rights have not been confirmed. Visit the original source to review its access and licence terms.'}</p></article>) : <p className="rounded-xl border border-dashed border-[#DCE4EF] bg-white p-5 text-sm text-[#5C6982]">No external matches for this search.</p>}
      </section>
    </>}
    {!results && !loading && <div className="rounded-2xl border border-dashed border-[#DCE4EF] bg-white p-8 text-center"><BookOpen className="mx-auto text-[#6121D0]" size={28}/><h3 className="mt-2 font-semibold text-[#091F5B]">Start with a research search</h3><p className="mt-1 text-sm text-[#5C6982]">Search to find open-access research and related materials available on Sophis Central.</p></div>}
  </main>;
}
