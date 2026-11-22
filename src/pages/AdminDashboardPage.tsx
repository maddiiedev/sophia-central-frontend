import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Users, UserCog, ClipboardList, LifeBuoy, Activity } from 'lucide-react';
import { usersApi, type AdminAuditEvent, type AdminOverview } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

function Metric({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: typeof Users }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-500">{label}</p><span className="rounded-xl bg-violet-50 p-2 text-violet-700"><Icon size={18}/></span></div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </article>;
}

function AdminLink({ to, title, description }: { to: string; title: string; description: string }) {
  return <Link to={to} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/40">
    <span><span className="block text-sm font-semibold text-slate-900">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
    <ArrowRight size={17} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-700"/>
  </Link>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

function eventLabel(event: AdminAuditEvent) {
  if (event.eventType === 'platform_role') return `${event.role} account ${event.action}`;
  if (event.eventType === 'reviewer_assignment') return `Reviewer assignment ${event.action}`;
  if (event.eventType === 'resource_review') return `Academic resource review ${event.action}`;
  if (event.eventType === 'admin_bootstrap') return `Admin bootstrap ${event.action}`;
  if (event.eventType === 'admin_escalation') return `${event.role} escalation received`;
  if (event.eventType === 'admin_mfa') return `Admin MFA ${event.action.replace(/_/g, ' ')}`;
  return `Reviewer application ${event.action.replace(/_/g, ' ')}`;
}

export function AdminDashboardPage() {
  const overviewQuery = useQuery({ queryKey: ['admin-overview'], queryFn: usersApi.adminOverview, staleTime: 30_000 });
  const auditQuery = useQuery({ queryKey: ['admin-audit-events', 6], queryFn: () => usersApi.adminAuditEvents(6), staleTime: 30_000 });
  const overview: AdminOverview | undefined = overviewQuery.data;
  const events: AdminAuditEvent[] = auditQuery.data ?? [];

  if (overviewQuery.isLoading || auditQuery.isLoading) return <LoadingState message="Loading administration overview..." />;
  if (overviewQuery.isError || auditQuery.isError || !overview) return <ErrorState message="Unable to load the complete administration overview and audit activity. Check the connection and retry." onRetry={() => { void overviewQuery.refetch(); void auditQuery.refetch(); }} />;

  const pendingApplications = ['submitted', 'under_review', 'more_information_required']
    .reduce((total, status) => total + Number(overview.reviewerApplications[status] ?? 0), 0);
  const globalReviewer = overview.globalReviewer;
  const globalReviewerStatus = globalReviewer?.isGlobalReviewer && globalReviewer.hasReviewerAccess
    ? 'Global Academic Reviewer authority active'
    : globalReviewer
      ? `Reviewer status: ${globalReviewer.reviewerStatus.replace(/_/g, ' ')}`
      : 'Existing account was not returned; verify its identity before changing access';

  return <div className="space-y-7">
    <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Sophis Central · Administration</p>
      <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Platform overview</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage platform access, reviewer governance and operational oversight. Privileged permissions are enforced by the backend and recorded in the Admin audit history.</p>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform summary">
      <Metric label="Registered accounts" value={overview.accounts.registeredAccounts} detail={`${overview.accounts.activeVerifiedAccounts} active and email-verified`} icon={Users}/>
      <Metric label="Platform identities" value={overview.platformAccounts.total} detail="Dedicated Support and Moderator accounts" icon={UserCog}/>
      <Metric label="Pending platform approvals" value={overview.platformAccounts.pendingApproval} detail="Support / Moderator approval timestamps missing" icon={ShieldCheck}/>
      <Metric label="Reviewer applications" value={pendingApplications} detail="Submitted, under review or awaiting information" icon={ClipboardList}/>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Existing designated identity</p><h3 className="mt-2 text-xl font-bold text-slate-950">Global Academic Reviewer</h3></div>
          <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><ShieldCheck size={21}/></span>
        </div>
        {globalReviewer ? <>
          <p className="mt-4 break-all text-sm font-semibold text-slate-900">{globalReviewer.email}</p>
          <p className="mt-1 text-sm text-slate-600">{globalReviewerStatus}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Application records</p><p className="mt-1 text-xl font-bold text-slate-900">{globalReviewer.applicationHistoryCount}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Resource reviews completed</p><p className="mt-1 text-xl font-bold text-slate-900">{globalReviewer.moderationReviewCount}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Assignment history events</p><p className="mt-1 text-xl font-bold text-slate-900">{globalReviewer.assignmentEventCount}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Latest application</p><p className="mt-1 text-sm font-semibold capitalize text-slate-900">{globalReviewer.latestApplication?.status.replace(/_/g, ' ') ?? 'No application record'}</p></div>
          </div>
          {globalReviewer.latestModerationReview && <p className="mt-3 text-xs leading-5 text-slate-600">Latest resource review: <span className="font-semibold">{globalReviewer.latestModerationReview.resourceTitle || 'Resource record'}</span> · {globalReviewer.latestModerationReview.status.replace(/_/g, ' ')} · {formatDate(globalReviewer.latestModerationReview.createdAt)}</p>}
          <p className="mt-4 text-xs leading-5 text-slate-500">This existing account, application records, reviewer assignments and resource-review history are preserved. Global Reviewer authority is separate from Admin, Moderator and Support permissions.</p>
        </> : <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">The account using sophiscentral@gmail.com was not found. Do not create a replacement. Verify its existing record before changing reviewer access.</p>}
        <Link to="/admin/reviewers?tab=applications" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">Open reviewer governance <ArrowRight size={15}/></Link>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Administration workspace</p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">Quick access</h3>
        <div className="mt-4 space-y-3">
          <AdminLink to="/admin/accounts" title="Platform accounts" description="Review the existing Moderator identity and dedicated Support account approval."/>
          <AdminLink to="/admin/reviewers?tab=applications" title="Reviewer governance" description="Review applications, decisions, suspensions, revocations and reviewer history."/>
          <AdminLink to="/admin/audit" title="Audit history" description="Inspect recorded platform-role and reviewer access decisions."/>
          <AdminLink to="/admin/escalations" title="Escalation centre" description="Review issues escalated by Support and Moderation."/>
        </div>
      </article>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2 text-violet-700"><Activity size={19}/></span><div><h3 className="font-semibold text-slate-950">Recent administrative activity</h3><p className="mt-1 text-xs text-slate-500">Recorded platform-role approvals and reviewer application decisions</p></div></div>
        <Link to="/admin/audit" className="text-sm font-semibold text-violet-700 hover:text-violet-900">View all</Link>
      </div>
      {events.length ? <div className="mt-4 divide-y divide-slate-100">
        {events.map(event => <div key={`${event.eventType}-${event.id}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium text-slate-900">{eventLabel(event)}</p><p className="mt-1 text-xs text-slate-500">By {event.actorName || event.actorEmail || 'Former / unavailable account'} · For {event.targetName || event.targetEmail || 'Unavailable account'}</p></div>
          <time className="shrink-0 text-xs text-slate-500">{formatDate(event.createdAt)}</time>
        </div>)}
      </div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No platform-role or reviewer decision events have been recorded yet.</p>}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3"><LifeBuoy size={19} className="text-violet-700"/><div><h3 className="font-semibold text-slate-900">Privileged account provisioning</h3><p className="mt-1 text-sm leading-6 text-slate-600">Admin is provisioned through a controlled bootstrap. Support and Moderator remain unavailable to their workspaces until identity setup, verification requirements and explicit Admin approval are complete.</p></div></div>
    </section>
  </div>;
}
