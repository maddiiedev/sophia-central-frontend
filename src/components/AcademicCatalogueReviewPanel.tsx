import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { academicApi, type AcademicCatalogueSubmission } from '../api/academic';

export function AcademicCatalogueReviewPanel() {
  const [items, setItems] = useState<AcademicCatalogueSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await academicApi.catalogueSubmissions(); setItems(Array.isArray(result) ? result.filter((item) => item.status === 'pending') : []); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load academic catalogue submissions.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id); setError(''); setNotice('');
    try { await academicApi.reviewCatalogueSubmission(id, status); setItems((current) => current.filter((item) => item.id !== id)); setNotice(status === 'approved' ? 'Academic entry approved and added to the shared catalogue.' : 'Academic entry rejected.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to review this entry.'); }
    finally { setBusyId(null); }
  };
  return <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#091F5B]">Academic catalogue submissions</h2><p className="mt-1 text-sm text-[#5C6982]">Approve or reject new universities, faculties and departments.</p></div><button type="button" onClick={() => void load()} disabled={loading || Boolean(busyId)} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B] disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh</button></div>
    {error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {loading ? <p className="py-6 text-sm text-[#5C6982]">Loading submissions…</p> : items.length === 0 ? <p className="rounded-xl bg-[#F8FAFD] p-6 text-center text-sm text-[#5C6982]">No pending academic catalogue submissions.</p> : <div className="space-y-3">{items.map((item) => { const parentFacultyPending = item.entryType === 'department' && Boolean(item.parentFacultySubmissionId) && items.some((parent) => parent.id === item.parentFacultySubmissionId && parent.status === 'pending'); return <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#DCE4EF] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-[#6121D0]">{item.entryType}</span><h3 className="font-semibold text-[#091F5B]">{item.name}</h3><p className="mt-1 text-xs text-[#5C6982]">{[item.state, item.city, item.ownership].filter(Boolean).join(' · ') || 'Parent institution/faculty is linked to this submission'} · {new Date(item.createdAt).toLocaleDateString()}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => void review(item.id, 'approved')} disabled={Boolean(busyId) || parentFacultyPending} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"><CheckCircle2 size={14} className="mr-1 inline"/>Approve</button><button type="button" onClick={() => void review(item.id, 'rejected')} disabled={Boolean(busyId)} className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50"><XCircle size={14} className="mr-1 inline"/>Reject</button>{parentFacultyPending && <p className="mt-2 text-xs text-amber-700">Approve the parent faculty submission before approving this department.</p>}</div></article>; })}</div>}
  </section>;
}