import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, WalletCards, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api/client';
import { SectionTitle } from '../components/layout/AppShell';

type ManagedUser = { id: string; firstName?: string; lastName?: string; name?: string; email: string; role: string; institution?: string; isSuspended?: boolean };
type Transaction = { id: string; amount: number; reason?: string; type: string; createdAt: string };

export function ModerationManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'users' | 'points'>('users');
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = async () => { setLoading(true); setError(''); try { const data = await apiRequest<ManagedUser[]>('/users/management'); setUsers(Array.isArray(data) ? data : []); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load accounts.'); } finally { setLoading(false); } };
  useEffect(() => { void loadUsers(); }, []);
  const filtered = useMemo(() => users.filter((item) => [item.firstName, item.lastName, item.name, item.email, item.role, item.institution].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())), [users, query]);

  const openPoints = async (account: ManagedUser) => {
    setSelected(account); setTab('points'); setBalance(null); setTransactions([]); setError(''); setNotice('');
    try { const [nextBalance, nextTransactions] = await Promise.all([apiRequest<number>(`/points/${encodeURIComponent(account.id)}/balance`), apiRequest<Transaction[]>(`/points/${encodeURIComponent(account.id)}/transactions?limit=20`)]); setBalance(Number(nextBalance)); setTransactions(Array.isArray(nextTransactions) ? nextTransactions : []); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load wallet activity.'); }
  };
  const setSuspended = async (account: ManagedUser, suspended: boolean) => {
    setBusy(true); setError(''); setNotice('');
    try { await apiRequest(`/users/${encodeURIComponent(account.id)}/status`, { method: 'PATCH', body: JSON.stringify({ isSuspended: suspended, reason: suspended ? 'Suspended from moderation management' : 'Restored from moderation management' }) }); setUsers((current) => current.map((item) => item.id === account.id ? { ...item, isSuspended: suspended } : item)); setNotice(`${account.email} was ${suspended ? 'suspended' : 'restored'}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update account status.'); }
    finally { setBusy(false); }
  };
  const adjustPoints = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !reason.trim() || !Number.isInteger(Number(adjustment)) || Number(adjustment) === 0) return;
    setBusy(true); setError(''); setNotice('');
    try { await apiRequest('/points/adjust', { method: 'POST', body: JSON.stringify({ userId: selected.id, amount: Number(adjustment), reason: reason.trim() }) }); await openPoints(selected); setNotice('Wisdom Points adjustment recorded.'); setAdjustment(''); setReason(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to adjust Wisdom Points.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6"><SectionTitle eyebrow="Moderator tools" title="Management" />
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Management sections"><button type="button" role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${tab === 'users' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}><ShieldCheck size={16}/> Manage users</button><button type="button" role="tab" aria-selected={tab === 'points'} onClick={() => setTab('points')} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${tab === 'points' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}><WalletCards size={16}/> Manage Wisdom Points</button></div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {tab === 'users' ? <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2.5"><Search size={17} className="text-[#5C6982]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role or institution" className="w-full text-sm outline-none" aria-label="Search users"/></label><button type="button" onClick={() => void loadUsers()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2.5 text-sm font-semibold text-[#091F5B]"><RefreshCw size={15}/> Refresh</button></div>
      {loading ? <p className="p-5 text-sm text-[#5C6982]">Loading user accounts…</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#DCE4EF] text-xs uppercase text-[#5C6982]"><th className="px-3 py-3">Account</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{filtered.map((account) => <tr key={account.id} className="border-b border-[#EEF1F6]"><td className="px-3 py-3"><div className="font-semibold text-[#091F5B]">{account.firstName || account.name || 'User'} {account.lastName || ''}</div><div className="text-xs text-[#5C6982]">{account.email} · {account.institution || 'Institution not set'}</div></td><td className="px-3 py-3 capitalize">{account.role}</td><td className="px-3 py-3">{account.isSuspended ? 'Suspended' : 'Active'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openPoints(account)} className="rounded-lg border border-[#DCE4EF] px-2.5 py-1.5 text-xs font-semibold text-[#6121D0]">Points</button><button type="button" disabled={busy} onClick={() => void setSuspended(account, !account.isSuspended)} className="rounded-lg border border-[#DCE4EF] px-2.5 py-1.5 text-xs font-semibold text-[#091F5B] disabled:opacity-50">{account.isSuspended ? 'Restore' : 'Suspend'}</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-5 text-sm text-[#5C6982]">No matching accounts.</p>}</div>}
    </section> : <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><h3 className="font-semibold text-[#091F5B]">Account wallet review</h3>{!selected ? <p className="text-sm text-[#5C6982]">Choose an account from Manage users to inspect its balance, transaction history or adjust points.</p> : <><div className="rounded-xl bg-[#F8FAFD] p-4"><p className="text-xs text-[#5C6982]">Selected account</p><p className="mt-1 font-semibold text-[#091F5B]">{selected.firstName || selected.name || 'User'} {selected.lastName || ''} · {selected.email}</p><p className="mt-3 text-xs text-[#5C6982]">Current balance</p><p className="text-3xl font-bold text-[#6121D0]">{balance === null ? '—' : balance.toLocaleString()} WP</p></div>
      <form onSubmit={adjustPoints} className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium text-[#091F5B]">Adjustment (+/- points)<input type="number" step="1" required value={adjustment} onChange={(event) => setAdjustment(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2.5" placeholder="e.g. 10 or -5"/></label><label className="text-sm font-medium text-[#091F5B] md:col-span-2">Reason (required)<input required minLength={4} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2.5" placeholder="Explain the adjustment"/></label><button type="submit" disabled={busy || !reason.trim() || !adjustment || Number(adjustment) === 0} className="rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 md:col-span-3">{busy ? 'Saving…' : 'Record adjustment'}</button></form>
      <div><h4 className="mb-2 font-semibold text-[#091F5B]">Recent transactions</h4>{transactions.length === 0 ? <p className="text-sm text-[#5C6982]">No transactions returned.</p> : <div className="space-y-2">{transactions.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF1F6] p-3"><div><p className="text-sm font-medium text-[#091F5B]">{tx.reason || tx.type}</p><p className="text-xs text-[#5C6982]">{new Date(tx.createdAt).toLocaleString()}</p></div><strong className={tx.amount < 0 ? 'text-rose-700' : 'text-emerald-700'}>{tx.amount > 0 ? '+' : ''}{tx.amount} WP</strong></div>)}</div>}</div></>}</section>}
  </div>;
}
