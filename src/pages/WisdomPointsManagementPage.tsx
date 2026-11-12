import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, RefreshCw, Search, WalletCards } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api/client';
import { SectionTitle } from '../components/layout/AppShell';

type ManagedUser = { id: string; firstName?: string; lastName?: string; name?: string; email: string; academicHandle?: string; role: string; institution?: string; isSuspended?: boolean };
type Transaction = { id: string; amount: number; reason?: string; type: string; createdAt: string };

export function WisdomPointsManagementPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingUsers(true); setError('');
      try {
        const data = await apiRequest<ManagedUser[]>('/users/management');
        if (active) setUsers(Array.isArray(data) ? data.filter((account) => account.role === 'student') : []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load student accounts.');
      } finally { if (active) setLoadingUsers(false); }
    };
    void load();
    return () => { active = false; };
  }, []);

  const selected = users.find((account) => account.id === userId) ?? null;
  const filtered = useMemo(() => users.filter((account) => [
    account.firstName, account.lastName, account.name, account.academicHandle, account.email,
  ].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase())), [users, query]);

  const loadWallet = async (account: ManagedUser) => {
    setLoadingWallet(true); setError(''); setNotice('');
    try {
      const [nextBalance, nextTransactions] = await Promise.all([
        apiRequest<number>(`/points/${encodeURIComponent(account.id)}/balance`),
        apiRequest<Transaction[]>(`/points/${encodeURIComponent(account.id)}/transactions?limit=20`),
      ]);
      setBalance(Number(nextBalance));
      setTransactions(Array.isArray(nextTransactions) ? nextTransactions : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load wallet activity.');
      setBalance(null); setTransactions([]);
    } finally { setLoadingWallet(false); }
  };

  useEffect(() => {
    if (!userId || loadingUsers) { setBalance(null); setTransactions([]); return; }
    if (!selected) { setError('The selected student account could not be found. Return to search and choose an account.'); return; }
    void loadWallet(selected);
  }, [userId, loadingUsers, selected?.id]);

  const adjustPoints = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !reason.trim() || !Number.isInteger(Number(adjustment)) || Number(adjustment) === 0) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest('/points/adjust', { method: 'POST', body: JSON.stringify({ userId: selected.id, amount: Number(adjustment), reason: reason.trim() }) });
      await loadWallet(selected);
      setNotice('Wisdom Points adjustment recorded.');
      setAdjustment(''); setReason('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to adjust Wisdom Points.');
    } finally { setBusy(false); }
  };

  const accountName = selected ? `${selected.firstName || selected.name || 'User'} ${selected.lastName || ''}`.trim() : '';

  return <div className="space-y-6">
    <SectionTitle eyebrow="Moderator tools" title={userId ? 'Account Wallet Review' : 'Manage Wisdom Points'} />
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {!userId ? <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold text-[#091F5B]">Find a student account</h3><p className="mt-1 text-sm text-[#5C6982]">Search by account name, username or email, then open the account wallet review.</p></div>
      <label className="flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-3"><Search size={18} className="shrink-0 text-[#5C6982]"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter account name, @username or email" className="w-full text-sm outline-none" aria-label="Search account name, username or email"/></label>
      {loadingUsers ? <p className="p-5 text-sm text-[#5C6982]">Loading student accounts…</p> : <div className="divide-y divide-[#EEF1F6]">{filtered.map((account) => (<button key={account.id} type="button" onClick={() => navigate(`/moderation/management/wisdom-points/${encodeURIComponent(account.id)}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-4 text-left transition hover:bg-[#F8FAFD]"><span className="min-w-0"><span className="block truncate font-semibold text-[#091F5B]">{account.firstName || account.name || 'User'} {account.lastName || ''}</span><span className="mt-1 block truncate text-xs text-[#5C6982]">{account.email}</span>{account.academicHandle && <span className="mt-1 block text-xs text-[#6121D0]">@{account.academicHandle.replace(/^@+/, '')}</span>}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#6121D0]"><WalletCards size={14}/> Review wallet</span></button>))}
        {filtered.length === 0 && <p className="p-5 text-sm text-[#5C6982]">{query.trim() ? 'No matching student accounts.' : 'No student accounts are available.'}</p>}
      </div>}
    </section> : <div className="space-y-4">
      <button type="button" onClick={() => navigate('/moderation/management/wisdom-points')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]"><ArrowLeft size={16}/> Back to account search</button>
      {!selected && !loadingUsers ? <p className="rounded-xl border border-[#DCE4EF] bg-white p-5 text-sm text-[#5C6982]">Account not found in the student account list.</p> : selected && <>
        <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#5C6982]">Selected account</p><h3 className="mt-1 text-lg font-bold text-[#091F5B]">{accountName}</h3><p className="mt-1 text-sm text-[#5C6982]">{selected.email}</p>{selected.academicHandle && <p className="mt-1 text-sm text-[#6121D0]">@{selected.academicHandle.replace(/^@+/, '')}</p>}</div><button type="button" disabled={loadingWallet} onClick={() => void loadWallet(selected)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B] disabled:opacity-50"><RefreshCw size={15}/> Refresh wallet</button></div>
          <div className="rounded-xl bg-[#F8FAFD] p-4"><p className="text-xs text-[#5C6982]">Current balance</p><p className="text-3xl font-bold text-[#6121D0]">{loadingWallet ? 'Loading…' : balance === null ? '—' : `${balance.toLocaleString()} WP`}</p></div>
          <form onSubmit={adjustPoints} className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium text-[#091F5B]">Adjustment (+/- points)<input type="number" step="1" required value={adjustment} onChange={(event) => setAdjustment(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2.5" placeholder="e.g. 10 or -5"/></label><label className="text-sm font-medium text-[#091F5B] md:col-span-2">Reason (required)<input required minLength={4} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE4EF] px-3 py-2.5" placeholder="Explain the adjustment"/></label><button type="submit" disabled={busy || loadingWallet || !reason.trim() || !adjustment || Number(adjustment) === 0} className="rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 md:col-span-3">{busy ? 'Saving…' : 'Record adjustment'}</button></form>
        </section>
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5"><h4 className="mb-3 font-semibold text-[#091F5B]">Recent transactions</h4>{loadingWallet ? <p className="text-sm text-[#5C6982]">Loading wallet activity…</p> : transactions.length === 0 ? <p className="text-sm text-[#5C6982]">No transactions returned.</p> : <div className="space-y-2">{transactions.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF1F6] p-3"><div><p className="text-sm font-medium text-[#091F5B]">{tx.reason || tx.type}</p><p className="text-xs text-[#5C6982]">{new Date(tx.createdAt).toLocaleString()}</p></div><strong className={tx.amount < 0 ? 'text-rose-700' : 'text-emerald-700'}>{tx.amount > 0 ? '+' : ''}{tx.amount} WP</strong></div>)}</div>}</section>
      </>}
    </div>}
  </div>;
}
