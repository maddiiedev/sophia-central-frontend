import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookOpen, ChevronLeft, ChevronRight, Download, FileText, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import type { Resource } from '../types';
import { ReportOptionsMenu } from '../components/ReportContentButton';
import { UniversalResourceReader } from '../components/UniversalResourceReader';

type ResourceWithFile = Resource & { uploaderId?: string | null; fileUrl?: string; file_url?: string; url?: string; contentUrl?: string; content_url?: string; hasFile?: boolean; downloadRestricted?: boolean; accessLevel?: string; canDownload?: boolean };
type ReviewHistoryItem = { id: string; status: string; note?: string | null; createdAt: string; reviewer?: { firstName?: string; lastName?: string } | null };
type ResourceAppeal = { id: string; resourceId: string; appealType: 'reconsideration' | 'favoritism_report'; reason: string; status: string; createdAt: string };
type OverrideHistoryItem = { id: string; originalStatus: string; newStatus: string; reason: string; createdAt: string; adminFirstName?: string; adminLastName?: string; originalReviewerFirstName?: string; originalReviewerLastName?: string };
const READER_MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
};
function makeReaderFileName(title: string, mimeType: string): string {
  const extension = READER_MIME_EXTENSIONS[mimeType.split(';')[0].trim().toLowerCase()];
  if (!extension) throw new Error('This resource format is not supported by the secure in-app reader.');
  const safeTitle = Array.from(title).filter(character => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127).join('').replace(/[:*?"<>|]/g, '-').split('/').join('-').split('\\\\').join('-').trim() || 'resource';
  return `${safeTitle}.${extension}`;
}


export function ResourceReaderPage() {
  const { id = '' } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [resource, setResource] = useState<ResourceWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadStatusKnown, setDownloadStatusKnown] = useState(false);
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);
  const [fileAction, setFileAction] = useState<'open' | 'download' | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerFileName, setViewerFileName] = useState('resource.pdf');
  const [viewerMimeType, setViewerMimeType] = useState('application/pdf');
  const [readerPage, setReaderPage] = useState(1);
  const [readerPageCount, setReaderPageCount] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [headingSearch, setHeadingSearch] = useState('');
  const [appliedHeadingSearch, setAppliedHeadingSearch] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [documentWidthPercent, setDocumentWidthPercent] = useState(100);
  const [searchMessage, setSearchMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => () => {
    if (viewerUrl.startsWith('blob:')) URL.revokeObjectURL(viewerUrl.split('#')[0]);
  }, [viewerUrl]);
  const [restrictionBusy, setRestrictionBusy] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [resourceAppeals, setResourceAppeals] = useState<ResourceAppeal[]>([]);
  const [appealType, setAppealType] = useState<'reconsideration' | 'favoritism_report'>('reconsideration');
  const [appealReason, setAppealReason] = useState('');
  const [appealSaving, setAppealSaving] = useState(false);
  const [appealError, setAppealError] = useState('');
  const [appealNotice, setAppealNotice] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<'approved' | 'rejected' | 'revision_requested'>('approved');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideHistory, setOverrideHistory] = useState<OverrideHistoryItem[]>([]);
  const [overrideError, setOverrideError] = useState('');
  const [overrideNotice, setOverrideNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true); setError(''); setDownloadStatusKnown(false); setDownloaded(false); setDownloadPromptOpen(false); setViewerUrl('');
        const result = await resourcesApi.byId(id);
        if (active) {
          setResource(result as ResourceWithFile);
          if (user) {
            const savedResources = await resourcesApi.saved().catch(() => []);
            if (active) setSaved(savedResources.some((item) => item.id === id));
            if (['student', 'lecturer'].includes(user.role)) {
              if ((result as ResourceWithFile).uploaderId === user.id && ['rejected', 'revision_requested'].includes((result as ResourceWithFile).moderationStatus || '')) {
                const [reviews, appeals] = await Promise.all([
                  apiRequest<ReviewHistoryItem[]>(`/moderation/resources/${encodeURIComponent(id)}/review-history`),
                  apiRequest<ResourceAppeal[]>('/moderation/appeals/mine'),
                ]);
                if (active) {
                  setReviewHistory(Array.isArray(reviews) ? reviews : []);
                  setResourceAppeals(Array.isArray(appeals) ? appeals.filter(appeal => appeal.resourceId === id) : []);
                }
              }
              const downloadedResources = await resourcesApi.downloaded().catch(() => null);
              if (active && downloadedResources) {
                const hasDownloaded = downloadedResources.some((item) => item.id === id);
                setDownloaded(hasDownloaded);
                setDownloadStatusKnown(true);
                if (!user.hasReviewerAccess && user.role !== 'reviewer' && ['student', 'lecturer'].includes(user.role) && !hasDownloaded && (result as ResourceWithFile).hasFile && (result as ResourceWithFile).uploaderId !== user.id) setDownloadPromptOpen(true);
              } else if (active) {
                // Do not treat a transient list failure as proof that the user has not saved the resource.
                setDownloadStatusKnown(false);
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
  }, [id, isAuthenticated, user?.id, user?.role, user?.hasReviewerAccess, user?.academicAccountType, user?.reviewerBaseRole, reloadVersion]);

  useEffect(() => {
    if (user?.role !== 'admin' || !id) return;
    let active = true;
    apiRequest<OverrideHistoryItem[]>(`/moderation/resources/${encodeURIComponent(id)}/override-history`)
      .then(items => { if (active) setOverrideHistory(Array.isArray(items) ? items : []); })
      .catch(() => { if (active) setOverrideHistory([]); });
    return () => { active = false; };
  }, [id, user?.id, user?.role]);

  if (loading) return <LoadingState message="Opening approved resource..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setError(''); setLoading(true); setReloadVersion(value => value + 1); }} />;
  if (!resource) return <div className="rounded-2xl border border-[#DCE4EF] bg-white p-6 text-[#091F5B]">Resource not found. <Link to="/library" className="font-semibold text-[#6121D0] underline">Return to library</Link></div>;

  const hasFile = Boolean(resource.hasFile || resource.fileUrl || resource.file_url || resource.contentUrl || resource.content_url || resource.url);
  const status = resource.moderationStatus || (resource.isVerified ? 'approved' : 'pending');
  const canSaveResource = status === 'approved';
  const reviewerAccess = user?.hasReviewerAccess === true || user?.role === 'reviewer';
  const isPaidResource = String((resource as ResourceWithFile & { pricingMode?: string }).pricingMode || 'free').toLowerCase() !== 'free';
  // Reviewer privileges are not a substitute for purchasing an approved paid library item.
  // Pending review items are still checked against the active assignment and conflict policy by the backend.
  const reviewerPaidLibraryLocked = reviewerAccess && isPaidResource && status === 'approved' && resource.uploaderId !== user?.id;
  const moderatorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';
  const privilegedPreviewOnly = reviewerAccess || moderatorOrAdmin;
  const resourceDownloadRestricted = Boolean(resource.downloadRestricted || resource.canDownload === false || String(resource.accessLevel || '').toLowerCase() === 'restricted');
  const ownResource = Boolean(user && resource.uploaderId === user.id);
  const reviewerBaseRole = user?.role === 'reviewer'
    ? user.reviewerBaseRole || user.academicAccountType
    : user?.role;
  const lecturerUploader = reviewerBaseRole === 'lecturer'
    && ['lecturer', 'reviewer'].includes(user?.role ?? '')
    && ownResource;
  const downloadRestricted = resourceDownloadRestricted && !ownResource;
  const canDownload = (!privilegedPreviewOnly || lecturerUploader) && !downloadRestricted;
  const prepareReader = (file: Blob) => {
    const mimeType = (file.type || '').split(';')[0].trim().toLowerCase();
    const fileName = makeReaderFileName(resource.title, mimeType);
    const nextUrl = URL.createObjectURL(file);
    setViewerMimeType(mimeType);
    setViewerFileName(fileName);
    setViewerUrl(nextUrl);
    setReaderPage(1);
    setReaderPageCount(0);
    setPageInput('1');
    setHeadingSearch('');
    setAppliedHeadingSearch('');
    setZoomPercent(100);
    setDocumentWidthPercent(100);
    setSearchMessage('');
    setPageError('');
  };
  const accessFile = async (download: boolean) => {
    if (!hasFile || fileAction || (download && !canDownload)) return;
    if (download && !canDownload) return;
    if (!download && reviewerPaidLibraryLocked) {
      setError('This is a paid Academic Library resource. Reviewer access does not replace the purchase required for ordinary student or lecturer access.');
      return;
    }
    if (!download && !reviewerAccess && ['student', 'lecturer'].includes(user?.role ?? '') && downloadStatusKnown && !downloaded && resource.uploaderId !== user?.id) {
      setDownloadPromptOpen(true);
      return;
    }
    setFileAction(download ? 'download' : 'open');
    setError('');
    try {
      if (download) {
        await resourcesApi.downloadInApp(id);
        setDownloaded(true);
      }
      const file = await resourcesApi.readerFile(id);
      prepareReader(file);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to access this resource file.';
      if (message.toLowerCase().includes('save this resource to my resources')) {
        setDownloadPromptOpen(true);
        setError('');
      } else {
        setError(message);
      }
    } finally { setFileAction(null); }
  };
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
      const file = await resourcesApi.readerFile(id);
      prepareReader(file);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to download and view this resource.'); }
    finally { setFileAction(null); }
  };
  const submitAppeal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (appealSaving || appealReason.trim().length < 20) return;
    setAppealSaving(true); setAppealError(''); setAppealNotice('');
    try {
      const result = await apiRequest<ResourceAppeal>(`/moderation/resources/${encodeURIComponent(id)}/appeals`, {
        method: 'POST',
        body: JSON.stringify({ appealType, reason: appealReason.trim() }),
      });
      setResourceAppeals(current => [result, ...current]);
      setAppealReason('');
      setAppealNotice('Your reconsideration request has been sent to the Admin review queue.');
    } catch (cause) {
      setAppealError(cause instanceof Error ? cause.message : 'Unable to submit your appeal.');
    } finally { setAppealSaving(false); }
  };

  const submitAdminOverride = async (event: React.FormEvent) => {
    event.preventDefault();
    if (overrideSaving || overrideReason.trim().length < 20) return;
    setOverrideSaving(true); setOverrideError(''); setOverrideNotice('');
    try {
      await apiRequest(`/moderation/resources/${encodeURIComponent(id)}/override`, {
        method: 'PATCH',
        body: JSON.stringify({ status: overrideStatus, reason: overrideReason.trim() }),
      });
      setResource(current => current ? { ...current, moderationStatus: overrideStatus, isVerified: overrideStatus === 'approved' } : current);
      setOverrideNotice('The Admin override was recorded in the immutable audit history.');
      setOverrideReason('');
      const history = await apiRequest<OverrideHistoryItem[]>(`/moderation/resources/${encodeURIComponent(id)}/override-history`);
      setOverrideHistory(history);
    } catch (cause) {
      setOverrideError(cause instanceof Error ? cause.message : 'Unable to record the Admin override.');
    } finally { setOverrideSaving(false); }
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

  return <div className="mx-auto w-full min-w-0 max-w-4xl space-y-4 sm:space-y-5">
    <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] transition hover:text-[#2C36D9]"><ArrowLeft size={16} /> {reviewerAccess ? 'Back to resource library' : 'Back to approved library'}</Link>
    <article className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">
      <div className="min-w-0 border-b border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 font-semibold uppercase tracking-wide text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><span className={`rounded-full px-3 py-1 font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}`}>{status}</span></div>
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><h2 className="break-words text-xl font-semibold text-[#091F5B] [overflow-wrap:anywhere] sm:text-3xl">{resource.title}</h2><p className="mt-3 break-words text-sm text-[#5C6982]">{[resource.course, resource.topic, resource.level, resource.institution].filter(Boolean).join(' · ')}</p></div><div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{(user?.role === 'student' || user?.role === 'lecturer') && <ReportOptionsMenu options={[{ targetType: "resource", targetId: resource.id, label: "Report resource" }]} ariaLabel="Resource report options" />}{user?.role === 'admin' && <button type="button" onClick={() => void updateDownloadRestriction()} disabled={restrictionBusy} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${resourceDownloadRestricted ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>{restrictionBusy ? 'Saving…' : resourceDownloadRestricted ? 'Allow downloads' : 'Restrict downloads'}</button>}</div></div>
      </div>
      <div className="min-w-0 space-y-5 p-3 sm:space-y-6 sm:p-8">
        <section className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[#DCE4EF] pb-4 text-sm"><div><span className="font-semibold text-[#091F5B]">Contributor: </span><span className="text-[#5C6982]">{resource.uploaderId === null ? 'Former contributor' : resource.origin === 'open_source' && !resource.uploadedBy && !resource.author ? 'Anonymous contributor' : resource.uploadedBy || resource.author || 'Contributor not listed'}</span></div></section>
        <section><h3 className="mb-2 flex items-center gap-2 font-semibold text-[#091F5B]"><BookOpen size={17} className="text-[#6121D0]" /> Resource details</h3><p className="whitespace-pre-wrap leading-7 text-[#374151]">{resource.description || 'No description was provided for this resource.'}</p></section>
        {user && resource.uploaderId === user.id && ['rejected', 'revision_requested'].includes(status) && <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div><h3 className="text-lg font-bold text-amber-950">Request reconsideration</h3><p className="mt-1 text-sm leading-6 text-amber-900">You can ask for an independent review of a rejection or revision request. An administrator who was not the original reviewer or uploader must investigate where possible.</p></div>
          {reviewHistory.length > 0 && <div className="rounded-xl border border-amber-200 bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-900">Latest reviewer decision</p>{reviewHistory.slice(-1).map(entry => <div key={entry.id} className="mt-2"><p className="text-sm font-semibold capitalize text-[#091F5B]">{entry.status.replace(/_/g, ' ')}</p>{entry.note && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#374151]">{entry.note}</p>}<p className="mt-1 text-xs text-[#64748B]">{entry.reviewer ? `${entry.reviewer.firstName || ''} ${entry.reviewer.lastName || ''}`.trim() : 'Academic reviewer'} · {new Date(entry.createdAt).toLocaleString()}</p></div>)}</div>}
          {resourceAppeals.some(appeal => ['submitted', 'under_review'].includes(appeal.status)) ? <p className="rounded-xl bg-white p-3 text-sm font-semibold text-amber-950">A reconsideration request is already open for this resource.</p> : <form onSubmit={submitAppeal} className="space-y-3"><label className="block text-sm font-semibold text-[#091F5B]">Request type<select value={appealType} onChange={event => setAppealType(event.target.value as 'reconsideration' | 'favoritism_report')} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm"><option value="reconsideration">Academic reconsideration</option><option value="favoritism_report">Report possible favoritism or conflict of interest</option></select></label><label className="block text-sm font-semibold text-[#091F5B]">Explain your request<textarea value={appealReason} onChange={event => setAppealReason(event.target.value)} rows={4} minLength={20} maxLength={3000} required className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm font-normal text-[#26364F]" placeholder="Explain the specific review outcome you want reconsidered or the conflict/favoritism concern. Provide evidence where possible." /></label>{appealError && <p role="alert" className="text-sm text-rose-700">{appealError}</p>}{appealNotice && <p role="status" className="text-sm font-semibold text-emerald-800">{appealNotice}</p>}<button type="submit" disabled={appealSaving || appealReason.trim().length < 20} className="rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{appealSaving ? 'Submitting request…' : 'Submit reconsideration request'}</button></form>}
        </section>}
        {resource.tags?.length ? <section><h3 className="mb-2 text-sm font-semibold text-[#091F5B]">Topics</h3><div className="flex flex-wrap gap-2">{resource.tags.map(tag => <span key={tag} className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1 text-xs text-[#4B5563]">{tag}</span>)}</div></section> : null}
        {user?.role === 'admin' && <section className="space-y-4 rounded-2xl border border-[#E4DDF8] bg-[#F8F6FF] p-4 sm:p-5">
          <div><h3 className="text-lg font-bold text-[#091F5B]">Admin review override</h3><p className="mt-1 text-sm leading-6 text-[#52627B]">Use only when an independent governance decision requires changing a completed reviewer outcome. The original review is preserved and this action is permanently audited. An administrator involved in the original upload or review cannot override it.</p></div>
          <form onSubmit={submitAdminOverride} className="space-y-3"><label className="block text-sm font-semibold text-[#091F5B]">New moderation outcome<select value={overrideStatus} onChange={event => setOverrideStatus(event.target.value as 'approved' | 'rejected' | 'revision_requested')} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white p-3 text-sm"><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="revision_requested">Revision requested</option></select></label><label className="block text-sm font-semibold text-[#091F5B]">Reason for override<textarea value={overrideReason} onChange={event => setOverrideReason(event.target.value)} rows={3} minLength={20} maxLength={3000} required className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white p-3 text-sm font-normal text-[#26364F]" placeholder="Document the evidence and governance reason for this override…" /></label>{overrideError && <p role="alert" className="text-sm text-rose-700">{overrideError}</p>}{overrideNotice && <p role="status" className="text-sm font-semibold text-emerald-800">{overrideNotice}</p>}<button type="submit" disabled={overrideSaving || overrideReason.trim().length < 20} className="rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{overrideSaving ? 'Recording override…' : 'Record Admin override'}</button></form>
          {overrideHistory.length > 0 && <div className="border-t border-[#D9CFF4] pt-3"><h4 className="text-sm font-bold text-[#091F5B]">Override audit history</h4><div className="mt-2 space-y-2">{overrideHistory.map(entry => <div key={entry.id} className="rounded-xl bg-white p-3"><p className="text-sm font-semibold capitalize text-[#091F5B]">{entry.originalStatus.replace(/_/g, ' ')} → {entry.newStatus.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-[#64748B]">Admin: {[entry.adminFirstName, entry.adminLastName].filter(Boolean).join(' ') || 'Administrator'} · Original reviewer: {[entry.originalReviewerFirstName, entry.originalReviewerLastName].filter(Boolean).join(' ') || 'Reviewer'} · {new Date(entry.createdAt).toLocaleString()}</p><p className="mt-2 whitespace-pre-wrap text-sm text-[#26364F]">{entry.reason}</p></div>)}</div></div>}
        </section>}
        {hasFile ? <><div className="flex flex-col gap-2 border-t border-[#DCE4EF] pt-5 sm:flex-row sm:flex-wrap sm:gap-3"><button type="button" onClick={() => void accessFile(false)} disabled={Boolean(fileAction) || reviewerPaidLibraryLocked} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-60 sm:w-auto"><BookOpen size={16} /> {reviewerPaidLibraryLocked ? 'Purchase required' : fileAction === 'open' ? 'Opening in reader…' : viewerUrl ? 'Refresh in-app reader' : 'Read in app'}</button>{canDownload && <button type="button" onClick={() => void accessFile(true)} disabled={Boolean(fileAction) || downloaded} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60 sm:w-auto"><Bookmark size={16} /> {fileAction === 'download' ? 'Saving to My Resources…' : downloaded ? 'Saved to My Resources' : 'Save to My Resources'}</button>}{canSaveResource && <button type="button" onClick={() => void toggleSaved()} disabled={Boolean(fileAction)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60 sm:w-auto"><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved · Unsave' : 'Save for later'}</button>}</div>{privilegedPreviewOnly && <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 text-sm text-[#4B5563]">{reviewerAccess ? reviewerPaidLibraryLocked ? 'Reviewer access does not unlock approved paid library resources. Purchase is required for ordinary access; free preview is limited to eligible, conflict-free pending review assignments.' : 'Academic reviewer access: you can read eligible assigned review materials in-app and save approved free resources. Downloads are disabled. Paid approved library resources still require purchase. A visible account-specific watermark is added to the in-app preview as a deterrent; screenshots cannot be technically prevented.' : 'Platform oversight access: you can open and read authorised materials in-app and save approved resources. Downloads are disabled.'}</p>}{downloadRestricted && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Downloads are disabled for this restricted resource. You may read it here if your account has viewing permission.</p>}{viewerUrl && <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE4EF] px-4 py-3 text-sm font-semibold text-[#091F5B]"><span className="flex items-center gap-2"><FileText size={16} className="text-[#6121D0"/> In-app resource reader</span><span className="text-xs font-medium text-[#64748B]">Protected preview</span></div>
          <form onSubmit={event => {event.preventDefault();const term=headingSearch.trim();setAppliedHeadingSearch(term);setSearchMessage(term?'Searching document text…':'Search cleared.');}} className="flex min-w-0 flex-col gap-2 border-b border-[#DCE4EF] bg-white p-3 sm:flex-row sm:items-center">
            <input value={headingSearch} onChange={event=>setHeadingSearch(event.target.value)} placeholder="Search text in this document" className="min-w-0 flex-1 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-[#091F5B] outline-none focus:border-[#6121D0]"/>
            <button type="submit" aria-label="Search document" className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#6121D0] text-white sm:w-11"><Search size={18}/></button>
            {appliedHeadingSearch&&<button type="button" onClick={()=>{setHeadingSearch('');setAppliedHeadingSearch('');setSearchMessage('');}} className="rounded-xl border px-3 py-2 text-xs font-semibold">Clear</button>}
          </form>
          <div className="flex flex-wrap items-center gap-3 border-b border-[#DCE4EF] bg-[#F8FAFD] px-3 py-2.5">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[#DCE4EF] bg-white p-1">
              <button type="button" onClick={()=>setZoomPercent(value=>Math.max(50,value-10))} disabled={zoomPercent<=50} aria-label="Zoom out" className="inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40"><ZoomOut size={17}/></button><span className="min-w-14 text-center text-xs font-semibold tabular-nums">{zoomPercent}%</span><button type="button" onClick={()=>setZoomPercent(value=>Math.min(200,value+10))} disabled={zoomPercent>=200} aria-label="Zoom in" className="inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40"><ZoomIn size={17}/></button><button type="button" onClick={()=>setZoomPercent(100)} className="rounded-lg px-2 text-xs font-semibold">Reset</button>
            </div>
            <div className="flex min-w-0 w-full flex-1 items-center gap-2 sm:min-w-[220px] sm:gap-3"><label htmlFor="pdf-document-width" className="shrink-0 text-xs font-semibold">Width</label><input id="pdf-document-width" type="range" min="60" max="100" step="5" value={documentWidthPercent} onChange={event=>setDocumentWidthPercent(Number(event.target.value))} className="h-8 min-w-0 flex-1 touch-pan-x accent-[#6121D0]"/><span className="w-10 shrink-0 text-right text-xs tabular-nums">{documentWidthPercent}%</span></div>
            {searchMessage&&<p role="status" className="w-full text-xs text-[#64748B]">{searchMessage}</p>}
          </div>
          <div className="grid min-h-0 min-w-0 grid-cols-1 lg:min-h-[520px] lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside aria-label="Document page and slide navigation" className="min-w-0 border-b border-[#DCE4EF] bg-[#F8FAFD] p-3 lg:border-b-0 lg:border-r"><h3 className="text-xs font-bold uppercase tracking-[.12em]">Page / slide navigation</h3>
              <form onSubmit={event=>{event.preventDefault();const target=Number(pageInput);if(!Number.isInteger(target)||target<1||target>readerPageCount){setPageError(`Enter a page from 1 to ${readerPageCount||'the document page count'}.`);return;}setPageError('');setReaderPage(target);}} className="mt-4 space-y-2">
                <label htmlFor="pdf-page-number" className="block text-xs font-semibold">Go to page / slide</label><input id="pdf-page-number" type="number" min="1" max={readerPageCount||1} step="1" inputMode="numeric" value={pageInput} onChange={event=>{setPageInput(event.target.value);setPageError('');}} className="w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6121D0]"/>
                {pageError&&<p role="alert" className="text-xs text-rose-700">{pageError}</p>}<button type="submit" className="w-full rounded-xl bg-[#6121D0] px-3 py-2.5 text-sm font-semibold text-white">Open page</button>
              </form>
              <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={()=>{const n=Math.max(1,readerPage-1);setReaderPage(n);setPageInput(String(n));setPageError('');}} disabled={readerPage<=1} className="inline-flex items-center justify-center gap-1 rounded-xl border bg-white px-2 py-2 text-xs font-semibold disabled:opacity-40"><ChevronLeft size={14}/>Previous</button><button type="button" onClick={()=>{const n=Math.min(readerPageCount,readerPage+1);setReaderPage(n);setPageInput(String(n));setPageError('');}} disabled={!readerPageCount||readerPage>=readerPageCount} className="inline-flex items-center justify-center gap-1 rounded-xl border bg-white px-2 py-2 text-xs font-semibold disabled:opacity-40">Next<ChevronRight size={14}/></button></div>
              <p className="mt-3 text-xs">Page <strong>{readerPage}</strong> of {readerPageCount||'…'}</p>
            </aside>
            <div className="min-w-0"><UniversalResourceReader url={viewerUrl} fileName={viewerFileName} mimeType={viewerMimeType} page={readerPage} zoom={zoomPercent} widthPercent={documentWidthPercent} searchTerm={appliedHeadingSearch} onPageCount={count=>setReaderPageCount(count)} onPageChange={value=>{setReaderPage(value);setPageInput(String(value));}} onSearchStatus={setSearchMessage} watermark={`SOPHIS CENTRAL · PRIVATE VIEW · ${user?.academicHandle||user?.email||'AUTHORIZED USER'}`}/></div>
          </div>
          <p className="border-t border-[#DCE4EF] px-4 py-2 text-xs leading-5 text-[#64748B]">Use the reader controls to navigate and search within this resource. Your access permissions apply throughout the reader.</p>
        </section>}</> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This resource has no attached file. You can still review its details above.</p>}
      </div>
    </article>
    {downloadPromptOpen && <div role="dialog" aria-modal="true" aria-labelledby="download-resource-title" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#091F5B]/60 p-3 sm:items-center sm:p-4"><div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#DCE4EF] bg-white p-4 shadow-2xl sm:p-6"><h3 id="download-resource-title" className="text-xl font-bold text-[#091F5B]">Save resource to view?</h3><p className="mt-3 text-sm leading-6 text-[#4B5563]">Save this resource to My Resources before opening it. The file remains in Sophis Central storage; this action does not download the document to your device.</p><div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3"><button type="button" onClick={() => void downloadAndView()} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Bookmark size={16}/> Save to My Resources and read</button><button type="button" onClick={() => setDownloadPromptOpen(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Cancel</button></div></div></div>}
  </div>;
}
