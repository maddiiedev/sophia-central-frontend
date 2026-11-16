import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

export function OpenSourceResourcePage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const resource = useQuery({ queryKey: ['open-source-resource', id], queryFn: () => resourcesApi.openSourceById(id), enabled: Boolean(id) });
  const file = useQuery({
    queryKey: ['open-source-resource-file', id],
    queryFn: () => resourcesApi.openSourceFileUrl(id),
    enabled: Boolean(id) && Boolean(resource.data?.hasFile) && Boolean(user),
    retry: false,
  });
  if (resource.isLoading) return <LoadingState message="Loading open research record…"/>;
  if (resource.isError || !resource.data) return <ErrorState message={resource.error instanceof Error ? resource.error.message : 'This research record is unavailable.'} onRetry={()=>void resource.refetch()}/>;
  const item = resource.data;
  return <main className="mx-auto w-full min-w-0 max-w-4xl space-y-5 px-3 sm:px-4">
    <Link to="/open-source-library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><ArrowLeft size={16}/>Back to Open Source Library</Link>
    <article className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white">
      <header className="bg-[#F8FAFD] p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-[#6121D0]">Imported open-access research</p><h1 className="mt-3 break-words text-2xl font-bold text-[#091F5B] sm:text-3xl">{item.title}</h1><p className="mt-3 text-sm text-[#5C6982]">{[item.department,item.faculty].filter(Boolean).join(' · ')}</p></header>
      <div className="min-w-0 space-y-6 p-4 sm:p-8">
        <section><h2 className="font-semibold text-[#091F5B]">Abstract / description</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#374151]">{item.description || 'The source index did not provide an abstract. Use the original source link for the full bibliographic record.'}</p></section>
        <section className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><h2 className="font-semibold text-[#091F5B]">Licence and attribution</h2><p className="mt-2 text-sm text-[#4B5563]">Licence: {String(item.license || 'Not specified')}</p><p className="mt-1 text-sm text-[#4B5563]">Attribution: {String(item.attribution || 'Not supplied')}</p><p className="mt-2 text-xs leading-5 text-[#5C6982]">A record being open access does not automatically permit redistribution. Follow the source licence and attribution requirements.</p></section>
        <section className="space-y-3"><h2 className="font-semibold text-[#091F5B]">Access research</h2>{item.hasFile ? !user ? <p className="text-sm text-[#5C6982]">Sign in to access the licensed full-text file. <Link to="/login" className="font-semibold text-[#6121D0] underline">Sign in</Link>.</p> : file.isLoading ? <p className="text-sm text-[#5C6982]">Preparing secure file access…</p> : file.isError ? <p className="text-sm text-rose-700">{file.error instanceof Error ? file.error.message : 'Unable to prepare the file.'}</p> : file.data?.url ? <a href={file.data.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white"><BookOpen size={16}/>Open licensed full text<ExternalLink size={15}/></a> : null : <p className="text-sm leading-6 text-[#5C6982]">Sophis Central stores the bibliographic record and source link only. The full text was not copied because explicit redistribution permission was not confirmed.</p>}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] underline">Open original publisher or repository source<ExternalLink size={14}/></a>}</section>
      </div>
    </article>
  </main>;
}
