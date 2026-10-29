import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi, type AppNotification } from '../api/notifications';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError('');
      const result = await notificationsApi.list(50);
      setItems(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load notifications.');
    } finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { void load(true); }, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const markRead = async (item: AppNotification) => {
    if (item.isRead) { if (item.link) navigate(item.link); return; }
    setBusy(true);
    try {
      await notificationsApi.markRead(item.id);
      setItems(current => current.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      setUnreadCount(current => Math.max(0, current - 1));
      if (item.link) navigate(item.link);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to mark notification as read.');
    } finally { setBusy(false); }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await notificationsApi.markAllRead();
      setItems(current => current.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to mark notifications as read.');
    } finally { setBusy(false); }
  };

  return <section className="mx-auto max-w-4xl space-y-6">
    <div className="rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6121D0]"><Bell size={22} aria-hidden="true" /></div><h2 className="mt-5 text-2xl font-semibold text-[#091F5B]">Your notifications</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}. Updates refresh automatically.</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF]"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button><button type="button" onClick={() => void markAllRead()} disabled={busy || unreadCount === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50"><CheckCheck size={15}/> Mark all read</button></div></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 space-y-3">
        {loading ? <p className="rounded-xl bg-[#F8FAFD] p-5 text-sm text-[#4B5563]">Loading your notifications…</p> : items.length === 0 ? <div className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-8 text-center"><Bell size={24} className="mx-auto text-[#6121D0]"/><p className="mt-3 font-semibold text-[#091F5B]">You’re all caught up</p><p className="mt-1 text-sm text-[#4B5563]">New account and resource updates will appear here.</p></div> : items.map(item => <button key={item.id} type="button" onClick={() => void markRead(item)} disabled={busy} className={`block w-full rounded-xl border p-4 text-left transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-60 ${item.isRead ? 'border-[#DCE4EF] bg-white' : 'border-[#C4B5FD] bg-[#F8F5FF]'}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? 'bg-[#CBD5E1]' : 'bg-[#6121D0]'}`} aria-label={item.isRead ? 'Read' : 'Unread'}/><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-[#091F5B]">{item.title}</span><span className="text-xs text-[#5C6982]">{new Date(item.createdAt).toLocaleString()}</span></span><span className="mt-1 block whitespace-pre-wrap text-sm leading-6 text-[#4B5563]">{item.message}</span>{item.link && <span className="mt-2 block text-xs font-semibold text-[#6121D0]">Open related page →</span>}</span></div></button>)}
      </div>
      <Link to="/dashboard" className="mt-6 inline-flex rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 text-sm font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF]">Back to dashboard</Link>
    </div>
  </section>;
}
