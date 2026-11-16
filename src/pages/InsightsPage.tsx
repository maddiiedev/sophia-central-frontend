import { OverviewCard, SectionTitle } from '../components/layout/AppShell';

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Analytics" title="Operational insights" />
      <OverviewCard title="Insights">
        <p className="text-sm leading-6 text-slate-300">There are no verified operational insights to display at this time.</p>
      </OverviewCard>
    </div>
  );
}
