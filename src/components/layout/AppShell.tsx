import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  BrainCircuit,
  LayoutGrid,
  ShieldCheck,
  Upload,
  Users,
  WalletCards,
  Menu,
  X,
  UserCircle,
  Settings,
  LifeBuoy,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  MessageCircle,
  Flag,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../brand/BrandLogo';
import { notificationsApi } from '../../api/notifications';
import { usePrivateDmInbox } from '../../context/PrivateDmInboxContext';
import { ProfileImage } from '../ProfileImage';

const studentNav = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutGrid },
  { label: 'Academic Library', href: '/library', icon: BookOpen },
  { label: 'Open Source Library', href: '/open-source-library', icon: BookOpen },
  { label: 'Contribute resource', href: '/upload', icon: Upload },
  { label: 'My resources', href: '/my-resources', icon: Bookmark },
  { label: 'AI Tutor', href: '/ai', icon: BrainCircuit },
  { label: 'Wallet', href: '/wallet', icon: WalletCards },
  { label: 'Group Chat', href: '/chat/group', icon: MessageCircle },
  { label: 'Private DM', href: '/messages', icon: MessageCircle },
  { label: 'My activity', href: '/my-activity', icon: Flag },
];

const lecturerNav = [
  { label: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutGrid },
  { label: 'Academic Library', href: '/library', icon: BookOpen },
  { label: 'Open Source Library', href: '/open-source-library', icon: BookOpen },
  { label: 'My resources', href: '/my-resources', icon: Bookmark },
  { label: 'Upload Resource', href: '/lecturer/upload', icon: Upload },
  { label: 'Private DM', href: '/messages', icon: MessageCircle },
  { label: 'My activity', href: '/my-activity', icon: Flag },
];

const moderatorNav = [
  { label: 'Dashboard', href: '/moderation', icon: LayoutGrid },
  { label: 'Reports & moderation', href: '/moderation/reports', icon: ShieldCheck },
  { label: 'Academic Library', href: '/library', icon: BookOpen },
  { label: 'Open Source Library', href: '/open-source-library', icon: BookOpen },
  { label: 'Saved resources', href: '/my-resources', icon: Bookmark },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Analytics', href: '/moderation/analytics', icon: ChartNoAxesCombined },
  { label: 'Accounts & Wisdom Points', href: '/moderation/management', icon: BriefcaseBusiness },
  { label: 'Wisdom Points Oversight', href: '/moderation/management/wisdom-points', icon: WalletCards },
];


const supportNav = [
  { label: 'Support requests', href: '/support', icon: LifeBuoy },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

const reviewerNav = [
  { label: 'Academic review queue', href: '/reviewer/dashboard', icon: ShieldCheck },
  { label: 'Become a Student or Lecturer', href: '/reviewer-account-transition', icon: LayoutGrid },
  { label: 'Academic Library', href: '/library', icon: BookOpen },
  { label: 'Open Source Library', href: '/open-source-library', icon: BookOpen },
  { label: 'My saved resources', href: '/my-resources', icon: Bookmark },
  { label: 'Notifications', href: '/reviewer/notifications', icon: Bell },
];

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { label: 'Users', href: '/admin', icon: Users },
  { label: 'Reviewer governance', href: '/admin/reviewers?tab=applications', icon: ShieldCheck },
  { label: 'Academic Library', href: '/library', icon: BookOpen },
  { label: 'Open Source Library', href: '/open-source-library', icon: BookOpen },
  { label: 'My resources', href: '/my-resources', icon: Bookmark },
  { label: 'Analytics', href: '/analytics', icon: LayoutGrid },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { inbox: privateDmInbox } = usePrivateDmInbox();
  const privateDmUnreadCount = privateDmInbox.reduce((total, item) => total + (item.unreadCount || 0), 0);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let active = true;
    const refreshUnread = async () => {
      try {
        const result = await notificationsApi.list(100);
        if (!active) return;
        const reviewerWorkspace = user.role === 'reviewer' || location.pathname.startsWith('/reviewer/');
        const reviewerTypes = new Set(['resource_review_assigned', 'reviewer_application_decision']);
        const count = reviewerWorkspace || user.role === 'student'
          ? (result.notifications ?? []).filter(item => !item.isRead && (reviewerWorkspace ? reviewerTypes.has(item.type) : !reviewerTypes.has(item.type))).length
          : result.unreadCount ?? 0;
        setUnreadCount(count);
      } catch { /* Keep navigation usable when notifications are temporarily unavailable. */ }
    };
    void refreshUnread();
    const interval = window.setInterval(() => { void refreshUnread(); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user?.id, user?.role, location.pathname]);


  const academicNav = user?.role === 'lecturer' ? lecturerNav : studentNav;
  const navItems = user?.role === 'reviewer' ? (user.hasReviewerAccess ? [...reviewerNav.filter(item => !(user.isGlobalReviewer && item.href === '/reviewer-account-transition')), ...(user.isGlobalReviewer ? [{ label: 'Reviewer management', href: '/reviewer/governance?tab=applications', icon: Users }] : [])] : ['suspended', 'revoked'].includes(user.reviewerStatus || '') ? [] : [{ label: ['submitted', 'under_review', 'more_information_required'].includes(user.reviewerStatus || '') ? 'View reviewer application' : 'Become an Academic Reviewer', href: '/reviewer-application', icon: ShieldCheck }]) : user?.role === 'moderator' ? moderatorNav : user?.role === 'support' ? supportNav : user?.role === 'admin' ? adminNav : [
    ...academicNav,
    ...(user?.hasReviewerAccess ? [{ label: 'Academic Reviewer workspace', href: '/reviewer/dashboard', icon: ShieldCheck }] : []),
    ...(user?.hasReviewerAccess && location.pathname.startsWith('/reviewer/') ? [{ label: 'Reviewer notifications', href: '/reviewer/notifications', icon: Bell }] : []),
    ...(!user?.hasReviewerAccess && ['not_applied', 'rejected', undefined].includes(user?.reviewerStatus) ? [{ label: 'Become an Academic Reviewer', href: '/reviewer-application', icon: ShieldCheck }] : []),
  ];
  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate(user?.role === 'moderator' ? '/moderation' : user?.role === 'lecturer' ? '/lecturer' : user?.role === 'reviewer' ? (user.hasReviewerAccess ? '/reviewer' : '/reviewer-application') : user?.role === 'support' ? '/support' : user?.role === 'admin' ? '/admin' : '/student');
  };

  const nav = (
    <nav aria-label="Main navigation" className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <NavLink key={label} to={href} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'is-active bg-[#F3F0FF] text-[#6121D0] ring-1 ring-[#6121D0]/20' : 'text-[#1F2937] hover:bg-[#F3F0FF] hover:text-[#6121D0]'}`}>
          <Icon size={17} />
          <span className="min-w-0 flex-1">{label}</span>
          {(href === '/notifications' || href === '/reviewer/notifications') && unreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#6121D0] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          {href === '/messages' && privateDmUnreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#6121D0] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{privateDmUnreadCount > 99 ? '99+' : privateDmUnreadCount}</span>}
        </NavLink>
      ))}
      {[
        ...(user?.role === 'lecturer' ? [{ label: 'Analytics', href: '/lecturer/analytics', icon: ChartNoAxesCombined }] : []),
        { label: 'Profile', href: '/profile', icon: UserCircle },
        { label: 'Settings', href: '/settings', icon: Settings },
        ...(user?.role === 'student' ? [{ label: 'Contact support', href: '/student/support', icon: LifeBuoy }] : []),
        ...(user?.role === 'lecturer' ? [{ label: 'Contact support', href: '/lecturer/support', icon: LifeBuoy }] : []),
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
          <header className={`sticky top-0 ${mobileNavOpen ? "z-[60]" : "z-30"} border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setMobileNavOpen((open) => !open)} className="rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] lg:hidden" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen}>{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button>
                <div className="min-w-0">
                  <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4B5563] sm:block">Sophis Central · {user?.institution || 'Academic workspace'}</p>
                  <h1 className="truncate text-xl font-bold text-[#091F5B] sm:text-2xl">{title}</h1>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {location.pathname !== '/support' && <button type="button" onClick={goBack} className="rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F3F0FF] hover:text-[#6121D0]" aria-label="Go back" title="Go back"><ArrowLeft size={16} /></button>}
                
                {(user?.role === 'student' || user?.role === 'lecturer') && user.hasReviewerAccess === true && <button type="button" onClick={() => navigate('/workspace')} className="inline-flex items-center gap-2 rounded-xl border border-[#D7DEEA] bg-white px-2.5 py-2 text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F3F0FF] hover:text-[#6121D0]" aria-label="Switch workspace" title="Switch workspace"><LayoutGrid size={16}/><span className="hidden text-xs font-semibold sm:inline">Workspace</span></button>}
                <button type="button" onClick={() => navigate(user?.role === 'reviewer' || location.pathname.startsWith('/reviewer/') ? '/reviewer/notifications' : '/notifications')} className="relative rounded-xl border border-[#D7DEEA] bg-white p-2 text-[#091F5B] hover:border-[#6121D0]" aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : 'Open notifications'} title={unreadCount ? `${unreadCount} unread notifications` : 'Open notifications'}><Bell size={16} />{unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6121D0] px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
                <button type="button" onClick={() => navigate('/profile')} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#DCE4EF] bg-[#2C36D9] text-sm font-bold text-white" aria-label="Open your profile" title="Your profile">
                  {user?.profileImage ? <ProfileImage userId={user.id} reference={user.profileImage} className="h-full w-full object-cover" /> : (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                </button>
              </div>
            </div>
          </header>
          {mobileNavOpen && (
            <>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-40 cursor-default bg-slate-950/45 lg:hidden"
              />
              <div
                id="mobile-main-navigation"
                className="fixed inset-x-3 bottom-3 top-[calc(env(safe-area-inset-top)+76px)] z-50 overflow-y-auto overscroll-contain rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-2xl lg:hidden"
              >
                <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <span className="text-sm font-bold text-[#091F5B]">Navigation</span>
                  <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-[#4B5563] hover:bg-[#F3F6FC]" aria-label="Close navigation"><X size={18} /></button>
                </div>
                {nav}
              </div>
            </>
          )}
          <div className="page-shell bg-[#F3F6FC] p-4 sm:p-6 lg:p-7"><div className="route-content mx-auto w-full max-w-[1600px]">{children}</div></div>
        </main>
      </div>
    </div>
  );
}

export function UserBadge() {
  const { user } = useAuth();
  if (!user) return null;
  return <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#2C36D9] text-sm font-semibold text-white">{user.profileImage ? <ProfileImage userId={user.id} reference={user.profileImage} className="h-full w-full object-cover" /> : (user.firstName?.[0] || user.name?.slice(0, 1))}</div><div><div className="text-sm font-semibold text-[#091F5B]">{user.name}</div><div className="text-xs text-[#4B5563]">{user.institution || 'Institution not set'}</div></div></div>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6121D0]">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-[#091F5B]">{title}</h2></div>;
}

export function OverviewCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return <div className="glass-panel p-5"><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-base font-bold text-[#091F5B]">{title}</h3>{action ? <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4B5563]">{action}</span> : null}</div>{children}</div>;
}
