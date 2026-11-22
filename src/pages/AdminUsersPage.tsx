import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, UserCog, AlertTriangle } from 'lucide-react';
import { usersApi, type PlatformAccount } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

type PlatformAction = 'suspend' | 'restore' | 'revoke';

function statusLabel(account: PlatformAccount) {
  if (account.accountStatus !== 'active') return `Account ${account.accountStatus.replace(/_/g, ' ')}`;
  if (account.isSuspended || account.platformRoleStatus === 'suspended') return 'Suspended';
  return account.platformRoleStatus.charAt(0).toUpperCase() + account.platformRoleStatus.slice(1);
}

function PlatformAccountCard({
  title,
  account,
  reason,
  setReason,
  updating,
  onApprove,
  onAction,
}: {
  title: string;
  account?: PlatformAccount;
  reason: string;
  setReason: (value: string) => void;
  updating: boolean;
  onApprove: (account: PlatformAccount) => void;
  onAction: (account: PlatformAccount, action: PlatformAction) => void;
}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">{title}</p><h3 className="mt-2 text-lg font-bold text-slate-950">{account ? [account.firstName, account.lastName].filter(Boolean).join(' ') || 'Platform account' : 'Not provisioned'}</h3></div>
      <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><UserCog size={20}/></span>
    </div>
    {account ? <>
      <p className="mt-3 break-all text-sm font-medium text-slate-700">{account.email}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${account.platformRoleStatus === 'approved' && !account.isSuspended ? 'bg-emerald-50 text-emerald-800' : account.platformRoleStatus === 'suspended' ? 'bg-amber-50 text-amber-800' : account.platformRoleStatus === 'revoked' ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel(account)}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{account.emailVerified ? 'Email verified' : 'Email not verified'}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Account lifecycle: {account.accountStatus}. Workspace access requires verified email, an active account and explicit Admin approval.</p>
      {account.platformRoleStatus === 'pending' || account.platformRoleStatus === 'revoked' ? (
        <button type="button" disabled={updating || !account.emailVerified || account.accountStatus !== 'active' || account.isSuspended} onClick={() => onApprove(account)} className="mt-4 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40">
          {updating ? 'Saving…' : account.platformRoleStatus === 'revoked' ? 'Approve access again' : 'Approve platform access'}
        </button>
      ) : account.platformRoleStatus === 'approved' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={updating} onClick={() => onAction(account, 'suspend')} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Suspend access</button>
          <button type="button" disabled={updating} onClick={() => onAction(account, 'revoke')} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Revoke access</button>
        </div>
      ) : account.platformRoleStatus === 'suspended' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={updating || account.accountStatus !== 'active'} onClick={() => onAction(account, 'restore')} className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">Restore access</button>
          <button type="button" disabled={updating} onClick={() => onAction(account, 'revoke')} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Revoke access</button>
        </div>
      ) : null}
    </> : <p className="mt-3 text-sm leading-6 text-slate-600">{title.includes('Moderator') ? 'The existing account that operates /moderation must be preserved. Do not create a replacement.' : 'The dedicated Sophis Support login will be provisioned after the Support workspace is complete.'}</p>}
    {account && account.platformRoleStatus !== 'pending' && account.platformRoleStatus !== 'revoked' && (
      <label className="mt-4 block text-xs font-medium text-slate-600">
        Reason for suspension or revocation
        <textarea value={reason} onChange={event => setReason(event.target.value)} rows={2} maxLength={1000} placeholder="Enter a reason before suspending or revoking access." className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"/>
      </label>
    )}
  </article>;
}

export function AdminUsersPage() {
  const platformQuery = useQuery({ queryKey: ['platform-accounts'], queryFn: usersApi.platformAccounts, staleTime: 30_000 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});

  if (platformQuery.isLoading) return <LoadingState message="Loading platform accounts..." />;
  if (platformQuery.isError) return <ErrorState message="Unable to load platform accounts." onRetry={() => void platformQuery.refetch()} />;

  const accounts: PlatformAccount[] = platformQuery.data ?? [];
  const moderator = accounts.find(account => account.role === 'moderator');
  const support = accounts.find(account => account.role === 'support');

  const approve = async (account: PlatformAccount) => {
    if (updatingId || !account.emailVerified || account.accountStatus !== 'active' || account.isSuspended) return;
    setUpdatingId(account.id);
    setActionError('');
    setActionNotice('');
    try {
      await usersApi.assignPlatformRole(account.id, account.role);
      setActionNotice(`The existing ${account.role} account has been Admin-approved.`);
      await platformQuery.refetch();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to approve platform access.');
    } finally {
      setUpdatingId(null);
    }
  };

  const performAction = async (account: PlatformAccount, action: PlatformAction) => {
    const reason = reasons[account.id]?.trim();
    if (action !== 'restore' && !reason) {
      setActionError('Enter a reason before suspending or revoking platform access.');
      return;
    }
    if (updatingId) return;
    setUpdatingId(account.id);
    setActionError('');
    setActionNotice('');
    try {
      await usersApi.updatePlatformRoleAccess(account.id, action, reason);
      setActionNotice(`${account.role} platform access ${action === 'restore' ? 'restored' : action === 'suspend' ? 'suspended' : 'revoked'}.`);
      setReasons(current => ({ ...current, [account.id]: '' }));
      await platformQuery.refetch();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to update platform access.');
    } finally {
      setUpdatingId(null);
    }
  };

  const setReason = (id: string, value: string) => setReasons(current => ({ ...current, [id]: value }));

  return <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white">
      <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Admin workspace · Platform access</p>
      <h2 className="mt-2 text-2xl font-bold">Platform accounts</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">Manage only the designated Support and existing Moderator identities. Ordinary student, lecturer and reviewer accounts cannot be converted into platform accounts here.</p>
    </div>

    {actionError && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
    {actionNotice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{actionNotice}</p>}

    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle size={18} className="mt-0.5 shrink-0"/><p>Approval is blocked until the designated account has a real, verified mailbox and an active account. The existing Moderator currently uses a temporary non-mailbox identity, so it must complete its authentication migration before approval.</p></div>

    <section className="grid gap-4 lg:grid-cols-2" aria-label="Dedicated platform accounts">
      <PlatformAccountCard title="Existing Sophis Moderator" account={moderator} reason={reasons[moderator?.id ?? ''] ?? ''} setReason={value => moderator && setReason(moderator.id, value)} updating={Boolean(updatingId)} onApprove={approve} onAction={performAction}/>
      <PlatformAccountCard title="Dedicated Sophis Support account" account={support} reason={reasons[support?.id ?? ''] ?? ''} setReason={value => support && setReason(support.id, value)} updating={Boolean(updatingId)} onApprove={approve} onAction={performAction}/>
    </section>
    <p className="text-xs leading-5 text-slate-500">Every approval, suspension, restoration and revocation is recorded by the backend. Revocation removes platform workspace authorization without deleting the account or its history.</p>
  </div>;
}
