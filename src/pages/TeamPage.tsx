import { OverviewCard, SectionTitle } from '../components/layout/AppShell';

export function TeamPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="People" title="Team directory" />
      <OverviewCard title="Team information">
        <p className="text-sm leading-6 text-slate-300">Team directory information is not available to display here.</p>
      </OverviewCard>
    </div>
  );
}
