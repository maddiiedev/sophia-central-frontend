import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { reportsApi, type ReportReason, type ReportTargetType } from '../api/reports';

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: 'spam', label: 'Spam or misleading activity' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'inappropriate_content', label: 'Inappropriate or harmful content' },
  { value: 'misinformation', label: 'False or misleading information' },
  { value: 'copyright', label: 'Copyright or ownership concern' },
  { value: 'other', label: 'Something else' },
];

export function ReportContentButton({
  targetType, targetId, label = 'Report', className = '', compact = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate_content');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await reportsApi.create({ targetType, targetId, reason, ...(details.trim() ? { details: details.trim() } : {}) });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your report could not be submitted. Please try again.');
    } finally { setBusy(false); }
  };

  return <>
    <button type="button" onClick={() => { setOpen(true); setSuccess(false); setError(''); }} className={className || (compact ? 'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50' : 'inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#5C6982] hover:border-rose-300 hover:text-rose-700')} aria-label={label}>
      <Flag size={compact ? 12 : 15} /> {label}
    </button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="report-content-title" className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-rose-700">Safety & community standards</p><h2 id="report-content-title" className="mt-1 text-xl font-bold text-[#091F5B]">Report {targetType === 'chat_message' ? 'message' : targetType}</h2></div>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F3F6FC]" aria-label="Close report form"><X size={18}/></button>
        </div>
        {success ? <div className="mt-5 space-y-4"><p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Your report has been submitted to the Sophis Central moderation team. You can follow its status in My reports.</p><button type="button" onClick={() => setOpen(false)} className="w-full rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white">Done</button></div> :
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-[#091F5B]">Why are you reporting this?
              <select value={reason} onChange={event => setReason(event.target.value as ReportReason)} className="mt-2 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-3 text-sm font-normal text-[#1F2937] outline-none focus:border-[#6121D0]">{reasons.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </label>
            <label className="block text-sm font-semibold text-[#091F5B]">Additional details <span className="font-normal text-[#64748B]">(optional)</span>
              <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={2000} rows={4} placeholder="Share context that will help moderators review this report." className="mt-2 w-full resize-y rounded-xl border border-[#DCE4EF] px-3 py-3 text-sm font-normal text-[#1F2937] outline-none focus:border-[#6121D0]"/>
              <span className="mt-1 block text-right text-[11px] text-[#64748B]">{details.length}/2000</span>
            </label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
            <p className="text-xs leading-5 text-[#64748B]">Reports are confidential and reviewed by authorized Sophis Central moderators. False or abusive reporting may result in account restrictions.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#475569]">Cancel</button><button type="submit" disabled={busy} className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Submitting…' : 'Submit report'}</button></div>
          </form>}
      </section>
    </div>}
  </>;
}
