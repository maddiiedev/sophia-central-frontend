import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookOpen, Download, FileText } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import type { Resource } from '../types';
import { ReportOptionsMenu } from '../components/ReportContentButton';

type ResourceWithFile = Resource & { uploaderId?: string | null; fileUrl?: string; file_url?: string; url?: string; contentUrl?: string; content_url?: string; hasFile?: boolean; downloadRestricted?: boolean; accessLevel?: string; canDownload?: boolean };
type ReviewHistoryItem = { id: string; status: string; note?: string | null; createdAt: string; reviewer?: { firstName?: string; lastName?: string } | null };
type ResourceAppeal = { id: string; resourceId: string; appealType: 'reconsideration' | 'favoritism_report'; reason: string; status: string; createdAt: string };
type OverrideHistoryItem = { id: string; originalStatus: string; newStatus: string; reason: string; createdAt: string; adminFirstName?: string; adminLastName?: string; originalReviewerFirstName?: string; originalReviewerLastName?: string };

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
      if (!file.type.toLowerCase().includes('pdf')) {
        throw new Error('Secure in-app reading currently supports PDF files. This document was not sent to an external viewer.');
      }
      setViewerUrl(URL.createObjectURL(file) + '#toolbar=0&navpanes=0&scrollbar=0');
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
      if (!file.type.toLowerCase().includes('pdf')) {
        throw new Error('Secure in-app reading currently supports PDF files. This document was not sent to an external viewer.');
      }
      setViewerUrl(URL.createObjectURL(file) + '#toolbar=0&navpanes=0&scrollbar=0');
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

  return <div className="mx-auto max-w-4xl space-y-5">
    <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] transition hover:text-[#2C36D9]"><ArrowLeft size={16} /> {reviewerAccess ? 'Back to resource library' : 'Back to approved library'}</Link>
    <article className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">
      <div className="border-b border-[#DCE4EF] bg-[#F8FAFD] p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 font-semibold uppercase tracking-wide text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><span className={`rounded-full px-3 py-1 font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}`}>{status}</span></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-semibold text-[#091F5B] sm:text-3xl">{resource.title}</h2><p className="mt-3 text-sm text-[#5C6982]">{[resource.course, resource.topic, resource.level, resource.institution].filter(Boolean).join(' · ')}</p></div><div className="flex flex-wrap gap-2">{(user?.role === 'student' || user?.role === 'lecturer') && <ReportOptionsMenu options={[{ targetType: "resource", targetId: resource.id, label: "Report resource" }]} ariaLabel="Resource report options" />}{user?.role === 'admin' && <button type="button" onClick={() => void updateDownloadRestriction()} disabled={restrictionBusy} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${resourceDownloadRestricted ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>{restrictionBusy ? 'Saving…' : resourceDownloadRestricted ? 'Allow downloads' : 'Restrict downloads'}</button>}</div></div>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
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
        {hasFile ? <><div className="flex flex-wrap gap-3 border-t border-[#DCE4EF] pt-5"><button type="button" onClick={() => void accessFile(false)} disabled={Boolean(fileAction) || reviewerPaidLibraryLocked} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-60"><BookOpen size={16} /> {reviewerPaidLibraryLocked ? 'Purchase required' : fileAction === 'open' ? 'Opening in reader…' : viewerUrl ? 'Refresh in-app reader' : 'Read in app'}</button>{canDownload && <button type="button" onClick={() => void accessFile(true)} disabled={Boolean(fileAction) || downloaded} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60"><Bookmark size={16} /> {fileAction === 'download' ? 'Saving to My Resources…' : downloaded ? 'Saved to My Resources' : 'Save to My Resources'}</button>}{canSaveResource && <button type="button" onClick={() => void toggleSaved()} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60"><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved · Unsave' : 'Save for later'}</button>}</div>{privilegedPreviewOnly && <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-3 text-sm text-[#4B5563]">{reviewerAccess ? reviewerPaidLibraryLocked ? 'Reviewer access does not unlock approved paid library resources. Purchase is required for ordinary access; free preview is limited to eligible, conflict-free pending review assignments.' : 'Academic reviewer access: you can read eligible assigned review materials in-app and save approved free resources. Downloads are disabled. Paid approved library resources still require purchase. A visible account-specific watermark is added to the in-app preview as a deterrent; screenshots cannot be technically prevented.' : 'Platform oversight access: you can open and read authorised materials in-app and save approved resources. Downloads are disabled.'}</p>}{downloadRestricted && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Downloads are disabled for this restricted resource. You may read it here if your account has viewing permission.</p>}{viewerUrl && <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD]"><div className="flex items-center justify-between gap-3 border-b border-[#DCE4EF] px-4 py-3 text-sm font-semibold text-[#091F5B]"><span className="flex items-center gap-2"><FileText size={16} className="text-[#6121D0]"/> In-app resource reader</span><span className="text-xs font-medium text-[#64748B]">Protected preview</span></div><div className="relative isolate"><iframe title={`Reader: ${resource.title}`} src={viewerUrl} className="h-[75vh] min-h-[420px] w-full bg-white" referrerPolicy="no-referrer" onContextMenu={event => event.preventDefault()} /><div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 content-around gap-8 overflow-hidden p-6 opacity-[0.12] sm:grid-cols-3"><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-700">SOPHIS CENTRAL · PRIVATE VIEW · {user?.academicHandle || user?.email || 'AUTHORIZED USER'}</span></div></div><p className="border-t border-[#DCE4EF] px-4 py-2 text-xs text-[#64748B]">Resource access is checked by Sophis Central. The reader hides standard PDF toolbar actions and does not expose a storage download link. Screenshots or external capture cannot be fully prevented on user-controlled devices.</p></section>}</> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This resource has no attached file. You can still review its details above.</p>}
      </div>
    </article>
    {downloadPromptOpen && <div role="dialog" aria-modal="true" aria-labelledby="download-resource-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><h3 id="download-resource-title" className="text-xl font-bold text-[#091F5B]">Save resource to view?</h3><p className="mt-3 text-sm leading-6 text-[#4B5563]">Save this resource to My Resources before opening it. The file remains in Sophis Central storage; this action does not download the document to your device.</p><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => void downloadAndView()} disabled={Boolean(fileAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Bookmark size={16}/> Save to My Resources and read</button><button type="button" onClick={() => setDownloadPromptOpen(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Cancel</button></div></div></div>}
  </div>;
}
