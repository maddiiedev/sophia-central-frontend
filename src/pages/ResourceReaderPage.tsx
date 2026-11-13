import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookOpen, Download, FileText } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import type { Resource } from '../types';
import { ReportContentButton } from '../components/ReportContentButton';

type ResourceWithFile = Resource & { fileUrl?: string; file_url?: string; url?: string; contentUrl?: string; content_url?: string; hasFile?: boolean; downloadRestricted?: boolean; accessLevel?: string; canDownload?: boolean };

export function ResourceReaderPage() {
  const { id = '' } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [resource, setResource] = useState<ResourceWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);
  const [fileAction, setFileAction] = useState<'open' | 'download' | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const [restrictionBusy, setRestrictionBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const result = await resourcesApi.byId(id);
        if (active) {
          setResource(result as ResourceWithFile);
          if (user) {
            const savedResources = await resourcesApi.saved();
            if (active) setSaved(savedResources.some((item) => item.id === id));
            if (['student', 'lecturer'].includes(user.role)) {
              const downloadedResources = await resourcesApi.downloaded();
              const hasDownloaded = downloadedResources.some((item) => item.id === id);
              if (active) {
                setDownloaded(hasDownloaded);
                if (user.role === 'student' && !hasDownloaded && (result as ResourceWithFile).hasFile) setDownloadPromptOpen(true);
              }
            }
          }
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

  const hasFile = Boolean(resource.hasFile || resource.fileUrl || resource.file_url || resource.contentUrl || resource.content_url || resource.url);
  const reviewerAccess = ['reviewer', 'moderator', 'admin'].includes(user?.role ?? '');
  const privilegedPreviewOnly = user?.role === 'reviewer';
  const moderatorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';
  const resourceDownloadRestricted = Boolean(resource.downloadRestricted || resource.canDownload === false || String(resource.accessLevel || '').toLowerCase() === 'restricted');
  const ownLecturerResource = user?.role === 'lecturer' && resource.uploadedBy === user.id;
  const downloadRestricted = resourceDownloadRestricted && !moderatorOrAdmin && !ownLecturerResource;
  const canDownload = !privilegedPreviewOnly && (moderatorOrAdmin || !downloadRestricted);
  const accessFile = async (download: boolean) => {
    if (!hasFile || fileAction || (download && !canDownload)) return;
    if (download && !canDownload) return;
    if (!download && user?.role === 'student' && !downloaded && !ownLecturerResource) {
      setDownloadPromptOpen(true);
      return;
    }
    if (!download && user?.role === 'lecturer' && !downloaded && !ownLecturerResource) {
      setError('Download this resource in-app before viewing it.');
      return;
    }
    setFileAction(download ? 'download' : 'open');
    setError('');
    try {
      if (download) {
        await resourcesApi.downloadInApp(id);
        setDownloaded(true);
      }
      const result = await resourcesApi.fileUrl(id);
      const officeFile = /\.(doc|docx|ppt|pptx)$/i.test(result.filename);
      setViewerUrl(officeFile
        ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(result.url)}`
        : result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to access this resource file.');
    } finally { setFileAction(null); }
  };
  const status = resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending');
  const toggleSaved = async () => {
    if (!user || fileAction) return;
    setFileAction('download'); setError('');
    try {
      if (saved) await resourcesApi.unsave(id); else await resourcesApi.save(id);
      setSaved(!saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update saved resources.'); }
    finally { setFileAction(null); }
  };
  const downloadAndView = async () => {
    setDownloadPromptOpen(false);
    setFileAction('download'); setError('');
    try {
      await resourcesApi.downloadInApp(id);
      setDownloaded(true);
      const result = await resourcesApi.fileUrl(id);
      const officeFile = /\.(doc|docx|ppt|pptx)$/i.test(result.filename);
      setViewerUrl(officeFile ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(result.url)}` : result.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to download and view this resource.'); }
    finally { setFileAction(null); }
  };
  const updateDownloadRestriction = async () => {
    if (!user || !['moderator', 'admin'].includes(user.role) || restrictionBusy) return;
    setRestrictionBusy(true); setError('');
    try {
      const next = !resourceDownloadRestricted;
      await apiRequest(`/resources/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ downloadRestricted: next }) });
      setResource((current) => current ? { ...current, downloadRestricted: next } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update resource download access.');
    } finally { setRestrictionBusy(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-5">
    <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] transition hover:text-[#2C36D9]"><ArrowLeft size={16} /> {reviewerAccess ? 'Back to resource library' : 'Back to approved library'}</Link>
    <article className="overflow-hidden rounded-3xl border border-[#DCE4EF] bg-white shadow-sm">
      <div className="border-b border-[#DCE4EF] bg-[#F8FAFD] p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 font-semibold uppercase tracking-wide text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><span className={`rounded-full px-3 py-1 font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}`}>{status}</span></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-semibold text-[#091F5B] sm:text-3xl">{resource.title}</h2><p className="mt-3 text-sm text-[#5C6982]">{[resource.course, resource.topic, resource.level, resource.institution].filter(Boolean).join(' · ')}</p></div><div className="flex flex-wrap gap-2">{(user?.role === 'student' || user?.role === 'lecturer') && <ReportContentButton targetType="resource" targetId={resource.id} label="Report resource" />}{user?.role === 'admin' && <button type="button" onClick={() => void updateDownloadRestriction()} disabled={restrictionBusy} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${resourceDownloadRestricted ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>{restrictionBusy ? 'Saving…' : resourceDownloadRestricted ? 'Allow downloads' : 'Restrict downloads'}</button>}</div></div>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        <section><h3 className="mb-2 flex items-center gap-2 font-semibold text-[#091F5B]"><BookOpen size={17} className="text-[#6121D0]" /> Resource details</h3><p className="whitespace-pre-wrap leading-7 text-[#374151]">{resource.description || 'No description was provided for this resource.'}</p></section>
        {resource.tags?.length ? <section><h3 className="mb-2 text-sm font-semibold text-[#091F5B]">Topics</h3><div className="flex flex-wrap gap-2">{resource.tags.map(tag => <span key={tag} className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1 text-xs text-[#4B5563]">{tag}</span>)}</div></section> : null}
        {hasFile ? <><div className="flex flex-wrap gap-3 border-t border-[#DCE4EF] pt-5"><button type="button" onClick={() => void accessFile(false)} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-60"><BookOpen size={16} /> {fileAction === 'open' ? 'Opening in reader…' : viewerUrl ? 'Refresh in-app reader' : 'Read in app'}</button>{canDownload && <button type="button" onClick={() => void accessFile(true)} disabled={Boolean(fileAction) || downloaded} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60"><Download size={16} /> {fileAction === 'download' ? 'Downloading in app…' : downloaded ? 'Downloaded to My resources' : 'Download in app'}</button>}<button type="button" onClick={() => void toggleSaved()} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60"><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved · Unsave' : 'Save for later'}</button></div>{privilegedPreviewOnly && <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 text-sm text-[#4B5563]">Reviewer access: preview is available for assigned academic review. Platform-wide downloads and contributions are not part of the reviewer role.</p>}{downloadRestricted && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Downloads are disabled for this restricted resource. You may read it here if your account has viewing permission.</p>}{viewerUrl && <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD]"><div className="flex items-center gap-2 border-b border-[#DCE4EF] px-4 py-3 text-sm font-semibold text-[#091F5B]"><FileText size={16} className="text-[#6121D0]"/> In-app resource reader</div><iframe title={`Reader: ${resource.title}`} src={viewerUrl} className="h-[75vh] min-h-[420px] w-full bg-white" referrerPolicy="no-referrer" /></section>}</> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This resource has no attached file. You can still review its details above.</p>}
      </div>
    </article>
    {downloadPromptOpen && <div role="dialog" aria-modal="true" aria-labelledby="download-resource-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><h3 id="download-resource-title" className="text-xl font-bold text-[#091F5B]">Download resource to view?</h3><p className="mt-3 text-sm leading-6 text-[#4B5563]">This resource must be downloaded in-app before you can view it. It will be saved to Downloaded resources under My resources for this account.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDownloadPromptOpen(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Cancel</button><button type="button" onClick={() => void downloadAndView()} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Download size={16}/> Download and view resource</button></div></div></div>}
  </div>;
}
