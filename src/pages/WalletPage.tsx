import { Gift, Send, Star } from 'lucide-react';
import { OverviewCard, SectionTitle } from '../components/layout/AppShell';
import { walletBreakdown } from '../lib/mock-data';

export function WalletPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Rewards" title="Wisdom Points wallet" />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <OverviewCard title="Available balance" action="Live">
          <div className="space-y-5">
            <div className="text-5xl font-semibold text-white">1,420</div>
            <div className="text-sm text-slate-400">Earned from uploads, referrals, and study contributions.</div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 font-medium text-white">
              <Gift size={16} />
              Redeem points
            </button>
          </div>
        </OverviewCard>

        <OverviewCard title="Wallet breakdown" action="This month">
          <div className="space-y-4">
            {walletBreakdown.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-lg font-semibold text-white">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </OverviewCard>
      </div>

      <OverviewCard title="Referral program" action="Invite others">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-white">SOPHISAIM</div>
            <div className="text-sm text-slate-400">Your referral code</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100">
            <Send size={16} />
            Share code
          </button>
        </div>
      </OverviewCard>
    </div>
  );
}
