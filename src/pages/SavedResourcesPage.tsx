import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Download, Trash2 } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/states/EmptyState';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

type Section = 'downloaded' | 'saved' | 'submissions';

export function SavedResourcesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isModerationRole = ['reviewer', 'moderator', 'admin'].includes(user?.role ?? '');
  const [section, setSection] = useState<Section>(() => isModerationRole ? 'saved' : 'downloaded');
  const mineQuery = useQuery({ queryKey: ['my-resource-submissions', user?.id], queryFn: () => resourcesApi.mine(), enabled: Boolean(user) && !isModerationRole, staleTime: 0 });
  const savedQuery = useQuery({
    queryKey: ['saved-resources', user?.id],
    queryFn: () => resourcesApi.saved(),
    enabled: Boolean(user),
    staleTime: 0,
  });
  const downloadedQuery = useQuery({
    queryKey: ['downloaded-resources', user?.id],
    queryFn: () => resourcesApi.downloaded(),
    enabled: Boolean(user) && !isModerationRole,
    staleTime: 0,
  });

  if (savedQuery.isLoading || (!isModerationRole && (downloadedQuery.isLoading || mineQuery.isLoading))) return <LoadingState message="Loading your resources..." />;
  if (savedQuery.isError || (!isModerationRole && (downloadedQuery.isError || mineQuery.isError))) {
    const error = savedQuery.error ?? downloadedQuery.error ?? mineQuery.error;
    return <ErrorState message={error instanceof Error ? error.message : 'Unable to load your resources.'} onRetry={() => { void savedQuery.refetch(); if (!isModerationRole) { void downloadedQuery.refetch(); void mineQuery.refetch(); } }} />;
  }

  const activeSection: Section = isModerationRole ? 'saved' : section;
  const resources = activeSection === 'downloaded' ? downloadedQuery.data ?? [] : activeSection === 'saved' ? savedQuery.data ?? [] : mineQuery.data ?? [];
  const unsave = async (id: string) => {
    try {
      await resourcesApi.unsave(id);
      await queryClient.invalidateQueries({ queryKey: ['saved-resources', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['downloaded-resources', user?.id] });
    } catch {
      await queryClient.invalidateQueries({ queryKey: ['saved-resources', user?.id] });
    }
  };

  return <div className="space-y-6">
    <section className="rounded-2xl border border-[#DCE4EF] bg-[#F3F0FF] p-6 sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-white p-3 text-[#6121D0]"><Bookmark aria-hidden="true" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6121D0]">Personal library</p><h2 className="mt-1 text-2xl font-semibold text-[#091F5B]">{isModerationRole ? 'Saved resources' : 'My resources'}</h2></div></div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#374151]">Keep resources you have saved for later separate from resources downloaded in-app to this account.</p>
    </section>
    {isModerationRole && <p className="text-sm text-[#5C6982]">Your saved materials are available here for quick access. Use the Resource library for platform-wide browsing; reviewer accounts can only assess submissions assigned to them.</p>}
    {!isModerationRole && <div className="flex flex-wrap gap-2" role="tablist" aria-label="My resources sections">
      <button type="button" role="tab" aria-selected={section === 'downloaded'} onClick={() => setSection('downloaded')} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${section === 'downloaded' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}><Download size={16}/> Downloaded resources ({downloadedQuery.data?.length ?? 0})</button>
      <button type="button" role="tab" aria-selected={section === 'saved'} onClick={() => setSection('saved')} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${section === 'saved' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}><Bookmark size={16}/> Saved resources ({savedQuery.data?.length ?? 0})</button>
      <button type="button" role="tab" aria-selected={section === 'submissions'} onClick={() => setSection('submissions')} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${section === 'submissions' ? 'border-[#6121D0] bg-[#6121D0] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>My submissions ({mineQuery.data?.length ?? 0})</button>
    </div>}
    {resources.length === 0
      ? <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5"><EmptyState title={activeSection === 'downloaded' ? 'No downloaded resources yet' : activeSection === 'saved' ? 'No saved resources yet' : 'No contributions yet'} description={activeSection === 'downloaded' ? 'Open a resource in the library and choose Download and view to keep it in your account.' : activeSection === 'saved' ? 'Save resources from the library or resource page to keep them here without downloading them.' : 'Your submitted materials and moderation decisions will appear here.'}/></div>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.map(resource => <article key={resource.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold capitalize text-[#6121D0]">{resource.type.replace(/_/g, ' ')}</span>{activeSection === 'submissions' && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{String(resource.moderationStatus || 'pending')}</span>}{section === 'downloaded' ? <Download size={17} className="text-[#6121D0]"/> : <Bookmark size={17} className="text-[#6121D0]"/>}</div>
        <h3 className="mt-4 text-lg font-semibold text-[#091F5B]">{resource.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{resource.description || 'Open this resource to continue studying.'}</p>
        <p className="mt-4 text-xs text-[#5C6982]">{resource.course || 'Academic resource'}{resource.topic ? ` · ${resource.topic}` : ''}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-[#DCE4EF] pt-3">
          <Link to={`/resource/${encodeURIComponent(resource.id)}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#6121D0] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#2C36D9]"><BookOpen size={15}/> Open resource</Link>
          {activeSection === 'saved' && <button type="button" onClick={() => void unsave(resource.id)} aria-label={`Unsave ${resource.title}`} title="Unsave resource" className="inline-flex items-center justify-center rounded-lg border border-[#DCE4EF] p-2.5 text-rose-700 hover:bg-rose-50"><Trash2 size={16}/></button>}
        </div>
      </article>)}</div>}
  </div>;
}
