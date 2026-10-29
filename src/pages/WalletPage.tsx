import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Gift, History, Share2, Star } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api/client';

type ReferralCodeResponse = { code: string; link?: string };
type ReferralStats = { totalGenerated: number; successfulReferrals: number; totalBonusEarned: number; referrals?: Array<{ code: string; status: string; createdAt: string }> };
type PointTransaction = { id: string; type: string; amount: number; reason: string; createdAt: string };

export function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [showRedeemInfo, setShowRedeemInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError('');
    try {
      const [balanceResult, referralResult, statsResult, transactionResult] = await Promise.all([
        apiRequest<number>('/points/my-wallet/balance'),
        apiRequest<ReferralCodeResponse>('/referrals/generate-code', { method: 'POST', body: JSON.stringify({}) }),
        apiRequest<ReferralStats>(`/referrals/${encodeURIComponent(user.id)}/referrals`),
        apiRequest<PointTransaction[]>(`/points/my-wallet/transactions?limit=8`),
      ]);
      setBalance(typeof balanceResult === 'number' ? balanceResult : Number(balanceResult));
      setCode(referralResult.code || '');
      setShareLink(`${window.location.origin}/onboarding?ref=${encodeURIComponent(referralResult.code || '')}`);
      setStats(statsResult);
      setTransactions(Array.isArray(transactionResult) ? transactionResult : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load wallet details. Please try again.');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { void loadWallet(); }, [loadWallet]);

  const shareCode = async () => {
    if (!code) return;
    setSharing(true); setMessage(''); setError('');
    const shareData = { title: 'Join me on Sophis Central', text: `Use my Sophis Central referral code ${code} to join the academic community.`, url: shareLink };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareLink}`);
        setMessage('Referral message and link copied. Share it with your friends.');
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(`${shareData.text}\n${shareLink}`); setMessage('Referral message and link copied. Share it with your friends.'); }
      catch { setError('Sharing is unavailable on this device. You can copy the referral code manually.'); }
    } finally { setSharing(false); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setMessage('Referral code copied.'); setError(''); }
    catch { setMessage(`Your referral code is ${code}. Select and copy it manually.`); }
  };

  const copyInviteLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setMessage('Your personal invite link has been copied.');
      setError('');
    } catch {
      setMessage(`Your invite link is: ${shareLink}`);
      setError('');
    }
  };

  return <div className="space-y-6">
    <SectionTitle eyebrow="Rewards" title="Wisdom Points wallet" />
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <OverviewCard title="Available balance" action="Live balance">
        <div className="space-y-5">
          <div className="text-5xl font-semibold text-[#091F5B]">{loading ? '…' : balance === null ? '—' : balance.toLocaleString()}</div>
          <p className="text-sm leading-6 text-[#4B5563]">Your balance is loaded from your account wallet, not a sample figure.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowRedeemInfo(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2"><Gift size={16}/> Redeem points</button>
            <button type="button" onClick={() => setShowActivity(v => !v)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF]"><History size={16}/>{showActivity ? 'Hide activity' : 'View activity'}</button>
          </div>
          {showActivity && <div className="space-y-2 border-t border-[#DCE4EF] pt-4"><h3 className="font-semibold text-[#091F5B]">Recent wallet activity</h3>{transactions.length === 0 ? <p className="text-sm text-[#5C6982]">No wallet transactions were returned.</p> : transactions.map(tx => <div key={tx.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#F8FAFD] p-3"><div><p className="text-sm font-semibold text-[#091F5B]">{tx.reason}</p><p className="mt-1 text-xs text-[#5C6982]">{new Date(tx.createdAt).toLocaleDateString()} · {tx.type}</p></div><span className={`shrink-0 font-bold ${tx.amount < 0 ? 'text-rose-700' : 'text-emerald-800'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span></div>)}</div>}
        </div>
      </OverviewCard>
      <OverviewCard title="Wallet breakdown" action="Recent activity">
        <div className="space-y-3">{transactions.length === 0 ? <p className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 text-sm text-[#4B5563]">{loading ? 'Loading wallet activity…' : 'Your earned and spent points will appear here.'}</p> : transactions.slice(0, 4).map(tx => <div key={tx.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-[#4B5563]">{tx.reason}</span><span className={`text-lg font-semibold ${tx.amount < 0 ? 'text-rose-700' : 'text-[#091F5B]'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span></div></div>)}</div>
      </OverviewCard>
    </div>

    <OverviewCard title="Referral program" action="Invite your community">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Your personal referral code</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] px-4 py-3 font-mono text-xl font-bold tracking-wider text-[#091F5B]">{loading ? 'Loading…' : code || 'Not available'}</span><button type="button" onClick={() => void copyCode()} disabled={!code} aria-label="Copy referral code" className="rounded-xl border border-[#DCE4EF] bg-white p-3 text-[#6121D0] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-50"><Copy size={17}/></button></div><p className="mt-2 text-sm text-[#4B5563]">{stats ? `${stats.successfulReferrals} successful referrals · ${stats.totalBonusEarned} points earned` : 'Invite friends to join your academic community.'}</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => void copyInviteLink()} disabled={!shareLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:cursor-not-allowed disabled:opacity-50"><Copy size={16}/>Copy invite link</button>
          <button type="button" onClick={() => void shareCode()} disabled={!code || sharing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><Share2 size={17}/>{sharing ? 'Opening share…' : 'Share my code'}</button>
        </div>
      </div>
      {stats && <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><p className="text-xs text-[#5C6982]">Codes generated</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{stats.totalGenerated}</p></div><div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><p className="text-xs text-[#5C6982]">Successful referrals</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{stats.successfulReferrals}</p></div><div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><p className="text-xs text-[#5C6982]">Referral points</p><p className="mt-1 text-2xl font-bold text-[#091F5B]">{stats.totalBonusEarned}</p></div></div>}
    </OverviewCard>

    {showRedeemInfo && <div role="dialog" aria-modal="true" aria-labelledby="redeem-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/50 p-4"><div className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-xl"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#F3F0FF] p-3 text-[#6121D0]"><Gift size={20}/></span><div><h2 id="redeem-title" className="text-xl font-bold text-[#091F5B]">Redeem Wisdom Points</h2><p className="text-sm text-[#5C6982]">Available balance: {balance ?? '—'}</p></div></div><p className="mt-4 text-sm leading-6 text-[#374151]">The points balance and activity are connected, but the reward catalogue and redemption endpoint are not yet enabled. No points have been deducted. This button will become a complete redemption flow when reward options are configured.</p><button type="button" onClick={() => setShowRedeemInfo(false)} className="mt-5 w-full rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white transition hover:bg-[#2C36D9]">Close</button></div></div>}
  </div>;
}
