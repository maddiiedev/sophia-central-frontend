import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api/client';
import { SectionTitle } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';

type ManagedUser = { id: string; firstName?: string; lastName?: string; name?: string; email: string; academicHandle?: string; role: string; institution?: string; isSuspended?: boolean; accountStatus?: 'active' | 'deactivated' | 'pending_deletion'; deletionScheduledAt?: string; reviewerExpertise?: string[] };

export function ModerationManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expertiseByUser, setExpertiseByUser] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiRequest<ManagedUser[]>('/users/management');
      setUsers(Array.isArray(data) ? data.filter((account) => user?.role === 'admin' ? ['student', 'lecturer', 'reviewer'].includes(account.role) : ['student', 'lecturer'].includes(account.role)) : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load accounts.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void loadUsers(); }, []);
  const filtered = useMemo(() => users.filter((item) => item.role !== 'moderator' && [item.firstName, item.lastName, item.name, item.email, item.academicHandle, item.role, item.institution].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase())), [users, query]);

  const setSuspended = async (account: ManagedUser, suspended: boolean) => {
    if (!['student', 'lecturer', 'reviewer'].includes(account.role)) return;
    if (user?.role === 'moderator' && !['student', 'lecturer'].includes(account.role)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/users/${encodeURIComponent(account.id)}/status`, { method: 'PATCH', body: JSON.stringify({ isSuspended: suspended, reason: suspended ? 'Suspended from moderation management' : 'Restored from moderation management' }) });
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, isSuspended: suspended } : item));
      setNotice(`${account.email} was ${suspended ? 'suspended' : 'restored'}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update account status.'); }
    finally { setBusy(false); }
  };

  const reactivateDeactivated = async (account: ManagedUser) => {
    if (account.accountStatus !== 'deactivated' || account.isSuspended) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/users/${encodeURIComponent(account.id)}/reactivate`, { method: 'POST' });
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, accountStatus: 'active' } : item));
      setNotice(`${account.email} was reactivated.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reactivate account.'); }
    finally { setBusy(false); }
  };

  const setReviewerAccess = async (account: ManagedUser, enabled: boolean) => {
    if (user?.role !== 'admin') return;
    const expertiseAreas = (expertiseByUser[account.id] ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (enabled && expertiseAreas.length === 0) { setError('Enter at least one subject expertise area before granting reviewer access.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/users/${encodeURIComponent(account.id)}/reviewer-access`, { method: 'PATCH', body: JSON.stringify({ enabled, ...(enabled ? { expertiseAreas } : {}) }) });
      setNotice(`${account.email} reviewer access was ${enabled ? 'granted' : 'revoked'}.`);
      await loadUsers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update reviewer access.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <SectionTitle eyebrow="Moderator tools" title="User & points management" />
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#5C6982]">{user?.role === 'moderator' ? 'Manage student and lecturer accounts. Reviewer access and platform permissions remain an Admin responsibility.' : 'Manage eligible accounts and administer reviewer access.'}</p><Link to="/moderation/management/wisdom-points" className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B]">Wisdom Points oversight</Link></div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2.5"><Search size={17} className="text-[#5C6982]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, email, role or institution" className="w-full text-sm outline-none" aria-label="Search users"/></label>
        <button type="button" onClick={() => void loadUsers()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2.5 text-sm font-semibold text-[#091F5B]"><RefreshCw size={15}/> Refresh</button>
      </div>
      {loading ? <p className="p-5 text-sm text-[#5C6982]">Loading user accounts…</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#DCE4EF] text-xs uppercase text-[#5C6982]"><th className="px-3 py-3">Account</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{filtered.map((account) => <tr key={account.id} className="border-b border-[#EEF1F6]"><td className="px-3 py-3"><div className="font-semibold text-[#091F5B]">{account.firstName || account.name || 'User'} {account.lastName || ''}</div><div className="text-xs text-[#5C6982]">{account.email} · {account.institution || 'Institution not set'}</div>{account.academicHandle && <div className="text-xs text-[#6121D0]">@{account.academicHandle.replace(/^@+/, '')}</div>}</td><td className="px-3 py-3 capitalize">{account.role}{account.role === 'reviewer' && <div className="mt-1 max-w-[220px] text-[11px] normal-case text-[#5C6982]">{(account.reviewerExpertise ?? []).join(', ') || 'No expertise recorded'}</div>}</td><td className="px-3 py-3">{account.isSuspended ? 'Moderator suspended' : account.accountStatus === 'pending_deletion' ? `Pending deletion · ${account.deletionScheduledAt ? new Date(account.deletionScheduledAt).toLocaleDateString() : 'scheduled'}` : account.accountStatus === 'deactivated' ? 'User deactivated' : 'Active'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{account.role === 'student' && <button type="button" onClick={() => navigate(`/moderation/management/wisdom-points/${encodeURIComponent(account.id)}`)} className="rounded-lg border border-[#DCE4EF] px-2.5 py-1.5 text-xs font-semibold text-[#6121D0]">Points</button>}{user?.role === 'admin' && account.role === 'reviewer' && <button type="button" disabled={busy} onClick={() => void setReviewerAccess(account, false)} className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-50">Revoke reviewer</button>}{user?.role === 'admin' && (account.role === 'student' || account.role === 'lecturer') && <div className="flex min-w-[240px] gap-1"><input aria-label={`Subject expertise for ${account.email}`} value={expertiseByUser[account.id] ?? ''} onChange={(event) => setExpertiseByUser((current) => ({ ...current, [account.id]: event.target.value }))} placeholder="Subject expertise, comma-separated" className="min-w-0 w-36 rounded-lg border border-[#DCE4EF] px-2 py-1.5 text-xs"/><button type="button" disabled={busy} onClick={() => void setReviewerAccess(account, true)} className="rounded-lg border border-[#6121D0] px-2 py-1.5 text-xs font-semibold text-[#6121D0] disabled:opacity-50">Grant reviewer</button></div>}{account.accountStatus === 'deactivated' && !account.isSuspended ? <button type="button" disabled={busy} onClick={() => void reactivateDeactivated(account)} className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50">Reactivate</button> : <button type="button" disabled={busy} onClick={() => void setSuspended(account, !account.isSuspended)} className="rounded-lg border border-[#DCE4EF] px-2.5 py-1.5 text-xs font-semibold text-[#091F5B] disabled:opacity-50">{account.isSuspended ? 'Restore suspension' : 'Suspend'}</button>}</div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-5 text-sm text-[#5C6982]">No matching accounts.</p>}</div>}
    </section>
  </div>;
}
