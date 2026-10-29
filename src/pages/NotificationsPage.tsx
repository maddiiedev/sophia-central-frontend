import { Bell, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotificationsPage() {
  return <section className="mx-auto max-w-3xl space-y-6">
    <div className="rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6121D0]"><Bell size={22} aria-hidden="true" /></div>
      <h2 className="mt-5 text-2xl font-semibold text-[#091F5B]">Your notifications</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#4B5563]">Updates about your learning activity will appear here when the notification service is enabled.</p>
      <div className="mt-6 flex gap-3 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-[#6121D0]" aria-hidden="true" />
        <p className="text-sm leading-6 text-[#4B5563]">The notification centre is available, but live notifications and unread counts are not yet connected. No sample alerts are shown as if they were real.</p>
      </div>
      <Link to="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2">Back to dashboard</Link>
    </div>
  </section>;
}
