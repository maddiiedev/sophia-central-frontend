import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  BrainCircuit,
  LayoutGrid,
  LogOut,
  Search,
  ShieldCheck,
  Upload,
  Users,
  WalletCards,
  Menu,
  X,
  UserCircle,
  Settings,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { roleUsers } from '../../lib/mock-data';
import { BrandLogo } from '../brand/BrandLogo';
import { notificationsApi } from '../../api/notifications';

const studentNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Academic & research materials', href: '/library', icon: BookOpen },
  { label: 'Saved resources', href: '/saved', icon: Bookmark },
  { label: 'AI Tutor', href: '/ai', icon: BrainCircuit },
  { label: 'Wallet', href: '/wallet', icon: WalletCards },
];

const lecturerNav = [
  { label: 'Dashboard', href: '/lecturer', icon: LayoutGrid },
  { label: 'Resource library', href: '/library', icon: BookOpen },
  { label: 'Submit resource', href: '/upload', icon: Upload },
];

const moderatorNav = [
  { label: 'Review queue', href: '/moderation', icon: ShieldCheck },
  { label: 'Resource library', href: '/library', icon: BookOpen },
];

const adminNav = [
  { label: 'Dashboard', href: '/analytics', icon: LayoutGrid },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Resource review', href: '/moderation', icon: ShieldCheck },
  { label: 'Resource library', href: '/library', icon: BookOpen },
  { label: 'Analytics', href: '/analytics', icon: LayoutGrid },
];

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let active = true;
    const refreshUnread = async () => {
      try { const result = await notificationsApi.list(1); if (active) setUnreadCount(result.unreadCount ?? 0); }
      catch { /* Keep navigation usable when notifications are temporarily unavailable. */ }
    };
    void refreshUnread();
    const interval = window.setInterval(() => { void refreshUnread(); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user?.id]);

  const navItems = user?.role === 'lecturer' ? lecturerNav : user?.role === 'moderator' ? moderatorNav : user?.role === 'admin' ? adminNav : studentNav;
  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate(user?.role === 'lecturer' ? '/lecturer' : user?.role === 'moderator' || user?.role === 'admin' ? '/moderation' : '/dashboard');
  };

  const nav = (
    <nav aria-label="Main navigation" className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <NavLink key={label} to={href} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'is-active bg-[#F3F0FF] text-[#6121D0] ring-1 ring-[#6121D0]/20' : 'text-[#1F2937] hover:bg-[#F3F0FF] hover:text-[#6121D0]'}`}>
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
      {[
        { label: 'Profile', href: '/profile', icon: UserCircle },
        { label: 'Settings', href: '/settings', icon: Settings },
      ].map(({ label, href, icon: Icon }) => (
        <NavLink key={label} to={href} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'is-active bg-[#F3F0FF] text-[#6121D0] ring-1 ring-[#6121D0]/20' : 'text-[#1F2937] hover:bg-[#F3F0FF] hover:text-[#6121D0]'}`}>
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="app-shell min-h-screen bg-white text-[#1F2937]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[#E5E7EB] bg-white p-5 lg:flex">
          <div className="mb-8"><BrandLogo variant="full" linked={false} tone="dark" /></div>
          {nav}
          <div className="mt-auto rounded-2xl border border-[#E5E7EB] bg-[#F3F6FC] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#091F5B]">Your institution</p>
            <p className="text-sm font-medium text-[#1F2937]">{user?.institution || 'Institution not set'}</p>
            <p className="mt-1 text-xs text-[#4B5563]">Resources are organized around your academic community.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-white">
          <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setMobileNavOpen((open) => !open)} className="rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] lg:hidden" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen}>{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button>
                <div className="min-w-0">
                  <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4B5563] sm:block">Sophis Central · {user?.institution || 'Academic workspace'}</p>
                  <h1 className="truncate text-xl font-bold text-[#091F5B] sm:text-2xl">{title}</h1>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={goBack} className="rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F3F0FF] hover:text-[#6121D0]" aria-label="Go back" title="Go back"><ArrowLeft size={16} /></button>
                
                <button type="button" onClick={() => navigate('/library')} className="flex items-center gap-2 rounded-xl border border-[#D7DEEA] bg-white px-3 py-2 text-sm font-medium text-[#091F5B] hover:border-[#6121D0]" aria-label="Search academic resources"><Search size={15} /><span className="hidden sm:inline">Search resources</span></button>
                <button type="button" onClick={() => navigate('/notifications')} className="relative rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] hover:border-[#6121D0]" aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : 'Open notifications'} title={unreadCount ? `${unreadCount} unread notifications` : 'Open notifications'}><Bell size={16} />{unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6121D0] px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
                <button type="button" onClick={() => navigate('/profile')} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#DCE4EF] bg-[#2C36D9] text-sm font-bold text-white" aria-label="Open your profile" title="Your profile">
                  {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                </button>
                <button type="button" onClick={() => void logout()} className="rounded-xl border border-[#D7DEEA] bg-white p-2 text-sm font-semibold text-[#091F5B] hover:border-[#6121D0] sm:px-3 sm:py-2"><LogOut size={15} className="sm:mr-2 sm:inline" /><span className="hidden sm:inline">Sign out</span></button>
              </div>
            </div>
            {mobileNavOpen && <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm lg:hidden">{nav}</div>}
          </header>
          <div className="page-shell bg-white p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function UserBadge() {
  const { user } = useAuth();
  const current = user ?? roleUsers.student;
  return <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#2C36D9] text-sm font-semibold text-white">{current.profileImage ? <img src={current.profileImage} alt="" className="h-full w-full object-cover" /> : (current.firstName?.[0] || current.name?.slice(0, 1))}</div><div><div className="text-sm font-semibold text-[#091F5B]">{current.name}</div><div className="text-xs text-[#4B5563]">{current.institution || 'Institution not set'}</div></div></div>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6121D0]">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">{title}</h2></div>;
}

export function OverviewCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return <div className="glass-panel p-5"><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-base font-bold text-[#091F5B]">{title}</h3>{action ? <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4B5563]">{action}</span> : null}</div>{children}</div>;
}
