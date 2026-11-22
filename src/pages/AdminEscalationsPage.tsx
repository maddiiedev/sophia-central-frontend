import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, LifeBuoy, Flag, ClipboardCheck } from 'lucide-react';
import { usersApi, type AdminEscalationDecision, type AdminModerationEscalation, type AdminSupportEscalation } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

type DecisionAction = AdminEscalationDecision['action'];

function dateLabel(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function AccountLabel({ firstName, lastName, email }: { firstName?: string; lastName?: string; email?: string }) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return <span>{name || email || 'Account details unavailable'}{name && email ? <span className="block text-xs font-normal text-slate-500">{email}</span> : null}</span>;
}

const actionLabels: Record<DecisionAction, string> = {
  under_review: 'Take ownership · Under review',
  awaiting_information: 'Request more information',
  returned_to_team: 'Return to originating team',
  resolved: 'Resolve escalation',
};

function DecisionPanel({ decision, history = [], busy, onSubmit }: {
  decision?: AdminEscalationDecision | null;
  history?: AdminEscalationDecision[];
  busy?: boolean;
  onSubmit: (action: DecisionAction, note: string) => Promise<unknown>;
}) {
  const [action, setAction] = useState<DecisionAction>('under_review');
  const [note, setNote] = useState('');
  const resolved = decision?.action === 'resolved';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (note.trim().length < 10 || busy || resolved) return;
    try {
      await onSubmit(action, note.trim());
      setNote('');
    } catch {
      // Keep the note in place so Admin can retry after a failed request.
    }
  }

  return <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
    <div className="flex items-center gap-2 text-sm font-semibold text-violet-950 dark:text-violet-100"><ClipboardCheck size={17}/> Admin decision and case handling</div>
    {decision ? <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold capitalize text-slate-900 dark:text-slate-100">Latest action: {decision.action.replace(/_/g, ' ')}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{decision.note}</p>
      <p className="mt-2 text-xs text-slate-500">{decision.actorEmail || 'Admin'} · {dateLabel(decision.createdAt)}</p>
    </div> : <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">No Admin decision has been recorded yet.</p>}
    {history.length > 1 && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">View full decision history ({history.length})</summary><ol className="mt-2 space-y-2">{history.map(item => <li key={item.id} className="border-l-2 border-violet-300 pl-3"><p className="font-semibold capitalize text-slate-800 dark:text-slate-100">{item.action.replace(/_/g, ' ')}</p><p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{item.note}</p><p className="text-xs text-slate-500">{item.actorEmail || 'Admin'} · {dateLabel(item.createdAt)}</p></li>)}</ol></details>}
    {resolved ? <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">This escalation is resolved. Its original Support or Moderation record remains unchanged.</p> : <form onSubmit={submit} className="mt-3 space-y-3">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Admin action
        <select value={action} onChange={event => setAction(event.target.value as DecisionAction)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Decision note · required
        <textarea value={note} onChange={event => setNote(event.target.value)} minLength={10} maxLength={2000} rows={3} required placeholder="Record the reason, instructions, findings or resolution..." className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">10–2,000 characters. Every decision is permanently audited.</p>
        <button type="submit" disabled={busy || note.trim().length < 10} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving...' : 'Record Admin decision'}</button>
      </div>
    </form>}
  </div>;
}

function SupportEscalationCard({ ticket, onDecision, busy }: {
  ticket: AdminSupportEscalation;
  onDecision: (id: string, action: DecisionAction, note: string) => Promise<unknown>;
  busy?: boolean;
}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{ticket.ticketNumber} · Support</p><h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{ticket.subject}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{ticket.status.replace(/_/g, ' ')}</span></div>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p className="text-slate-600 dark:text-slate-300">Requester: <span className="font-medium text-slate-900 dark:text-white"><AccountLabel {...(ticket.user ?? {})}/></span></p><p className="text-slate-600 dark:text-slate-300">Category: <span className="font-medium text-slate-900 dark:text-white">{ticket.category}</span></p></div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{ticket.description}</p>
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Support escalation reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-amber-950">{ticket.escalationReason || 'Historical escalation; reason not available.'}</p></div>
    {(ticket.attachments?.length || ticket.links?.length) ? <div className="mt-4 flex flex-wrap gap-3 text-sm">{ticket.attachments?.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 underline">Attachment {index + 1}</a>)}{ticket.links?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="break-all font-semibold text-violet-700 underline">Related link</a>)}</div> : null}
    <p className="mt-4 text-xs text-slate-500">Escalated: {dateLabel(ticket.escalatedAt)} · Submitted: {dateLabel(ticket.createdAt)}</p>
    <DecisionPanel decision={ticket.adminDecision} history={ticket.adminDecisionHistory} busy={busy} onSubmit={(action, note) => onDecision(ticket.id, action, note)}/>
  </article>;
}

function ModerationEscalationCard({ report, onDecision, busy }: {
  report: AdminModerationEscalation;
  onDecision: (id: string, action: DecisionAction, note: string) => Promise<unknown>;
  busy?: boolean;
}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{report.ticketNumber} · Moderation</p><h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{report.targetLabel}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{report.status.replace(/_/g, ' ')}</span></div>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p className="text-slate-600 dark:text-slate-300">Reported by: <span className="font-medium text-slate-900 dark:text-white"><AccountLabel {...(report.reporter ?? {})}/></span></p><p className="text-slate-600 dark:text-slate-300">Target type: <span className="font-medium capitalize text-slate-900 dark:text-white">{report.targetType.replace(/_/g, ' ')}</span></p></div>
    <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">Report reason: <span className="font-semibold capitalize">{report.reason.replace(/_/g, ' ')}</span></p>
    {report.details && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{report.details}</p>}
    {report.targetSnapshot && <details className="mt-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"><summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Inspect captured target snapshot</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-300">{JSON.stringify(report.targetSnapshot, null, 2)}</pre></details>}
    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Moderator escalation reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-amber-950">{report.escalationReason || 'Escalation reason not available.'}</p></div>
    {report.assignedModerator && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Assigned Moderator: <span className="font-medium text-slate-900 dark:text-white"><AccountLabel {...(report.assignedModerator ?? {})}/></span></p>}
    <p className="mt-4 text-xs text-slate-500">Escalated: {dateLabel(report.escalatedAt)} · Reported: {dateLabel(report.createdAt)}</p>
    <DecisionPanel decision={report.adminDecision} history={report.adminDecisionHistory} busy={busy} onSubmit={(action, note) => onDecision(report.id, action, note)}/>
  </article>;
}

export function AdminEscalationsPage() {
  const queryClient = useQueryClient();
  const supportQuery = useQuery({ queryKey: ['admin-support-escalations'], queryFn: usersApi.adminSupportEscalations, staleTime: 30_000 });
  const moderationQuery = useQuery({ queryKey: ['admin-moderation-escalations'], queryFn: usersApi.adminModerationEscalations, staleTime: 30_000 });
  const supportDecision = useMutation({
    mutationFn: (input: { id: string; action: DecisionAction; note: string }) => usersApi.recordAdminSupportDecision(input.id, input.action, input.note),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-support-escalations'] }); },
  });
  const moderationDecision = useMutation({
    mutationFn: (input: { id: string; action: DecisionAction; note: string }) => usersApi.recordAdminModerationDecision(input.id, input.action, input.note),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-moderation-escalations'] }); },
  });

  if (supportQuery.isLoading || moderationQuery.isLoading) return <LoadingState message="Loading Admin escalation queues..."/>;
  if (supportQuery.isError || moderationQuery.isError) return <ErrorState message="Unable to load both escalation queues." onRetry={() => { void supportQuery.refetch(); void moderationQuery.refetch(); }}/>;

  const support: AdminSupportEscalation[] = supportQuery.data ?? [];
  const moderation: AdminModerationEscalation[] = moderationQuery.data ?? [];
  return <div className="space-y-7">
    <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 text-slate-950 shadow-sm sm:p-8 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">Admin workspace · Escalations</p>
      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Escalation centre</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Review, decide and track cases escalated by Support and Moderation. Admin decisions are recorded separately from the originating ticket or report, preserving the original team’s status and history.</p>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><LifeBuoy className="text-violet-700" size={20}/><p className="text-sm font-medium text-slate-600 dark:text-slate-300">Support escalations</p></div><p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{support.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><Flag className="text-violet-700" size={20}/><p className="text-sm font-medium text-slate-600 dark:text-slate-300">Moderation escalations</p></div><p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{moderation.length}</p></div>
    </div>

    {(supportDecision.isError || moderationDecision.isError) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">The Admin decision could not be saved. Check the note and your connection, then retry. No decision was recorded unless the save succeeded.</p>}

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><LifeBuoy size={19} className="text-violet-700"/><h3 className="text-lg font-bold text-slate-950 dark:text-white">Support escalations</h3></div><span className="text-xs text-slate-500">Latest 100</span></div>
      {support.length ? support.map(ticket => <SupportEscalationCard key={ticket.id} ticket={ticket} busy={supportDecision.isPending} onDecision={(id, action, note) => supportDecision.mutateAsync({ id, action, note })}/>) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No Support escalations have been received.</p>}
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Flag size={19} className="text-violet-700"/><h3 className="text-lg font-bold text-slate-950 dark:text-white">Moderation escalations</h3></div><span className="text-xs text-slate-500">Latest 100</span></div>
      {moderation.length ? moderation.map(report => <ModerationEscalationCard key={report.id} report={report} busy={moderationDecision.isPending} onDecision={(id, action, note) => moderationDecision.mutateAsync({ id, action, note })}/>) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No Moderation escalations have been received.</p>}
    </section>

    <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>Admin decisions are append-only and independently audited. Returning a case notifies the originating team; requesting information or recording resolution notifies the person who submitted the original request/report. The Support ticket and Moderation report statuses are not overwritten by this workflow.</p>
  </div>;
}
