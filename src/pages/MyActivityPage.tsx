import { useEffect, useState } from 'react';
import { Flag, RefreshCw } from 'lucide-react';
import { reportsApi, type ContentReport } from '../api/reports';
import { supportApi, type SupportRequest } from '../api/support';
import { SectionTitle } from '../components/layout/AppShell';

type ActivityTab = 'all' | 'reports' | 'support';
const reportStatus: Record<string, string> = { pending: 'Awaiting review', reviewing: 'Under review', actioned: 'Reviewed · action recorded', dismissed: 'Closed · no action taken' };
const supportStatus = (item: SupportRequest) => item.escalatedToRole && !['reviewed','response_sent','concluded'].includes(item.status) ? `Under ${item.escalatedToRole === 'moderator' ? 'Moderator' : 'Admin'} review` : ({ pending: 'Submitted', under_review: 'Under Support review', reviewed: 'Reviewed', response_sent: 'Response sent', concluded: 'Response sent' }[item.status] || label(item.status));
const label = (value: string) => value.replace(/_/g, ' ');

export function MyActivityPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [tab, setTab] = useState<ActivityTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [reportItems, supportItems] = await Promise.all([reportsApi.mine(), supportApi.mineActivity()]);
      setReports(reportItems); setRequests(supportItems);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load your activity.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const total = reports.length + requests.length;
  const showReports = tab !== 'support';
  const showSupport = tab !== 'reports';

  return <div className="space-y-5">
    <SectionTitle eyebrow="Your account" title="My activity"/>
    <p className="text-sm leading-6 text-[#5C6982]">A private record of the reports you submit and the responses sent to your Support requests. Notifications provide brief alerts and bring you here for the full update.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Activity type">
        {([{value:'all',label:'All activity'},{value:'reports',label:`Reports (${reports.length})`},{value:'support',label:`Support (${requests.length})`}] as const).map(item => <button key={item.value} type="button" role="tab" aria-selected={tab===item.value} onClick={()=>setTab(item.value)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab===item.value?'border-[#6121D0] bg-[#6121D0] text-white':'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>{item.label}</button>)}
      </div>
      <button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#091F5B]"><RefreshCw size={15} className={loading?'animate-spin':''}/> Refresh</button>
    </div>
    {loading ? <p className="rounded-xl border border-[#DCE4EF] p-5 text-sm text-[#64748B]">Loading your activity…</p> : total===0 ? <div className="rounded-2xl border border-dashed border-[#DCE4EF] p-10 text-center"><Flag className="mx-auto text-[#6121D0]" size={25}/><p className="mt-3 font-semibold text-[#091F5B]">No activity yet</p><p className="mt-1 text-sm text-[#64748B]">Reports you submit and Support responses will appear here.</p></div> : <div className="space-y-6">
      {showReports && reports.length>0 && <section className="space-y-3"><h3 className="font-bold text-[#091F5B]">Reports</h3>{reports.map(item=><article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#6121D0]">{label(item.targetType)} report</p><h4 className="mt-1 font-semibold text-[#091F5B]">{item.targetLabel}</h4><p className="mt-1 text-xs capitalize text-[#64748B]">{label(item.reason)} · {new Date(item.createdAt).toLocaleString()}</p><p className="mt-1 text-xs font-medium text-[#64748B]">Ticket: {item.ticketNumber || item.id}</p></div><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6121D0]">{reportStatus[item.status]||label(item.status)}</span></div>{item.details&&<p className="mt-3 text-sm text-[#475569]">{item.details}</p>}{item.targetSnapshot&&<div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFD] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Reported item details</p><dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">{Object.entries(item.targetSnapshot).filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([key,value])=><div key={key} className="min-w-0"><dt className="inline font-semibold capitalize text-[#091F5B]">{key.replace(/([A-Z])/g,' $1').replace(/_/g,' ')}: </dt><dd className="inline break-words text-[#475569]">{typeof value==='object'?JSON.stringify(value):String(value)}</dd></div>)}</dl></div>}{item.moderatorNote&&<div className="mt-3 rounded-xl bg-[#F8FAFD] p-3 text-sm leading-6 text-[#475569]"><strong>Moderator response:</strong> {item.moderatorNote}</div>}</article>)}</section>}
      {showSupport && requests.length>0 && <section className="space-y-3"><h3 className="font-bold text-[#091F5B]">Support responses</h3>{requests.map(item=><article key={item.id} className="rounded-2xl border border-[#DCE4EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#6121D0]">Support request · {label(item.category)}</p><h4 className="mt-1 font-semibold text-[#091F5B]">{item.subject}</h4><p className="mt-1 text-xs text-[#64748B]">Submitted {new Date(item.createdAt).toLocaleString()}</p><p className="mt-1 text-xs font-medium text-[#64748B]">Ticket: {item.ticketNumber || item.id}</p></div><span className="rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold text-[#6121D0]">{supportStatus(item)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">{item.description}</p>{item.links?.length>0&&<div className="mt-3 space-y-1 text-xs"><p className="font-semibold text-[#091F5B]">Links supplied</p>{item.links.map((link,index)=><a key={link} href={link} target="_blank" rel="noreferrer" className="block break-all text-[#6121D0] underline">Link {index+1}: {link}</a>)}</div>}{item.attachments?.length>0&&<div className="mt-3 flex flex-wrap gap-2">{item.attachments.map((attachment,index)=><a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="rounded-lg border border-[#DCE4EF] px-3 py-2 text-xs font-semibold text-[#6121D0]">View attachment {index+1}</a>)}</div>}{item.resolutionMessage&&<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">Response from Sophis Central Support</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{item.resolutionMessage}</p>{item.concludedAt&&<p className="mt-2 text-xs text-emerald-800">Response sent {new Date(item.concludedAt).toLocaleString()}</p>}</div>}</article>)}</section>}
      {tab==='reports'&&reports.length===0&&<p className="rounded-xl bg-[#F8FAFD] p-5 text-sm text-[#64748B]">You have not submitted any reports.</p>}
      {tab==='support'&&requests.length===0&&<p className="rounded-xl bg-[#F8FAFD] p-5 text-sm text-[#64748B]">You have not sent any Support requests.</p>}
    </div>}
  </div>;
}
