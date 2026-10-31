import { useState } from 'react';
import { ShieldCheck, UserRound, Camera, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileImageApi } from '../api/upload';

export function AdminProfilePage() {
  const { user, refreshSession } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Your profile image must be smaller than 5 MB.'); return; }
    setUploading(true); setError(''); setMessage('');
    try { await profileImageApi.upload(file); await refreshSession(); setMessage('Administrative profile picture updated successfully.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update your profile picture.'); }
    finally { setUploading(false); }
  };

  const fullName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Administrator';

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Administration</p><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Administrative profile</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">Manage your administrative identity and review the access associated with this Sophis Central account.</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="flex flex-col gap-5 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#2C36D9] text-3xl font-bold text-white shadow-sm">{user.profileImage ? <img src={user.profileImage} alt="Administrative profile" className="h-full w-full object-cover"/> : fullName.slice(0,1).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-[#5C6982]">Account identity</p><h3 className="mt-1 text-xl font-bold text-[#091F5B]">{fullName}</h3><p className="mt-1 break-all text-sm text-[#4B5563]">{user.email}</p><span className="mt-2 inline-flex rounded-full bg-[#F3F0FF] px-3 py-1 text-xs font-semibold capitalize text-[#6121D0]">{user.role} account</span>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#6121D0] hover:border-[#6121D0]"><Camera size={15}/>{uploading ? 'Uploading photo…' : user.profileImage ? 'Change profile picture' : 'Upload profile picture'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={event => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }}/></label><p className="mt-2 text-xs text-[#5C6982]">JPG, PNG or WebP · Maximum 5 MB</p>
        </div>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#DCE4EF] p-4"><div className="flex items-center gap-2 text-[#6121D0]"><UserRound size={17}/><h4 className="font-semibold text-[#091F5B]">Personal details</h4></div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-[#71809A]">Full name</dt><dd className="font-medium text-[#091F5B]">{fullName}</dd></div><div><dt className="text-xs text-[#71809A]">Email address</dt><dd className="break-all font-medium text-[#091F5B]">{user.email}</dd></div></dl></div>
        <div className="rounded-xl border border-[#DCE4EF] p-4"><div className="flex items-center gap-2 text-[#6121D0]"><ShieldCheck size={17}/><h4 className="font-semibold text-[#091F5B]">Administrative access</h4></div><p className="mt-3 text-sm leading-6 text-[#4B5563]">This account can access the moderation workspace and review platform activity according to its assigned role.</p><p className="mt-2 text-xs font-semibold capitalize text-[#6121D0]">Access role: {user.role}</p></div>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#F8FAFD] p-4"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#6121D0]"/><div><p className="text-sm font-semibold text-[#091F5B]">Account security</p><p className="mt-1 text-sm leading-6 text-[#5C6982]">Password and sign-in recovery are managed through the secure account recovery flow in Settings.</p></div></div>
    </section>
  </div>;
}
