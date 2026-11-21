import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi, type PlatformAccount } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

export function AdminUsersPage() {
  const platformQuery = useQuery({
    queryKey: ['platform-accounts'],
    queryFn: usersApi.platformAccounts,
    staleTime: 30_000,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  if (platformQuery.isLoading) return <LoadingState message="Loading platform accounts..." />;
  if (platformQuery.isError) return <ErrorState message="Unable to load platform accounts." onRetry={() => void platformQuery.refetch()} />;

  const accounts: PlatformAccount[] = platformQuery.data ?? [];
  const moderator = accounts.find(account => account.role === 'moderator');
  const support = accounts.find(account => account.role === 'support');

  const verifyExistingModerator = async () => {
    if (!moderator || updatingId) return;
    setUpdatingId(moderator.id);
    setActionError('');
    setActionNotice('');
    try {
      await usersApi.assignPlatformRole(moderator.id, 'moderator');
      setActionNotice('The existing Sophis Moderator account has been Admin-approved.');
      await platformQuery.refetch();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to verify the existing Moderator account.');
    } finally {
      setUpdatingId(null);
    }
  };

  const accountDetails = (account: PlatformAccount) => (
    <>
      <p className="font-semibold text-white">{[account.firstName, account.lastName].filter(Boolean).join(' ') || 'Platform account'}</p>
      <p className="mt-1 break-all text-sm text-slate-400">{account.email}</p>
      <p className="mt-3 text-xs text-slate-300">
        {account.platformRoleVerifiedAt ? 'Admin approved' : 'Admin approval pending'} · {account.emailVerified ? 'Email verified' : 'Email not verified'} · {account.accountStatus} · {account.isSuspended ? 'Suspended' : 'Not suspended'}
      </p>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200">Admin dashboard · Platform access</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Platform accounts</h2>
        <p className="mt-2 text-sm text-slate-400">These are dedicated platform identities. Linking never converts an ordinary student or lecturer account into a staff account.</p>
      </div>

      {actionError && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
      {actionNotice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{actionNotice}</p>}

      <section className="grid gap-4 md:grid-cols-2" aria-label="Dedicated platform accounts">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Existing Sophis Moderator</p>
          {moderator ? (
            <>
              <div className="mt-3">{accountDetails(moderator)}</div>
              {!moderator.platformRoleVerifiedAt && moderator.emailVerified && moderator.accountStatus === 'active' && !moderator.isSuspended && (
                <button type="button" disabled={Boolean(updatingId)} onClick={() => void verifyExistingModerator()} className="mt-4 rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/10 disabled:opacity-50">
                  {updatingId === moderator.id ? 'Verifying…' : 'Admin-verify existing Moderator'}
                </button>
              )}
              <p className="mt-3 text-xs text-slate-500">This is the existing account that already operates the /moderation workspace. It cannot be replaced by selecting another user here.</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-amber-300">The existing Moderator account was not returned by the backend. Do not create or assign a replacement; investigate the current /moderation account first.</p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Dedicated Sophis Support account</p>
          {support ? <div className="mt-3">{accountDetails(support)}</div> : (
            <>
              <p className="mt-3 text-sm font-semibold text-white">Not provisioned yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">The dedicated Sophis Support login will be created after the Support workspace implementation. It will then be linked and approved here by Admin.</p>
            </>
          )}
          <p className="mt-3 text-xs text-slate-500">No student, lecturer, or other existing user can be converted into the Support account through this screen.</p>
        </article>
      </section>
    </div>
  );
}
