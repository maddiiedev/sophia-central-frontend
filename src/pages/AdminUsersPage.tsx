import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { EmptyState } from '../components/states/EmptyState';

export function AdminUsersPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['users'], queryFn: usersApi.list, staleTime: 30_000 });
  if (isLoading) return <LoadingState message="Loading users..." />;
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Unable to load users.'} onRetry={() => void refetch()} />;
  const users = data ?? [];
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const assignSupport = async (id: string, name: string) => {
    const confirmed = window.confirm(`Assign ${name} the dedicated Support role? This replaces their current primary role and removes access to their current student, lecturer or reviewer workspace.`);
    if (!confirmed) return;
    setUpdatingId(id); setActionError(''); setActionNotice('');
    try { await usersApi.assignSupportRole(id); setActionNotice(`${name} now has the Support role.`); await refetch(); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Unable to assign the Support role.'); }
    finally { setUpdatingId(null); }
  };
  return <div className="space-y-6"><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-violet-200">Admin dashboard · Users</p><h2 className="mt-2 text-2xl font-semibold text-white">User management</h2><p className="mt-2 text-sm text-slate-400">Review academic identities, roles and profile completion without exposing sensitive credentials.</p></div>{actionError && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}{actionNotice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{actionNotice}</p>}{users.length === 0 ? <EmptyState title="No users found" description="There are no users available to review." /> : <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Institution</th><th className="px-4 py-3">Profile</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Platform role</th></tr></thead><tbody className="divide-y divide-slate-800">{users.map((item) => <tr key={item.id} className="text-slate-300"><td className="px-4 py-4"><div className="font-medium text-white">{item.firstName || item.name || 'Unnamed user'} {item.lastName || ''}</div><div className="text-xs text-slate-500">{item.email}</div></td><td className="px-4 py-4 capitalize">{item.role}</td><td className="px-4 py-4">{item.institution || 'Not set'}</td><td className="px-4 py-4">{item.isProfileComplete ? <span className="text-emerald-300">Complete</span> : <span className="text-amber-300">Incomplete</span>}</td><td className="px-4 py-4">{item.isVerified ? <span className="text-emerald-300">Verified</span> : <span className="text-slate-400">Unverified</span>}</td><td className="px-4 py-4">{item.role === 'support' ? <span className="font-semibold text-violet-300">Support</span> : ['student','lecturer','reviewer'].includes(item.role) ? <button type="button" disabled={updatingId === item.id} onClick={() => void assignSupport(item.id, `${item.firstName || item.name || 'This user'} ${item.lastName || ''}`.trim())} className="rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/10 disabled:opacity-50">{updatingId === item.id ? 'Assigning…' : 'Assign Support'}</button> : <span className="text-slate-500">—</span>}</td></tr>)}</tbody></table></div></div>}</div>;
}
