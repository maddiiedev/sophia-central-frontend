import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, RefreshCw, ShieldCheck, XCircle, UserCheck } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { sophiaApi } from '../api/sophiaApi';
import { moderationApi, type ModerationHistoryItem } from '../api/moderation';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import type { ModerationItem } from '../types';
import { AcademicCatalogueReviewPanel } from '../components/AcademicCatalogueReviewPanel';
import { ContentReportsPanel } from '../components/moderation/ContentReportsPanel';

type ModerationTab = 'queue' | 'history' | 'catalogue' | 'reports' | 'conflicts' | 'applications' | 'reviewers';
type ConflictAuditItem = { id: string; declaration: 'no_conflict' | 'recuse'; reason?: string | null; createdAt: string; resourceTitle?: string; reviewerFirstName?: string; reviewerLastName?: string; reviewerEmail?: string; reviewerAcademicHandle?: string };
type ReviewerOption = { id: string; firstName?: string; lastName?: string; email: string; academicHandle?: string; role: string; hasReviewerAccess?: boolean; reviewerExpertise?: string[]; reviewerAcademicLevels?: string[]; reviewerStatus?: string; isGlobalReviewer?: boolean; isSuspended?: boolean; institution?: string; faculty?: string; department?: string };
type ReviewerApplicationItem = { id: string; status: string; qualifications: string[]; expertiseAreas: string[]; academicLevels: string[]; reviewExperience: string; supportingDocuments?: string[]; conflictDeclaration: string; createdAt: string; user?: { id: string; firstName?: string; lastName?: string; email: string; academicHandle?: string; role: string; institution?: string; faculty?: string; department?: string } };

export function ModerationPage() {
  const { user } = useAuth();
  const isPlatformModerator = user?.role === 'moderator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isGlobalReviewer = user?.isGlobalReviewer === true;
  const canGovernReviewers = isAdmin;
  const canManageAssignments = isAdmin || isGlobalReviewer;
  const showReviewerGovernanceAdminTools = canGovernReviewers;
  const isReviewer = user?.role === 'reviewer' || user?.hasReviewerAccess === true;
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [history, setHistory] = useState<ModerationHistoryItem[]>([]);
  const [conflictAudit, setConflictAudit] = useState<ConflictAuditItem[]>([]);
  const [conflictAuditLoading, setConflictAuditLoading] = useState(false);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [reviewerApplications, setReviewerApplications] = useState<ReviewerApplicationItem[]>([]);
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [conflictDeclarations, setConflictDeclarations] = useState<Record<string, string>>({});
  const [conflictAcknowledged, setConflictAcknowledged] = useState<Record<string, boolean>>({});
  const [conflictReasons, setConflictReasons] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<ModerationTab>(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'reports' && isPlatformModerator) return 'reports';
    if (showReviewerGovernanceAdminTools && requested === 'conflicts') return 'conflicts';
    if (showReviewerGovernanceAdminTools && requested === 'applications') return 'applications';
    if (showReviewerGovernanceAdminTools && requested === 'reviewers') return 'reviewers';
    return user?.role === 'moderator' ? 'reports' : 'queue';
  });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true); setError('');
      const queue = await sophiaApi.moderation.list();
      setItems(Array.isArray(queue) ? queue : []);
      setConflictDeclarations(Object.fromEntries((Array.isArray(queue) ? queue : []).map(item => [item.id, item.reviewConflictDeclaration ?? ''])));
      setConflictAcknowledged({});
      if (canManageAssignments) {
        try {
          const accounts = await apiRequest<ReviewerOption[]>(isAdmin ? '/moderation/reviewers' : '/moderation/assignable-reviewers');
          setReviewers(accounts.filter((account) => account.hasReviewerAccess === true && !account.isSuspended));
        } catch {
          setReviewers([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation queue.');
    } finally { setLoading(false); }
  };

  const loadConflictAudit = async () => {
    try {
      setConflictAuditLoading(true); setError('');
      const entries = await apiRequest<ConflictAuditItem[]>('/moderation/conflict-declarations');
      setConflictAudit(Array.isArray(entries) ? entries : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviewer conflict audit.');
    } finally { setConflictAuditLoading(false); }
  };

  const loadReviewerGovernance = async () => {
    try {
      setGovernanceLoading(true); setError('');
      const [applications, roster] = await Promise.all([
        apiRequest<ReviewerApplicationItem[]>('/reviewer-applications'),
        apiRequest<ReviewerOption[]>('/moderation/reviewers'),
      ]);
      setReviewerApplications(Array.isArray(applications) ? applications : []);
      setReviewers(Array.isArray(roster) ? roster : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviewer governance records.');
    } finally { setGovernanceLoading(false); }
  };

  const decideReviewerApplication = async (application: ReviewerApplicationItem, status: 'under_review' | 'more_information_required' | 'approved' | 'rejected' | 'suspended' | 'revoked') => {
    if (processingId) return;
    const note = (decisionNotes[application.id] ?? '').trim();
    if (['more_information_required', 'rejected', 'suspended', 'revoked'].includes(status) && !note) {
      setError('Add a clear decision note or reason before continuing.');
      return;
    }
    setProcessingId(application.id); setError(''); setNotice('');
    try {
      await apiRequest(`/reviewer-applications/${encodeURIComponent(application.id)}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(note ? { note } : {}),
          ...(status === 'approved' ? { approvedExpertiseAreas: application.expertiseAreas, approvedAcademicLevels: application.academicLevels } : {}),
        }),
      });
      setNotice(`Reviewer application ${status.replace(/_/g, ' ')}.`);
      await loadReviewerGovernance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the reviewer application.');
    } finally { setProcessingId(null); }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true); setError('');
      const decisions = await sophiaApi.moderation.history();
      setHistory(Array.isArray(decisions) ? decisions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation history.');
    } finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (isReviewer || isAdmin) void loadQueue(); }, [user?.id, isReviewer, isAdmin]);
  useEffect(() => { if (tab === 'history' && (isReviewer || isAdmin)) void loadHistory(); }, [tab, isReviewer, isAdmin]);
  useEffect(() => { if (showReviewerGovernanceAdminTools && tab === 'conflicts') void loadConflictAudit(); }, [tab, canGovernReviewers]);
  useEffect(() => { if (showReviewerGovernanceAdminTools && (tab === 'applications' || tab === 'reviewers')) void loadReviewerGovernance(); }, [tab, canGovernReviewers]);

  const pending = useMemo(() => items.filter((item) => (item.status ?? 'pending').toLowerCase() === 'pending'), [items]);

  const review = async (id: string, status: 'approved' | 'rejected' | 'revision_requested') => {
    if (processingId) return;
    const noConflictAlreadyRecorded = conflictDeclarations[id] === 'no_conflict';
    if (!noConflictAlreadyRecorded && !conflictAcknowledged[id]) {
      setError('Confirm that you have checked this resource for conflicts of interest before submitting your review, or recuse yourself.');
      return;
    }
    const note = (notes[id] ?? '').trim();
    if ((status === 'rejected' || status === 'revision_requested') && !note) {
      setError(status === 'rejected' ? 'Add a reason before rejecting this resource.' : 'Add specific feedback before requesting revisions.');
      return;
    }
    setProcessingId(id); setError(''); setNotice('');
    try {
      if (!noConflictAlreadyRecorded) {
        await apiRequest(`/moderation/resources/${encodeURIComponent(id)}/conflict-declaration`, {
          method: 'PATCH',
          body: JSON.stringify({ declaration: 'no_conflict' }),
        });
        setConflictDeclarations(current => ({ ...current, [id]: 'no_conflict' }));
      }
      await moderationApi.review(id, status, undefined, note || undefined);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotes((current) => ({ ...current, [id]: '' }));
      setNotice(status === 'approved'
        ? 'Resource approved and made available in the public library.'
        : status === 'revision_requested'
          ? 'Revision requested. The contributor has been notified.'
          : 'Resource rejected. The contributor has been notified.');
      if (tab === 'history') await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed. The item remains pending.');
    } finally { setProcessingId(null); }
  };

  const declareConflict = async (resourceId: string, declaration: 'no_conflict' | 'recuse') => {
    if (processingId) return;
    const reason = (conflictReasons[resourceId] ?? '').trim();
    if (declaration === 'recuse' && reason.length < 10) {
      setError('Explain the conflict before recusing yourself (at least 10 characters).');
      return;
    }
    setProcessingId(resourceId); setError(''); setNotice('');
    try {
      await apiRequest(`/moderation/resources/${encodeURIComponent(resourceId)}/conflict-declaration`, {
        method: 'PATCH',
        body: JSON.stringify({ declaration, ...(declaration === 'recuse' ? { reason } : {}) }),
      });
      if (declaration === 'recuse') {
        setConflictAcknowledged(current => ({ ...current, [resourceId]: false }));
        setItems(current => current.filter(item => item.id !== resourceId));
        setNotice('You have recused yourself. The assignment has been released for independent reassignment.');
      } else {
        setConflictDeclarations(current => ({ ...current, [resourceId]: 'no_conflict' }));
        setNotice('Your no-conflict declaration has been recorded for this assignment.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record your conflict declaration.');
    } finally { setProcessingId(null); }
  };

  const assignReviewer = async (resourceId: string) => {
    const reviewerId = assignments[resourceId];
    if (!reviewerId || processingId) return;
    setProcessingId(resourceId); setError(''); setNotice('');
    try {
      await moderationApi.assignReviewer(resourceId, reviewerId);
      const selected = reviewers.find((reviewer) => reviewer.id === reviewerId);
      setItems((current) => current.map((item) => item.id === resourceId ? { ...item, assignedReviewerId: reviewerId } : item));
      setNotice(`Assigned to ${selected ? [selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.email : 'the selected reviewer'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reviewer assignment failed.');
    } finally { setProcessingId(null); }
  };

  const historyName = (item: ModerationHistoryItem) => item.reviewer?.name ||
    [item.reviewer?.firstName, item.reviewer?.lastName].filter(Boolean).join(' ') ||
    item.reviewer?.email || 'Sophis reviewer';

  return <div className="space-y-6">
    {isGlobalReviewer ? <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 text-slate-950 shadow-sm sm:p-8 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">Academic governance</p><h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">Global Academic Reviewer</h1><h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">All subjects · all academic levels</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">Review pending Student and Lecturer materials across every field and level, manage academic review assignments, and maintain platform-wide academic quality. This capability does not include moderator support, user-administration, wallet or platform-settings permissions.</p></header> : <SectionTitle eyebrow={isReviewer ? "Academic quality & trust" : isAdmin ? "Platform governance" : "Moderator workspace"} title={isReviewer ? "Assigned academic reviews" : isAdmin ? "Reviewer assignment" : "User & content reports"} />}
    {user?.role === 'reviewer' && user.academicAccountType === 'external_reviewer' && user.hasReviewerAccess === true && !isGlobalReviewer && <section className="flex flex-col gap-4 rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-[#40365A] dark:bg-[#211A34]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6121D0] dark:text-[#C4A7FF]">Additional account access</p><h2 className="mt-1 text-lg font-bold text-[#091F5B] dark:text-white">Become a Student or Lecturer</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#52627B] dark:text-slate-300">Add either a Student or Lecturer workspace to this same account. Your reviewer access and history will be retained; the choice is one-time.</p></div><Link to="/reviewer-account-transition" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5120B0]">Choose academic identity</Link></section>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Moderation sections">
      {(isReviewer || isAdmin) && <button type="button" role="tab" aria-selected={tab === 'queue'} onClick={() => setTab('queue')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'queue' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>{isGlobalReviewer ? `Platform-wide academic queue (${pending.length})` : isAdmin ? 'Resource assignment queue' : `Assigned review queue (${pending.length})`}</button>}
      {(isReviewer || isAdmin) && <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'history' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Review history</button>}
      {isPlatformModerator && <button type="button" role="tab" aria-selected={tab === 'reports'} onClick={() => setTab('reports')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'reports' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>User & content reports</button>}
      {isAdmin && <button type="button" role="tab" aria-selected={tab === 'catalogue'} onClick={() => setTab('catalogue')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'catalogue' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Academic catalogue</button>}
      {showReviewerGovernanceAdminTools && <button type="button" role="tab" aria-selected={tab === 'applications'} onClick={() => setTab('applications')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'applications' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Reviewer applications</button>}
      {showReviewerGovernanceAdminTools && <button type="button" role="tab" aria-selected={tab === 'reviewers'} onClick={() => setTab('reviewers')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'reviewers' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Reviewer roster</button>}
      {showReviewerGovernanceAdminTools && <button type="button" role="tab" aria-selected={tab === 'conflicts'} onClick={() => setTab('conflicts')} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tab === 'conflicts' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B] hover:border-[#2C36D9]'}`}>Reviewer conflict audit</button>}
    </div>

    {tab === 'reports' && isPlatformModerator ? <ContentReportsPanel /> : tab === 'catalogue' && isAdmin ? <AcademicCatalogueReviewPanel /> : tab === 'applications' && showReviewerGovernanceAdminTools ? <OverviewCard title="Reviewer applications" action={`${reviewerApplications.length} records`}><div className="space-y-3"><div className="flex justify-end"><button type="button" onClick={() => void loadReviewerGovernance()} disabled={governanceLoading} className="rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] disabled:opacity-50"><RefreshCw size={14} className={governanceLoading ? 'mr-2 inline animate-spin' : 'mr-2 inline'}/>Refresh applications</button></div>{governanceLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading reviewer applications…</p> : reviewerApplications.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No reviewer applications found.</p> : reviewerApplications.map(application => <article key={application.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold text-[#091F5B]">{[application.user?.firstName, application.user?.lastName].filter(Boolean).join(' ') || 'Applicant'}</h3><p className="mt-1 text-sm text-[#52627B]">{application.user?.email} · @{application.user?.academicHandle || 'handle unavailable'} · {application.user?.role}</p><p className="mt-1 text-xs text-[#64748B]">{application.user?.institution || 'External reviewer'} · {application.user?.faculty || 'Faculty not supplied'} · {application.user?.department || 'Department not supplied'}</p></div><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold capitalize text-[#6121D0]">{application.status.replace(/_/g, ' ')}</span></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><p className="font-semibold text-[#091F5B]">Qualifications</p><p className="mt-1 text-[#52627B]">{(application.qualifications || []).join(', ') || 'Not supplied'}</p></div><div><p className="font-semibold text-[#091F5B]">Requested scope</p><p className="mt-1 text-[#52627B]">{(application.expertiseAreas || []).includes('*') ? 'All subjects' : (application.expertiseAreas || []).join(', ')} · {(application.academicLevels || []).includes('*') ? 'All academic levels' : (application.academicLevels || []).join(', ')}</p></div><div className="sm:col-span-2"><p className="font-semibold text-[#091F5B]">Review experience</p><p className="mt-1 whitespace-pre-wrap text-[#52627B]">{application.reviewExperience}</p></div><div className="sm:col-span-2"><p className="font-semibold text-[#091F5B]">Conflict declaration</p><p className="mt-1 whitespace-pre-wrap text-[#52627B]">{application.conflictDeclaration}</p></div>{(application.supportingDocuments || []).length > 0 && <div className="sm:col-span-2"><p className="font-semibold text-[#091F5B]">Evidence links</p><div className="mt-1 flex flex-wrap gap-3">{application.supportingDocuments?.map((url, index) => <a key={`${application.id}-doc-${index}`} href={url} target="_blank" rel="noreferrer" className="break-all text-[#6121D0] underline">{url.includes('example.com') ? 'Placeholder evidence link' : `Evidence ${index + 1}`}</a>)}</div></div>}</div>{['submitted', 'under_review', 'more_information_required'].includes(application.status) && <div className="mt-4 space-y-2"><label className="block text-xs font-semibold text-[#091F5B]">Decision note / reason<textarea rows={2} value={decisionNotes[application.id] ?? ''} onChange={event => setDecisionNotes(current => ({ ...current, [application.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Record the reason or guidance for this decision…" /></label><div className="flex flex-wrap gap-2">{application.status === 'submitted' && <button type="button" onClick={() => void decideReviewerApplication(application, 'under_review')} disabled={Boolean(processingId)} className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#091F5B]">Mark under review</button>}<button type="button" onClick={() => void decideReviewerApplication(application, 'more_information_required')} disabled={Boolean(processingId)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Request information</button><button type="button" onClick={() => void decideReviewerApplication(application, 'approved')} disabled={Boolean(processingId)} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">Approve scope</button><button type="button" onClick={() => void decideReviewerApplication(application, 'rejected')} disabled={Boolean(processingId)} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">Reject</button></div></div>}{application.status === 'approved' && <div className="mt-4 space-y-2"><label className="block text-xs font-semibold text-[#091F5B]">Suspension / revocation reason<textarea rows={2} value={decisionNotes[application.id] ?? ''} onChange={event => setDecisionNotes(current => ({ ...current, [application.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Explain why access should be suspended or revoked…" /></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void decideReviewerApplication(application, 'suspended')} disabled={Boolean(processingId)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Suspend reviewer</button><button type="button" onClick={() => void decideReviewerApplication(application, 'revoked')} disabled={Boolean(processingId)} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">Revoke access</button></div></div>}</article>)}</div></OverviewCard> : tab === 'reviewers' && showReviewerGovernanceAdminTools ? <OverviewCard title="Reviewer roster" action={`${reviewers.length} reviewer records`}><div className="space-y-3"><div className="flex justify-end"><button type="button" onClick={() => void loadReviewerGovernance()} disabled={governanceLoading} className="rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] disabled:opacity-50"><RefreshCw size={14} className={governanceLoading ? 'mr-2 inline animate-spin' : 'mr-2 inline'}/>Refresh roster</button></div>{governanceLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading reviewer roster…</p> : reviewers.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No reviewer records found.</p> : reviewers.map(reviewer => <article key={reviewer.id} className="rounded-xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-[#091F5B]">{[reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ') || 'Reviewer'}</h3><p className="mt-1 text-sm text-[#52627B]">{reviewer.email} · @{reviewer.academicHandle || 'handle unavailable'}</p><p className="mt-1 text-xs text-[#64748B]">{reviewer.institution || 'External reviewer'} · {reviewer.faculty || 'Faculty not supplied'} · {reviewer.department || 'Department not supplied'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${reviewer.isGlobalReviewer ? 'bg-[#F3F0FF] text-[#6121D0]' : 'bg-emerald-50 text-emerald-900'}`}>{reviewer.isGlobalReviewer ? 'Global Academic Reviewer' : reviewer.reviewerStatus || 'Approved'}</span></div><p className="mt-2 text-sm text-[#52627B]">Subjects: {(reviewer.reviewerExpertise || []).includes('*') ? 'All subjects' : (reviewer.reviewerExpertise || []).join(', ') || 'Not listed'}</p><p className="mt-1 text-sm text-[#52627B]">Academic levels: {(reviewer.reviewerAcademicLevels || []).includes('*') ? 'All academic levels' : (reviewer.reviewerAcademicLevels || []).join(', ') || 'Not listed'}</p></article>)}</div></OverviewCard> : tab === 'conflicts' && showReviewerGovernanceAdminTools ? <OverviewCard title="Reviewer conflict declarations" action={`${conflictAudit.length} audit records`}><div className="space-y-3"><div className="flex justify-end"><button type="button" onClick={() => void loadConflictAudit()} disabled={conflictAuditLoading} className="rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] disabled:opacity-50"><RefreshCw size={14} className={conflictAuditLoading ? 'mr-2 inline animate-spin' : 'mr-2 inline'}/>Refresh audit</button></div>{conflictAuditLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading declarations…</p> : conflictAudit.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No reviewer conflict declarations recorded yet.</p> : conflictAudit.map(entry => <article key={entry.id} className="rounded-xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold text-[#091F5B]">{entry.resourceTitle || 'Resource no longer available'}</h3><p className="mt-1 text-sm text-[#52627B]">{[entry.reviewerFirstName, entry.reviewerLastName].filter(Boolean).join(' ') || 'Reviewer'} · {entry.reviewerEmail || 'Email unavailable'} · @{entry.reviewerAcademicHandle || 'handle unavailable'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.declaration === 'recuse' ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}>{entry.declaration === 'recuse' ? 'Recused' : 'No conflict declared'}</span></div>{entry.reason && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#26364F]">{entry.reason}</p>}<p className="mt-2 text-xs text-[#64748B]">{new Date(entry.createdAt).toLocaleString()}</p></article>)}</div></OverviewCard> : tab === 'queue' && (isReviewer || isAdmin) ? <OverviewCard title={`${pending.length} pending academic materials`} action="Review queue">
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadQueue()} disabled={loading || Boolean(processingId)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh queue</button></div>
        {loading ? <div className="p-6 text-sm text-[#5C6982]">Loading academic materials…</div> : pending.length === 0 ? <div className="p-8 text-center text-sm text-[#5C6982]"><ShieldCheck size={24} className="mx-auto mb-2 text-[#6121D0]" />No pending materials assigned to this review workspace.</div> : pending.map((item) => {
          const busy = processingId === item.id;
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="shrink-0 text-[#6121D0]" /><h3 className="break-words font-semibold text-[#091F5B]">{item.title}</h3></div>
                <p className="mt-2 text-sm text-[#4B5563]">{item.summary || `${item.type ?? 'Resource'} • ${item.course ?? 'Course not specified'}`}</p>
                <dl className="mt-3 grid gap-2 text-xs text-[#4B5563] sm:grid-cols-2">
                  <div><dt className="inline font-medium text-[#091F5B]">Contributor: </dt><dd className="inline">{item.uploadedBy || (item.uploaderId === null ? 'Former contributor' : item.origin === 'open_source' ? 'Anonymous contributor' : 'Contributor not listed')}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Institution: </dt><dd className="inline">{item.institution || 'Not specified'}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Course: </dt><dd className="inline">{item.course || 'Not specified'}</dd></div>
                  <div><dt className="inline font-medium text-[#091F5B]">Submitted: </dt><dd className="inline">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</dd></div>
                </dl>
                {item.hasFile && <Link to={`/resource/${encodeURIComponent(item.id)}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0] underline underline-offset-4 hover:text-[#2C36D9]"><FileText size={15} /> Open attached upload in reader <ArrowUpRight size={14} /></Link>}
                {canManageAssignments && <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#F8FAFD] p-3 sm:flex-row sm:items-center">
                  <label className="min-w-0 flex-1 text-xs font-semibold text-[#091F5B]">Assign subject-matter reviewer
                    <select value={assignments[item.id] ?? item.assignedReviewerId ?? ''} onChange={(event) => setAssignments((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal">
                      <option value="">Select reviewer</option>
                      {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{[reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ') || reviewer.email} — {(reviewer.reviewerExpertise ?? []).join(', ')}</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={() => void assignReviewer(item.id)} disabled={busy || !(assignments[item.id] ?? item.assignedReviewerId)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#091F5B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><UserCheck size={14} /> Assign reviewer</button>
                </div>}
                {isReviewer && <label className="mt-4 block text-xs font-semibold text-[#091F5B]">Reviewer feedback (required for rejection or revision requests)
                  <textarea rows={2} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal" placeholder="Give specific, actionable academic feedback…" />
                </label>}
                {isReviewer && <div className="mt-4 space-y-3 rounded-xl border border-[#E4DDF8] bg-[#F8F6FF] p-3 dark:border-[#40365A] dark:bg-[#211A34]">
                  {conflictDeclarations[item.id] === 'no_conflict' ? <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">No-conflict declaration recorded for this assignment.</p> : <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#091F5B] dark:text-white"><input type="checkbox" checked={Boolean(conflictAcknowledged[item.id])} onChange={event => setConflictAcknowledged(current => ({ ...current, [item.id]: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0 accent-[#6121D0]" /><span>I have checked this resource and its contributors, and confirm that I have no personal, academic, financial or authorship conflict. This declaration will be recorded when I submit my review.</span></label>}
                  <label className="block text-xs font-semibold text-[#091F5B] dark:text-slate-100">If a conflict exists or emerges, explain it before recusing
                    <textarea rows={2} value={conflictReasons[item.id] ?? ''} onChange={event => setConflictReasons(current => ({ ...current, [item.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Describe the relationship or conflict…" />
                  </label>
                  <button type="button" onClick={() => void declareConflict(item.id, 'recuse')} disabled={Boolean(processingId)} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 disabled:opacity-50">Recuse from this assignment</button>
                </div>}

              </div>
              {isReviewer && <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void review(item.id, 'approved')} disabled={Boolean(processingId) || (conflictDeclarations[item.id] !== 'no_conflict' && !conflictAcknowledged[item.id])} className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Approve'}</button>
                <button type="button" onClick={() => void review(item.id, 'revision_requested')} disabled={Boolean(processingId) || (conflictDeclarations[item.id] !== 'no_conflict' && !conflictAcknowledged[item.id])} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">{busy ? 'Saving…' : 'Request revision'}</button>
                <button type="button" onClick={() => void review(item.id, 'rejected')} disabled={Boolean(processingId) || (conflictDeclarations[item.id] !== 'no_conflict' && !conflictAcknowledged[item.id])} className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"><XCircle size={15} className="mr-1 inline" />{busy ? 'Saving…' : 'Reject'}</button>
              </div>}
            </div>
          </article>;
        })}
      </div>
    </OverviewCard> : (tab === 'history' && (isReviewer || isAdmin)) ? <OverviewCard title="Review decisions" action={`${history.length} decisions`}>
      <div className="space-y-3">
        <div className="flex justify-end"><button type="button" onClick={() => void loadHistory()} disabled={historyLoading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-50"><RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Refresh history</button></div>
        {historyLoading ? <p className="p-5 text-sm text-[#5C6982]">Loading review history…</p> : history.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 text-sm text-[#5C6982]">No review decisions have been recorded yet.</p> : history.map((item) => {
          const status = String(item.status || item.resource?.moderationStatus || 'reviewed').toLowerCase();
          return <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="font-semibold text-[#091F5B]">{item.resource?.title || 'Resource no longer available'}</h3><p className="mt-1 text-sm text-[#4B5563]">{item.resource?.course || 'Course not specified'} · {item.resource?.institution || 'Institution not specified'}</p><p className="mt-2 text-xs text-[#5C6982]">Reviewed by {historyName(item)}</p>{item.note && <p className="mt-2 text-sm text-[#4B5563]">Feedback: {item.note}</p>}</div><div className="flex shrink-0 flex-col items-start gap-1"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === 'approved' ? 'bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'bg-rose-50 text-rose-900' : status === 'revision_requested' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-800'}`}>{status.replace(/_/g, ' ')}</span><span className="text-xs text-[#5C6982]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}</span></div></div></article>;
        })}
      </div>
    </OverviewCard> : null}
    {(isReviewer || isAdmin) && <div className="flex items-center gap-2 text-xs text-[#5C6982]"><Clock3 size={14} /> Review decisions are recorded with reviewer identity and feedback.</div>}
  </div>;
}
