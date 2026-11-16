import { OverviewCard, SectionTitle } from '../components/layout/AppShell';

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Portfolio" title="Project overview" />
      <OverviewCard title="Projects">
        <p className="text-sm leading-6 text-slate-300">There are no project records to display at this time.</p>
      </OverviewCard>
    </div>
  );
}
