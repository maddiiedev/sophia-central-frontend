import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { getSavedResourceIds } from '../lib/savedResources';
import { EmptyState } from '../components/states/EmptyState';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

export function SavedResourcesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: () => resourcesApi.list(),
    enabled: Boolean(user),
    staleTime: 60000,
  });

  if (isLoading) return <LoadingState message="Loading saved resources..." />;
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Unable to load saved resources.'} onRetry={() => void refetch()} />;

  const ids = new Set(user ? getSavedResourceIds(user.id) : []);
  const saved = (data ?? []).filter((resource) => ids.has(resource.id) && (resource.moderationStatus === 'approved' || resource.isVerified === true));

  return <div className="space-y-6">
    <section className="rounded-3xl border border-[#DCE4EF] bg-[#F3F0FF] p-6 sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-white p-3 text-[#6121D0]"><Bookmark aria-hidden="true"/></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6121D0]">Student library</p><h2 className="mt-1 text-2xl font-semibold text-[#091F5B]">Saved resources</h2></div></div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#374151]">Keep approved academic and research materials ready for your next study session.</p>
    </section>
    {saved.length === 0 ? <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5"><EmptyState title="No saved resources yet" description="Open an approved resource and select Save to build your personal study list."/></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{saved.map(resource => <Link key={resource.id} to={`/resource/${encodeURIComponent(resource.id)}`} className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm transition hover:border-[#6121D0] hover:bg-[#F8F5FF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6121D0]"><div className="flex items-center justify-between"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold capitalize text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span><BookOpen size={17} className="text-[#6121D0]"/></div><h3 className="mt-4 text-lg font-semibold text-[#091F5B]">{resource.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{resource.description || 'Open this resource to continue studying.'}</p><p className="mt-4 text-xs text-[#5C6982]">{resource.course || 'Academic resource'}{resource.topic ? ` · ${resource.topic}` : ''}</p></Link>)}</div>}
  </div>;
}
