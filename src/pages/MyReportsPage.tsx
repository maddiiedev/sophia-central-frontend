import { useEffect, useState } from 'react';
import { Flag, RefreshCw } from 'lucide-react';
import { reportsApi, type ContentReport } from '../api/reports';
import { SectionTitle } from '../components/layout/AppShell';

const statusLabel: Record<string, string> = { pending: 'Awaiting review', reviewing: 'Under review', actioned: 'Reviewed · action recorded', dismissed: 'Closed · no action taken' };
const reasonLabel = (value: string) => value.replace(/_/g, ' ');

export function MyReportsPage() {
  const [items, setItems] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setItems(await reportsApi.mine()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load your reports.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-5">
    <SectionTitle eyebrow="Community safety" title="My reports"/>
    <p className="text-sm leading-6 text-[#5C6982]">Track reports you have submitted. Moderator notes are shown when available.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <div className="flex justify-end"><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B]"><RefreshCw size={15}/> Refresh</button></div>
    {loading ? <p className="rounded-xl border border-[#DCE4EF] p-5 text-sm text-[#64748B]">Loading reports…</p> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-10 text-center"><Flag className="mx-auto text-[#6121D0]" size={25}/><p className="mt-3 font-semibold text-[#091F5B]">No reports submitted</p><p className="mt-1 text-sm text-[#64748B]">If you encounter an account, resource or message that needs attention, you can report it from that item.</p></div> :
      <div className="space-y-3">{items.map(item => <article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#6121D0]">{item.targetType.replace(/_/g, ' ')}</p><h3 className="mt-1 font-semibold text-[#091F5B]">{item.targetLabel}</h3><p className="mt-1 text-xs capitalize text-[#64748B]">{reasonLabel(item.reason)} · {new Date(item.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6121D0]">{statusLabel[item.status] ?? item.status}</span></div>{item.details && <p className="mt-3 text-sm text-[#475569]">{item.details}</p>}{item.moderatorNote && <p className="mt-3 rounded-xl bg-[#F8FAFD] p-3 text-sm text-[#475569]"><strong>Moderator update:</strong> {item.moderatorNote}</p>}</article>)}</div>}
  </div>;
}
