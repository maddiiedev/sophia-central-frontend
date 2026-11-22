import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, LifeBuoy, Flag } from 'lucide-react';
import { usersApi, type AdminModerationEscalation, type AdminSupportEscalation } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

function dateLabel(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function AccountLabel({ firstName, lastName, email }: { firstName?: string; lastName?: string; email?: string }) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return <span>{name || email || 'Account details unavailable'}{name && email ? <span className="block text-xs font-normal text-slate-500">{email}</span> : null}</span>;
}

function SupportEscalationCard({ ticket }: { ticket: AdminSupportEscalation }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{ticket.ticketNumber} · Support</p><h3 className="mt-1 text-lg font-bold text-slate-950">{ticket.subject}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{ticket.status.replace(/_/g, ' ')}</span></div>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p className="text-slate-600">Requester: <span className="font-medium text-slate-900"><AccountLabel {...(ticket.user ?? {})}/></span></p><p className="text-slate-600">Category: <span className="font-medium text-slate-900">{ticket.category}</span></p></div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Support escalation reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-amber-950">{ticket.escalationReason || 'Historical escalation; reason not available.'}</p></div>
    {(ticket.attachments?.length || ticket.links?.length) ? <div className="mt-4 flex flex-wrap gap-3 text-sm">{ticket.attachments?.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 underline">Attachment {index + 1}</a>)}{ticket.links?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="break-all font-semibold text-violet-700 underline">Related link</a>)}</div> : null}
    <p className="mt-4 text-xs text-slate-500">Escalated: {dateLabel(ticket.escalatedAt)} · Submitted: {dateLabel(ticket.createdAt)}</p>
  </article>;
}

function ModerationEscalationCard({ report }: { report: AdminModerationEscalation }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{report.ticketNumber} · Moderation</p><h3 className="mt-1 text-lg font-bold text-slate-950">{report.targetLabel}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{report.status.replace(/_/g, ' ')}</span></div>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p className="text-slate-600">Reported by: <span className="font-medium text-slate-900"><AccountLabel {...(report.reporter ?? {})}/></span></p><p className="text-slate-600">Target type: <span className="font-medium capitalize text-slate-900">{report.targetType.replace(/_/g, ' ')}</span></p></div>
    <p className="mt-4 text-sm leading-6 text-slate-700">Report reason: <span className="font-semibold capitalize">{report.reason.replace(/_/g, ' ')}</span></p>
    {report.details && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.details}</p>}
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Moderator escalation reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-amber-950">{report.escalationReason || 'Escalation reason not available.'}</p></div>
    {report.assignedModerator && <p className="mt-3 text-sm text-slate-600">Assigned Moderator: <span className="font-medium text-slate-900"><AccountLabel {...(report.assignedModerator ?? {})}/></span></p>}
    <p className="mt-4 text-xs text-slate-500">Escalated: {dateLabel(report.escalatedAt)} · Reported: {dateLabel(report.createdAt)}</p>
  </article>;
}

export function AdminEscalationsPage() {
  const supportQuery = useQuery({ queryKey: ['admin-support-escalations'], queryFn: usersApi.adminSupportEscalations, staleTime: 30_000 });
  const moderationQuery = useQuery({ queryKey: ['admin-moderation-escalations'], queryFn: usersApi.adminModerationEscalations, staleTime: 30_000 });

  if (supportQuery.isLoading || moderationQuery.isLoading) return <LoadingState message="Loading Admin escalation queues..." />;
  if (supportQuery.isError || moderationQuery.isError) return <ErrorState message="Unable to load both escalation queues." onRetry={() => { void supportQuery.refetch(); void moderationQuery.refetch(); }} />;

  const support: AdminSupportEscalation[] = supportQuery.data ?? [];
  const moderation: AdminModerationEscalation[] = moderationQuery.data ?? [];
  return <div className="space-y-7">
    <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Admin workspace · Escalations</p>
      <h2 className="mt-2 text-2xl font-bold">Escalation centre</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review issues escalated by the designated Support and Moderator accounts. New escalations are stored with their reason, originator and timestamp. Older Support escalations may not have retained their original reason.</p>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><LifeBuoy className="text-violet-700" size={20}/><p className="text-sm font-medium text-slate-600">Support escalations</p></div><p className="mt-3 text-3xl font-bold text-slate-950">{support.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><Flag className="text-violet-700" size={20}/><p className="text-sm font-medium text-slate-600">Moderation escalations</p></div><p className="mt-3 text-3xl font-bold text-slate-950">{moderation.length}</p></div>
    </div>

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><LifeBuoy size={19} className="text-violet-700"/><h3 className="text-lg font-bold text-slate-950">Support escalations</h3></div><span className="text-xs text-slate-500">Latest 100</span></div>
      {support.length ? support.map(ticket => <SupportEscalationCard key={ticket.id} ticket={ticket}/>) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No Support escalations have been received.</p>}
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Flag size={19} className="text-violet-700"/><h3 className="text-lg font-bold text-slate-950">Moderation escalations</h3></div><span className="text-xs text-slate-500">Latest 100</span></div>
      {moderation.length ? moderation.map(report => <ModerationEscalationCard key={report.id} report={report}/>) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No Moderation escalations have been received.</p>}
    </section>

    <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>This workspace currently provides Admin visibility and traceability. Resolution actions will be added as a separate, audited workflow rather than silently changing Support or Moderation ticket states.</p>
  </div>;
}
