import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, SunMedium, UserRound, ShieldCheck, AlertTriangle, Trash2, PauseCircle, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api/client';

const SECURITY_QUESTIONS = [
  { id: 'first_school', label: 'What was the name of your first school?' },
  { id: 'childhood_friend', label: 'What was the first name of a childhood friend?' },
  { id: 'first_pet', label: 'What was the name of your first pet?' },
  { id: 'favorite_teacher', label: 'What was the surname of a favourite teacher?' },
  { id: 'birth_city', label: 'In which city were you born?' },
];

const SELF_SERVICE_ROLES = ['student', 'lecturer', 'reviewer'];

type SecurityQuestionStatus = { configured: boolean; questionId: string | null };

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dark = theme === 'dark';
  const [securityStatus, setSecurityStatus] = useState<SecurityQuestionStatus>({ configured: false, questionId: null });
  const [questionId, setQuestionId] = useState(SECURITY_QUESTIONS[0].id);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [currentSecurityAnswer, setCurrentSecurityAnswer] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteAnswer, setDeleteAnswer] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<SecurityQuestionStatus>('/users/me/security-question')
      .then((status) => {
        if (!active) return;
        setSecurityStatus(status);
        if (status.questionId) setQuestionId(status.questionId);
      })
      .catch(() => {
        if (active) setSecurityError('Unable to load your security-question settings. Please refresh and try again.');
      });
    return () => { active = false; };
  }, []);

  const saveSecurityQuestion = async () => {
    setSavingSecurity(true); setSecurityError(''); setSecurityMessage('');
    try {
      await apiRequest('/users/me/security-question', {
        method: 'PATCH',
        body: JSON.stringify({ password: securityPassword, questionId, answer: securityAnswer, ...(securityStatus.configured ? { currentAnswer: currentSecurityAnswer } : {}) }),
      });
      setSecurityStatus({ configured: true, questionId });
      setSecurityAnswer(''); setCurrentSecurityAnswer(''); setSecurityPassword('');
      setSecurityMessage('Your account security question has been saved securely.');
    } catch (cause) {
      setSecurityError(cause instanceof Error ? cause.message : 'Unable to save your security question.');
    } finally { setSavingSecurity(false); }
  };

  const deactivateAccount = async () => {
    setDeactivating(true); setActionError('');
    try {
      await apiRequest('/users/me/deactivate', { method: 'POST', body: JSON.stringify({ password: deactivatePassword }) });
      await logout().catch(() => undefined);
      navigate('/login?account=deactivated', { replace: true });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to deactivate your account.');
    } finally { setDeactivating(false); }
  };

  const requestDeletion = async () => {
    setDeleting(true); setActionError('');
    try {
      await apiRequest('/users/me/deletion-request', {
        method: 'POST',
        body: JSON.stringify({ password: deletePassword, securityAnswer: deleteAnswer }),
      });
      await logout().catch(() => undefined);
      navigate('/login?account=deletion-scheduled', { replace: true });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to schedule account deletion.');
    } finally { setDeleting(false); }
  };

  const eligibleForSelfService = Boolean(user && SELF_SERVICE_ROLES.includes(user.role));
  const selectedQuestion = SECURITY_QUESTIONS.find((item) => item.id === securityStatus.questionId);

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h2 className="text-3xl font-semibold tracking-tight text-[#091F5B]">Settings</h2><p className="mt-2 text-[#4B5563]">Manage your profile, appearance, account security and account status.</p></div>
    <section className="glass-panel space-y-5 p-5 sm:p-7">
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><UserRound size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Profile information</h3><p className="mt-1 text-sm text-[#4B5563]">{user?.role === 'moderator' ? 'Manage your moderator identity and profile picture.' : user?.role === 'admin' ? 'Manage your administrator identity and profile picture.' : `Update the academic details associated with your ${user?.role ?? 'Sophis'} account.`}</p><Link to="/profile" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">{user?.role === 'moderator' ? 'Open moderator profile' : user?.role === 'admin' ? 'Open administrator profile' : 'Edit my profile'}</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#6121D0]">{dark ? <Moon size={20}/> : <SunMedium size={20}/>}</span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Appearance</h3><p className="mt-1 text-sm text-[#4B5563]">Choose the theme that is most comfortable for your study sessions. Light mode remains the default brand presentation.</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full border border-[#DCE4EF] bg-[#F8FAFD] px-3 py-1.5 text-sm font-semibold text-[#091F5B]">Current theme: {dark ? 'Dark' : 'Light'}</span><button type="button" onClick={toggleTheme} aria-pressed={dark} className="inline-flex items-center gap-2 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C36D9] focus:outline-none focus:ring-2 focus:ring-[#2C36D9] focus:ring-offset-2">{dark ? <SunMedium size={16}/> : <Moon size={16}/>} Switch to {dark ? 'light' : 'dark'} mode</button></div></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#004BEC]"><ShieldCheck size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Password security</h3><p className="mt-1 text-sm text-[#4B5563]">Request a secure password reset link if you need to regain access to your account.</p><Link to="/forgot-password" className="mt-3 inline-flex rounded-lg border border-[#004BEC] px-3 py-2 text-sm font-semibold text-[#004BEC] transition hover:bg-[#F3F6FC]">Password recovery</Link></div></div>
      <div className="border-t border-[#E5E7EB]"/>
      <div className="flex items-start gap-4"><span className="rounded-xl bg-[#F3F6FC] p-3 text-[#6121D0]"><KeyRound size={20}/></span><div className="min-w-0 flex-1">
        <h3 className="font-bold text-[#091F5B]">Account security question</h3>
        <p className="mt-1 text-sm leading-6 text-[#4B5563]">Set a security question and answer. Your answer is stored as a salted hash and is required alongside your password when requesting permanent account deletion.</p>
        {securityStatus.configured && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Configured: {selectedQuestion?.label ?? 'A security question is saved'}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#334155]">Security question<select value={questionId} onChange={(event) => setQuestionId(event.target.value)} className="brand-input mt-1 text-sm">{SECURITY_QUESTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          {securityStatus.configured && <label className="text-sm font-medium text-[#334155]">Current security answer<input value={currentSecurityAnswer} onChange={(event) => setCurrentSecurityAnswer(event.target.value)} type="text" autoComplete="off" placeholder="Verify your existing answer" className="brand-input mt-1 text-sm"/></label>}<label className="text-sm font-medium text-[#334155]">New security answer<input value={securityAnswer} onChange={(event) => setSecurityAnswer(event.target.value)} type="text" autoComplete="off" placeholder="Enter a memorable answer" className="brand-input mt-1 text-sm"/></label>
          <label className="text-sm font-medium text-[#334155] sm:col-span-2">Current password<input value={securityPassword} onChange={(event) => setSecurityPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Confirm your current password" className="brand-input mt-1 text-sm"/></label>
        </div>
        {securityError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{securityError}</p>}
        {securityMessage && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{securityMessage}</p>}
        <button type="button" onClick={() => void saveSecurityQuestion()} disabled={savingSecurity || !securityAnswer.trim() || !securityPassword || (securityStatus.configured && !currentSecurityAnswer.trim())} className="mt-4 rounded-xl bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savingSecurity ? 'Saving…' : securityStatus.configured ? 'Update security question' : 'Save security question'}</button>
      </div></div>
    </section>

    {eligibleForSelfService && <section className="space-y-4 rounded-2xl border border-[#DCE4EF] bg-white p-5 sm:p-6">
      <div><h3 className="text-lg font-bold text-[#091F5B]">Account status</h3><p className="mt-1 text-sm leading-6 text-[#4B5563]">You can temporarily deactivate your account or request permanent deletion. These are different actions.</p></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><PauseCircle size={20} className="mt-0.5 text-amber-800"/><div className="flex-1"><h4 className="font-semibold text-amber-950">Deactivate account</h4><p className="mt-1 text-sm leading-6 text-amber-900">Your account will be suspended temporarily, but your data will remain stored. Sign in again with your password when you want to reactivate it. Moderator-imposed suspensions cannot be bypassed this way.</p><button type="button" onClick={() => { setActionError(''); setDeactivateOpen(true); }} className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900">Deactivate my account</button></div></div></div>
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><Trash2 size={20} className="mt-0.5 text-rose-800"/><div className="flex-1"><h4 className="font-semibold text-rose-950">Request permanent deletion</h4><p className="mt-1 text-sm leading-6 text-rose-900">Your account becomes inaccessible immediately. Permanent database cleanup is scheduled after 30 days. You can cancel the request during the grace period using your email, password and security answer. Shared academic records and conversation content may be retained or anonymized where necessary.</p><button type="button" onClick={() => { setActionError(''); setDeleteOpen(true); }} className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-800">Request account deletion</button></div></div></div>
    </section>}

    {deactivateOpen && <div role="dialog" aria-modal="true" aria-labelledby="deactivate-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${dark ? 'border-[#334155] bg-[#111827]' : 'border-[#DCE4EF] bg-white'}`}><h3 id="deactivate-title" className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#091F5B]'}`}>Deactivate your account?</h3><p className={`mt-3 text-sm leading-6 ${dark ? 'text-slate-200' : 'text-[#4B5563]'}`}>Your account will become inaccessible until you sign in again. Your account data will not be deleted.</p><label className={`mt-4 block text-sm font-medium ${dark ? 'text-white' : 'text-[#334155]'}`}>Current password<input value={deactivatePassword} onChange={(event) => setDeactivatePassword(event.target.value)} type="password" autoComplete="current-password" className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-slate-900"/></label>{actionError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeactivateOpen(false)} disabled={deactivating} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" onClick={() => void deactivateAccount()} disabled={deactivating || !deactivatePassword} className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{deactivating ? 'Deactivating…' : 'Confirm deactivation'}</button></div></div></div>}

    {deleteOpen && <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${dark ? 'border-[#334155] bg-[#111827]' : 'border-[#DCE4EF] bg-white'}`}><div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-700"><AlertTriangle size={22}/></span><div><h3 id="delete-account-title" className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#091F5B]'}`}>Schedule permanent deletion?</h3><div className={`mt-3 space-y-2 text-sm leading-6 ${dark ? 'text-slate-200' : 'text-[#4B5563]'}`}><p>Your account will be inaccessible immediately, but it will not be permanently purged until the 30-day grace period ends.</p><p>You can cancel within 30 days by verifying your email, password and security answer. After permanent cleanup, recovery may no longer be possible.</p></div></div></div><div className="mt-4 grid gap-3"><label className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#334155]'}`}>Current password<input value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} type="password" autoComplete="current-password" className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-slate-900"/></label><label className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#334155]'}`}>Security answer<input value={deleteAnswer} onChange={(event) => setDeleteAnswer(event.target.value)} type="text" autoComplete="off" className="mt-1 w-full rounded-xl border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm text-slate-900"/></label></div>{actionError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" onClick={() => void requestDeletion()} disabled={deleting || !deletePassword || !deleteAnswer.trim() || !securityStatus.configured} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Trash2 size={15}/>{deleting ? 'Scheduling…' : 'Confirm 30-day deletion request'}</button></div></div></div>}
  </div>;
}
