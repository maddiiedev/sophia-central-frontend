import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, SunMedium, UserRound, ShieldCheck, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dark = theme === 'dark';
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Settings</h2><p className="mt-2 text-[#4B5563]">Manage your profile shortcut, appearance, and account security information.</p></div>
    <section className="glass-panel space-y-5 p-5 sm:p-7">
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><UserRound size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Profile information</h3><p className="mt-1 text-sm text-[#4B5563]">Update the academic details associated with your {user?.role ?? 'Sophis'} account.</p><Link to="/profile" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">Edit my profile</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#6121D0]">{dark ? <Moon size={20}/> : <SunMedium size={20}/>}</span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Appearance</h3><p className="mt-1 text-sm text-[#4B5563]">Choose the theme that is most comfortable for your study sessions. Light mode remains the default brand presentation.</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1.5 text-sm font-semibold text-[#091F5B]">Current theme: {dark ? 'Dark' : 'Light'}</span><button type="button" onClick={toggleTheme} aria-pressed={dark} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2">{dark ? <SunMedium size={16}/> : <Moon size={16}/>} Switch to {dark ? 'light' : 'dark'} mode</button></div></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><ShieldCheck size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Account security</h3><p className="mt-1 text-sm text-[#4B5563]">Request a secure password reset link if you need to regain access to your account.</p><Link to="/forgot-password" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">Password recovery</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-rose-50 p-3 text-rose-700"><LogOut size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Sign out</h3><p className="mt-1 text-sm text-[#4B5563]">Sign out of your Sophis Central account on this device.</p><button type="button" onClick={() => setConfirmSignOut(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"><LogOut size={16}/>Sign out</button></div></div>
      {confirmSignOut && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !signingOut) setConfirmSignOut(false); }}><section role="dialog" aria-modal="true" aria-labelledby="signout-title" className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><h3 id="signout-title" className="text-xl font-bold text-[#091F5B]">Sign out?</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">Are you sure you want to sign out of your Sophis Central account?</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={signingOut} onClick={() => setConfirmSignOut(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B] disabled:opacity-50">Cancel</button><button type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); navigate('/login', { replace: true }); } finally { setSigningOut(false); setConfirmSignOut(false); } }} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{signingOut ? 'Signing out…' : 'Yes, sign out'}</button></div></section></div>}
    </section>
  </div>;
}
