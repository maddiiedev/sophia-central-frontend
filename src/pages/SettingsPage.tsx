import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, SunMedium, UserRound, ShieldCheck, AlertTriangle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api/client';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dark = theme === 'dark';
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const deleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true); setDeleteError('');
    try {
      await apiRequest('/users/me', { method: 'DELETE' });
      await logout().catch(() => undefined); // Always clear local auth state; the DELETE response clears the browser cookies.
      navigate('/', { replace: true });
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'Unable to delete your account. Please try again.');
    } finally { setDeletingAccount(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Settings</h2><p className="mt-2 text-[#4B5563]">Manage your profile shortcut, appearance, and account security information.</p></div>
    <section className="glass-panel space-y-5 p-5 sm:p-7">
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><UserRound size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Profile information</h3><p className="mt-1 text-sm text-[#4B5563]">Update the academic details associated with your {user?.role ?? 'Sophis'} account.</p><Link to="/profile" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">Edit my profile</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#6121D0]">{dark ? <Moon size={20}/> : <SunMedium size={20}/>}</span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Appearance</h3><p className="mt-1 text-sm text-[#4B5563]">Choose the theme that is most comfortable for your study sessions. Light mode remains the default brand presentation.</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1.5 text-sm font-semibold text-[#091F5B]">Current theme: {dark ? 'Dark' : 'Light'}</span><button type="button" onClick={toggleTheme} aria-pressed={dark} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2">{dark ? <SunMedium size={16}/> : <Moon size={16}/>} Switch to {dark ? 'light' : 'dark'} mode</button></div></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><ShieldCheck size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Account security</h3><p className="mt-1 text-sm text-[#4B5563]">Request a secure password reset link if you need to regain access to your account.</p><Link to="/forgot-password" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">Password recovery</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>

      {user && ['student', 'lecturer'].includes(user.role) && <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 sm:p-6"><div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-700"><Trash2 size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-rose-900">Delete account</h3><p className="mt-1 text-sm leading-6 text-rose-800">Your account and personal records will be permanently deleted. Messages you have shared in conversations may remain available to other participants. You cannot recover this account after deletion.</p><button type="button" onClick={() => setDeleteConfirmOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><Trash2 size={15}/> Delete my account</button></div></div></section>}
    </section>


    {user && ['student', 'lecturer'].includes(user.role) && deleteConfirmOpen && <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${dark ? 'border-[#334155] bg-[#111827]' : 'border-[#DCE4EF] bg-white'}`}><div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-700"><AlertTriangle size={22}/></span><div><h3 id="delete-account-title" className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#091F5B]'}`}>Are you sure you want to delete your account?</h3><div className={`mt-3 space-y-3 text-sm leading-6 ${dark ? 'text-white' : 'text-[#4B5563]'}`}><p>Your account and personal records will be permanently deleted.</p><p>Messages you have shared in conversations may remain available to other participants.</p><p>You cannot recover this account after deletion.</p></div></div></div>{deleteError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{deleteError}</p>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDeleteConfirmOpen(false)} disabled={deletingAccount} className={`rounded-xl border px-4 py-2.5 font-semibold disabled:opacity-50 ${dark ? 'border-[#475569] bg-[#1F2937] text-white' : 'border-[#DCE4EF] bg-white text-[#091F5B]'}`}>Cancel</button><button type="button" onClick={() => void deleteAccount()} disabled={deletingAccount} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"><Trash2 size={15}/>{deletingAccount ? 'Deleting account…' : 'Yes, permanently delete'}</button></div></div></div>}
  </div>;
}
