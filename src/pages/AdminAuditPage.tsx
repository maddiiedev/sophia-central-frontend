import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldCheck, ClipboardList } from 'lucide-react';
import { usersApi } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

export function AdminAuditPage() {
  const query = useQuery({
    queryKey: ['admin-audit-events', 100],
    queryFn: () => usersApi.adminAuditEvents(100),
    staleTime: 30_000,
  });

  if (query.isLoading) return <LoadingState message="Loading administrative audit history..." />;
  if (query.isError) return <ErrorState message="Unable to load administrative audit history." onRetry={() => void query.refetch()} />;

  const events = query.data ?? [];
  return <div className="space-y-6">
    <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 text-slate-950 shadow-sm sm:p-8 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-white/10 dark:text-violet-200"><Activity size={22}/></span><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">Administration · Security</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Audit history</h2></div></div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Review recorded platform-role approvals, reviewer application decisions, reviewer assignments, academic resource reviews, Admin bootstrap events and Admin MFA enrollment/login activity. Audit-event records are read-only in this workspace.</p>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-lg font-semibold text-slate-950">Recent recorded events</p><p className="mt-1 text-sm text-slate-500">Showing the latest {events.length} recorded events, up to 100.</p></div>
      <div className="flex gap-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5"><ShieldCheck size={14}/> Platform access</span><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5"><ClipboardList size={14}/> Reviewer decisions</span></div>
    </div>

    {events.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <ol className="divide-y divide-slate-100">
        {events.map(event => <li key={`${event.eventType}-${event.id}`} className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${event.eventType === 'platform_role' ? 'bg-violet-50 text-violet-800' : 'bg-slate-100 text-slate-700'}`}>{event.eventType === 'platform_role' ? 'Platform role' : event.eventType === 'reviewer_application' ? 'Reviewer application' : event.eventType === 'reviewer_assignment' ? 'Reviewer assignment' : event.eventType === 'resource_review' ? 'Resource review' : event.eventType === 'admin_bootstrap' ? 'Admin bootstrap' : event.eventType === 'admin_mfa' ? 'Admin MFA' : 'Admin escalation'}</span><span className="text-sm font-semibold capitalize text-slate-950">{event.action.replace(/_/g, ' ')}{event.eventType === 'platform_role' ? ` · ${event.role}` : ''}</span></div>
              <p className="mt-2 break-words text-sm text-slate-700">Actor: <span className="font-medium">{event.actorName || event.actorEmail || 'Unavailable account'}</span></p>
              <p className="mt-1 break-words text-sm text-slate-700">Affected account / record: <span className="font-medium">{event.targetName || event.targetEmail || 'Unavailable account'}</span></p>
              {event.note && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-600">Decision note: {event.note}</p>}
            </div>
            <time className="shrink-0 text-xs text-slate-500">{dateLabel(event.createdAt)}</time>
          </div>
        </li>)}
      </ol>
    </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Activity className="mx-auto text-slate-400" size={28}/><p className="mt-3 font-semibold text-slate-900">No audit events yet</p><p className="mt-1 text-sm text-slate-500">Platform-role approvals and reviewer decisions will appear here when recorded.</p></div>}
  </div>;
}
