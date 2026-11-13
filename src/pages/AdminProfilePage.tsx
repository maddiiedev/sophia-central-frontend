import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserRound, Camera, LockKeyhole, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileImageApi } from '../api/upload';
import { ProfileImage } from '../components/ProfileImage';

export function AdminProfilePage() {
  const { user, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Please choose a supported image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Your profile image must be 5 MB or less.'); return; }
    setUploading(true); setError(''); setMessage('');
    try { await profileImageApi.upload(file); await refreshSession(); setMessage(`${roleTitle} profile picture updated successfully.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update your profile picture.'); }
    finally { setUploading(false); }
  };

  const isModerator = user.role === 'moderator';
  const roleTitle = isModerator ? 'Moderator' : 'Administrative';
  const fullName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || (isModerator ? 'Moderator' : 'Administrator');

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">{isModerator ? 'Moderator workspace' : 'Platform administration'}</p><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">{isModerator ? 'Moderator profile' : 'Administrative profile'}</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">{isModerator ? 'Manage your moderator identity and profile picture. Your role supports user safety, reports, Wisdom Points oversight and user support.' : 'Manage your administrative identity and review the access associated with this Sophis Central account.'}</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="flex flex-col gap-5 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#2C36D9] text-3xl font-bold text-white shadow-sm">{user.profileImage ? <ProfileImage userId={user.id} reference={user.profileImage} alt={isModerator ? 'Moderator profile' : 'Administrative profile'} className="h-full w-full object-cover"/> : fullName.slice(0,1).toUpperCase()}</div>
          <button type="button" aria-label="Change profile picture" title="Change profile picture" disabled={uploading} onClick={() => setPhotoMenuOpen(open => !open)} className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#6121D0] text-white shadow-md transition hover:bg-[#2C36D9] disabled:cursor-wait disabled:opacity-60">{uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : <Camera size={15}/>}</button>
          {photoMenuOpen && !uploading && <div className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-[#DCE4EF] bg-white py-1 shadow-xl">
            <button type="button" onClick={() => { setPhotoMenuOpen(false); cameraInputRef.current?.click(); }} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#091F5B] hover:bg-[#F8F5FF]">Take photo</button>
            <button type="button" onClick={() => { setPhotoMenuOpen(false); galleryInputRef.current?.click(); }} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#091F5B] hover:bg-[#F8F5FF]">Choose from gallery</button>
          </div>}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" disabled={uploading} onChange={event => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }}/>
          <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={event => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }}/>
        </div>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-[#5C6982]">Account identity</p><h3 className="mt-1 text-xl font-bold text-[#091F5B]">{fullName}</h3><p className="mt-1 break-all text-sm text-[#4B5563]">{user.email}</p><span className="mt-2 inline-flex rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold capitalize text-[#6121D0]">{user.role} account</span>
          {uploading && <p className="mt-2 text-xs text-[#6121D0]" role="status">Uploading profile picture…</p>}
        </div>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#DCE4EF] p-4"><div className="flex items-center gap-2 text-[#6121D0]"><UserRound size={17}/><h4 className="font-semibold text-[#091F5B]">Personal details</h4></div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-[#71809A]">Full name</dt><dd className="font-medium text-[#091F5B]">{fullName}</dd></div><div><dt className="text-xs text-[#71809A]">Email address</dt><dd className="break-all font-medium text-[#091F5B]">{user.email}</dd></div></dl></div>
        <div className="rounded-xl border border-[#DCE4EF] p-4"><div className="flex items-center gap-2 text-[#6121D0]"><ShieldCheck size={17}/><h4 className="font-semibold text-[#091F5B]">{isModerator ? 'Moderator responsibilities' : 'Administrative access'}</h4></div><p className="mt-3 text-sm leading-6 text-[#4B5563]">{isModerator ? 'This role handles user moderation, user and content reports, Wisdom Points monitoring and adjustments, and student/lecturer support. Platform-wide account permissions remain an administrator responsibility.' : 'This account has privileged platform governance access, including administration of accounts and permissions.'}</p><p className="mt-2 text-xs font-semibold capitalize text-[#6121D0]">Access role: {user.role}</p></div>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#F8FAFD] p-4"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#6121D0]"/><div><p className="text-sm font-semibold text-[#091F5B]">Account security</p><p className="mt-1 text-sm leading-6 text-[#5C6982]">Password and sign-in recovery are managed through the secure account recovery flow in Settings.</p><Link to="/settings" className="mt-2 inline-flex text-sm font-semibold text-[#6121D0] underline">Open account settings</Link></div></div>
    </section>
    {isModerator && <section className="glass-panel p-5 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Your operational workspace</p><h3 className="mt-1 text-xl font-bold text-[#091F5B]">Moderator tools</h3><p className="mt-2 text-sm leading-6 text-[#5C6982]">Open the correct workspace for each responsibility. Academic approval decisions belong to the assigned reviewer workflow; platform governance belongs to Admin.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[{title:'Reports & moderation',description:'Review user and content reports, investigate abuse, and take moderation actions',href:'/moderation'},{title:'User & points management',description:'Find accounts, review activity, suspend or restore users, and inspect Wisdom Points',href:'/moderation/management'},{title:'Wisdom Points oversight',description:'Review balances and transactions, investigate abuse, and make auditable adjustments',href:'/moderation/management/wisdom-points'},{title:'Support requests',description:'Handle student and lecturer tickets and send resolutions',href:'/moderation/support'},{title:'Moderator analytics',description:'Monitor platform activity and moderation trends',href:'/moderation/analytics'},{title:'Platform resource library',description:'View and download lecturer, student and open-source materials across all moderation statuses',href:'/library'}].map(item => <Link key={item.href} to={item.href} className="rounded-xl border border-[#DCE4EF] p-4 transition hover:border-[#6121D0] hover:bg-[#F8F5FF]"><span className="font-semibold text-[#091F5B]">{item.title}</span><span className="mt-1 block text-sm leading-5 text-[#5C6982]">{item.description}</span><span className="mt-3 inline-flex text-xs font-semibold text-[#6121D0]">Open workspace →</span></Link>)}</div></section>}
      <section className="glass-panel mt-6 rounded-2xl border border-[#DCE4EF] p-5 sm:p-7">
        <div className="flex items-start gap-4"><span className="rounded-xl bg-rose-50 p-3 text-rose-700"><LogOut size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Sign out</h3><p className="mt-1 text-sm text-[#4B5563]">Sign out of your Sophis Central account on this device.</p><button type="button" onClick={() => setConfirmSignOut(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"><LogOut size={16}/>Sign out</button></div></div>
      </section>
      {confirmSignOut && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !signingOut) setConfirmSignOut(false); }}><section role="dialog" aria-modal="true" aria-labelledby="signout-title" className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><h3 id="signout-title" className="text-xl font-bold text-[#091F5B]">Sign out?</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">Are you sure you want to sign out of your Sophis Central account?</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={signingOut} onClick={() => setConfirmSignOut(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B] disabled:opacity-50">Cancel</button><button type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); navigate('/login', { replace: true }); } finally { setSigningOut(false); setConfirmSignOut(false); } }} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{signingOut ? 'Signing out…' : 'Yes, sign out'}</button></div></section></div>}
  </div>;
}
