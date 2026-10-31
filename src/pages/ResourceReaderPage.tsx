import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookOpen, Download, ExternalLink } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { getSavedResourceIds, setResourceSaved } from '../lib/savedResources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import type { Resource } from '../types';

type ResourceWithFile = Resource & { fileUrl?: string; file_url?: string; url?: string; contentUrl?: string; content_url?: string };

export function ResourceReaderPage() {
  const { id = '' } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [resource, setResource] = useState<ResourceWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [fileAction, setFileAction] = useState<'open' | 'download' | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const result = await resourcesApi.byId(id);
        if (active) {
          setResource(result as ResourceWithFile);
          if (user) setSaved(getSavedResourceIds(user.id).includes(id));
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to open this resource.');
      } finally { if (active) setLoading(false); }
    };
    if (isAuthenticated && id) void load();
    return () => { active = false; };
  }, [id, isAuthenticated, user]);

  if (loading) return <LoadingState message="Opening approved resource..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!resource) return <div className="rounded-2xl border border-[#DCE4EF] bg-white p-6 text-[#091F5B]">Resource not found. <Link to="/library" className="font-semibold text-[#6121D0] underline">Return to library</Link></div>;

  const fileUrl = resource.fileUrl || resource.file_url || resource.contentUrl || resource.content_url || resource.url;
  const accessFile = async (download: boolean) => {
    if (!fileUrl || fileAction) return;
    const newTab = download ? null : window.open('about:blank', '_blank');
    setFileAction(download ? 'download' : 'open');
    setError('');
    try {
      const result = await resourcesApi.fileUrl(id, download);
      if (download) window.location.assign(result.url);
      else if (newTab) newTab.location.href = result.url;
      else window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      newTab?.close();
      setError(cause instanceof Error ? cause.message : 'Unable to access this resource file.');
    } finally { setFileAction(null); }
  };
  const status = resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending');

  return <div className="mx-auto max-w-4xl space-y-5">
    <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] transition hover:text-[#2C36D9]"><ArrowLeft size={16} /> Back to approved library</Link>
    <article className="overflow-hidden rounded-3xl border border-[#DCE4EF] bg-white shadow-sm">
      <div className="border-b border-[#DCE4EF] bg-[#F8FAFD] p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 font-semibold uppercase tracking-wide text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><span className={`rounded-full px-3 py-1 font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}`}>{status}</span></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-semibold text-[#091F5B] sm:text-3xl">{resource.title}</h2><p className="mt-3 text-sm text-[#5C6982]">{[resource.course, resource.topic, resource.level, resource.institution].filter(Boolean).join(' · ')}</p></div>{user?.role === 'student' && <button type="button" onClick={() => { if (!user) return; const next = !saved; setResourceSaved(user.id, id, next); setSaved(next); }} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${saved ? 'border-[#6121D0] bg-[#F3F0FF] text-[#6121D0]' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#6121D0] hover:text-[#6121D0]'}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save resource'}</button>}</div>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        <section><h3 className="mb-2 flex items-center gap-2 font-semibold text-[#091F5B]"><BookOpen size={17} className="text-[#6121D0]" /> Resource details</h3><p className="whitespace-pre-wrap leading-7 text-[#374151]">{resource.description || 'No description was provided for this resource.'}</p></section>
        {resource.tags?.length ? <section><h3 className="mb-2 text-sm font-semibold text-[#091F5B]">Topics</h3><div className="flex flex-wrap gap-2">{resource.tags.map(tag => <span key={tag} className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1 text-xs text-[#4B5563]">{tag}</span>)}</div></section> : null}
        {fileUrl ? <div className="flex flex-wrap gap-3 border-t border-[#DCE4EF] pt-5"><button type="button" onClick={() => void accessFile(false)} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-60"><ExternalLink size={16} /> {fileAction === 'open' ? 'Opening…' : 'Open resource file'}</button><button type="button" onClick={() => void accessFile(true)} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60"><Download size={16} /> {fileAction === 'download' ? 'Preparing…' : 'Download'}</button></div> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The resource details are available, but no downloadable file URL was returned by the API.</p>}
      </div>
    </article>
  </div>;
}
