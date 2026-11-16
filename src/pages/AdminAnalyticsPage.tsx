import { OverviewCard, SectionTitle } from '../components/layout/AppShell';

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Operations" title="Admin analytics" />
      <OverviewCard title="Platform analytics">
        <p className="text-sm leading-6 text-slate-300">No verified analytics are available to display at this time.</p>
      </OverviewCard>
    </div>
  );
}
