import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { useAuth } from '../context/AuthContext';

export function PublicResourcePage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const resource = useQuery({
    queryKey: ['public-resource', id],
    queryFn: () => resourcesApi.publicById(id),
    enabled: Boolean(id),
  });
  const file = useQuery({
    queryKey: ['public-resource-file', id],
    queryFn: () => resourcesApi.publicFileUrl(id),
    enabled: Boolean(id) && Boolean(resource.data?.hasFile) && Boolean(user && (!['student', 'lecturer', 'reviewer'].includes(user.role) || user.institutionId)),
    retry: false,
  });

  if (resource.isLoading) return <LoadingState message="Loading public resource…" />;
  if (resource.isError || !resource.data) {
    return (
      <ErrorState
        message={resource.error instanceof Error ? resource.error.message : 'This resource is not publicly available.'}
        onRetry={() => void resource.refetch()}
      />
    );
  }

  const item = resource.data;
  const description = typeof item.description === 'string' && item.description.trim()
    ? item.description
    : 'No description supplied.';
  const uploaderValue: unknown = (item as Record<string, unknown>).uploader;
  const uploader = typeof uploaderValue === 'object' && uploaderValue !== null
    ? (uploaderValue as Record<string, unknown>).displayName
    : undefined;
  const contributor = typeof uploader === 'string' && uploader.trim()
    ? uploader
    : 'Community contributor';
  const fileUrlValue: unknown = file.data?.url;
  const fileUrl = typeof fileUrlValue === 'string' && fileUrlValue.trim() ? fileUrlValue : null;

  return (
    <main className="mx-auto max-w-4xl space-y-5">
      <Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6121D0]">
        <ArrowLeft size={16} /> Back to public library
      </Link>
      <article className="overflow-hidden rounded-3xl border border-[#DCE4EF] bg-white">
        <header className="bg-[#F8FAFD] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6121D0]">
            {String(item.type).replace(/_/g, ' ')}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-[#091F5B] sm:text-3xl">{item.title}</h1>
          <p className="mt-3 text-sm text-[#5C6982]">
            {[item.course, item.topic, item.institution, item.level].filter(Boolean).join(' · ')}
          </p>
        </header>
        <div className="space-y-6 p-6 sm:p-8">
          <section>
            <h2 className="font-semibold text-[#091F5B]">About this material</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#374151]">{description}</p>
          </section>
          <section className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
            <h2 className="font-semibold text-[#091F5B]">Reuse and attribution</h2>
            <p className="mt-2 text-sm text-[#4B5563]">Licence: {String(item.license || 'Not specified')}</p>
            <p className="mt-1 text-sm text-[#4B5563]">Attribution: {String(item.attribution || 'Not specified')}</p>
            <p className="mt-1 text-sm text-[#4B5563]">Contributor: {contributor}</p>
            <p className="mt-2 text-xs leading-5 text-[#5C6982]">
              Public access does not automatically grant permission to redistribute or adapt a work. Follow the displayed licence and applicable copyright law.
            </p>
          </section>
          {Boolean(item.hasFile) && (
            <section>
              <h2 className="font-semibold text-[#091F5B]">Attached material</h2>
              {!user ? <p className="mt-2 text-sm text-[#5C6982]">Sign in to your Sophis Central account. File downloads require a permanent Institution ID on student and lecturer accounts. <Link to="/login" className="font-semibold text-[#6121D0] underline">Sign in</Link>. Public resource details remain available without signing in.</p> : ['student', 'lecturer', 'reviewer'].includes(user.role) && !user.institutionId ? <p className="mt-2 text-sm text-[#5C6982]">Select your institution from the approved catalogue in Profile settings to receive your permanent Institution ID before downloading materials.</p> : file.isLoading ? (
                <p className="mt-2 text-sm text-[#5C6982]">Preparing secure file access…</p>
              ) : file.isError ? (
                <p className="mt-2 text-sm text-rose-700">
                  {file.error instanceof Error ? file.error.message : 'Unable to access file.'}
                </p>
              ) : fileUrl !== null ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white"
                >
                  <BookOpen size={16} /> Open material <ExternalLink size={15} />
                </a>
              ) : null}
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
