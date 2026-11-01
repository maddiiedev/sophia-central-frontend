import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileImageApi } from '../api/upload';
import { AdminProfilePage } from './AdminProfilePage';
import { apiRequest } from '../lib/api/client';

export function ProfileSettingsPage() {
  const { user, completeOnboarding, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ institution: '', faculty: '', department: '', programme: '', studyLevel: '', coursesTaught: '', bio: '', handle: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingField, setSavingField] = useState<keyof typeof form | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      institution: user.institution ?? '',
      faculty: user.faculty ?? '',
      department: user.department ?? '',
      programme: user.programme ?? '',
      studyLevel: user.studyLevel ?? '',
      coursesTaught: (user.coursesTaught ?? []).join(', '),
      bio: user.bio ?? '',
      handle: user.handle ?? '',
    });
  }, [user]);

  if (!user) return null;
  if (user.role === 'moderator' || user.role === 'admin') return <AdminProfilePage />;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Your profile image must be smaller than 5 MB.');
      return;
    }
    setUploadingPhoto(true);
    setError('');
    setMessage('');
    try {
      await profileImageApi.upload(file);
      await refreshSession();
      setMessage('Profile picture updated successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update your profile picture.');
    } finally {
      setUploadingPhoto(false);
    }
  };
  const save = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      await completeOnboarding({
        institution: form.institution.trim(),
        faculty: form.faculty.trim(),
        department: form.department.trim(),
        programme: user.role === 'student' ? form.programme.trim() : undefined,
        studyLevel: user.role === 'student' ? form.studyLevel.trim() : undefined,
        coursesTaught: user.role === 'lecturer' ? form.coursesTaught.split(',').map((course) => course.trim()).filter(Boolean) : undefined,
        bio: form.bio.trim(),
        socialHandle: form.handle.trim(),
      });
      setMessage('Profile updated successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update profile.');
    } finally { setSaving(false); }
  };

  const saveField = async (key: keyof typeof form) => {
    if (!user) return;
    setSavingField(key); setMessage(''); setError('');
    const value = form[key];
    const payload: Record<string, unknown> = key === 'handle'
      ? { socialHandle: value.trim() }
      : key === 'coursesTaught'
        ? { coursesTaught: value.split(',').map((course) => course.trim()).filter(Boolean) }
        : { [key]: value.trim() };
    try {
      await apiRequest(`/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setMessage(`${key === 'handle' ? 'Academic handle' : key === 'studyLevel' ? 'Study level' : key === 'coursesTaught' ? 'Courses taught' : key.charAt(0).toUpperCase() + key.slice(1)} saved successfully.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this field.');
    } finally { setSavingField(null); }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true); setError('');
    try {
      await apiRequest('/users/me', { method: 'DELETE' });
      await logout().catch(() => undefined);
      navigate('/', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete your account. Please try again.');
      setDeleteConfirmOpen(false);
    } finally { setDeletingAccount(false); }
  };

  const fieldSaveButton = (key: keyof typeof form) => <button type="button" onClick={() => void saveField(key)} disabled={savingField !== null} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm font-semibold text-[#6121D0] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-50">{savingField === key ? 'Saving…' : <><Save size={14}/> Save</>}</button>;

  const textField = (key: keyof typeof form, label: string, placeholder = '') => <div key={key} className="flex items-end gap-2">
    <label className="block min-w-0 flex-1">
      <span className="mb-2 block text-sm font-semibold text-[#091F5B]">{label}</span>
      <input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="brand-input" />
    </label>
    {fieldSaveButton(key)}
  </div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Your profile</h2><p className="mt-2 text-[#4B5563]">Edit each field and save it individually, or save all changes together.</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#2C36D9] text-2xl font-bold text-white shadow-sm">
          {user.profileImage ? <img src={user.profileImage} alt="Profile picture" className="h-full w-full object-cover" /> : (user.firstName?.[0] || user.name?.[0] || 'U').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-[#5C6982]">Account identity</p>
          <p className="mt-1 font-semibold text-[#091F5B]">{user.name}</p>
          <p className="mt-1 text-sm text-[#4B5563]">{user.email}</p>
          <p className="mt-1 text-xs font-semibold capitalize text-[#6121D0]">{user.role} account</p>
          <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#6121D0] hover:border-[#6121D0]">
            {uploadingPhoto ? 'Uploading photo…' : user.profileImage ? 'Change profile picture' : 'Upload profile picture'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingPhoto} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          </label>
          <p className="mt-2 text-xs text-[#5C6982]">JPG, PNG, or WebP · Maximum 5 MB</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {textField('institution', 'Institution', 'Your institution')}
        {textField('faculty', 'Faculty', 'Your faculty')}
        {textField('department', 'Department', 'Your department')}
        {user.role === 'student' && <>{textField('programme', 'Programme', 'Your programme')}{textField('studyLevel', 'Study level', 'e.g. 300 level')}</>}
        {user.role === 'lecturer' && <div className="flex items-end gap-2 sm:col-span-2"><label className="block min-w-0 flex-1"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Courses taught</span><input value={form.coursesTaught} onChange={(event) => update('coursesTaught', event.target.value)} placeholder="Separate course names with commas" className="brand-input" /><span className="mt-1 block text-xs text-[#5C6982]">Use commas between courses, for example: CSC 101, MTH 102.</span></label>{fieldSaveButton('coursesTaught')}</div>}
        {textField('handle', 'Academic handle', '@yourname')}
        <div className="flex items-end gap-2 sm:col-span-2"><label className="block min-w-0 flex-1"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Bio</span><textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} rows={4} className="brand-input" placeholder="Tell your academic community about yourself" /></label>{fieldSaveButton('bio')}</div>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => void save()} disabled={saving || savingField !== null} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50">{saving ? 'Saving…' : 'Save all changes'}</button></div>
    </section>

    <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 sm:p-6"><div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-700"><Trash2 size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-rose-900">Delete account</h3><p className="mt-1 text-sm leading-6 text-rose-800">Permanently remove your account and its associated records, including profile data, uploaded resources, support requests, wallet history and activity. This action cannot be undone.</p><button type="button" onClick={() => setDeleteConfirmOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><Trash2 size={15}/> Delete my account</button></div></div></section>

    {deleteConfirmOpen && <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#091F5B]/60 p-4"><div className="w-full max-w-lg rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-700"><AlertTriangle size={22}/></span><div><h3 id="delete-account-title" className="text-xl font-bold text-[#091F5B]">Are you sure you want to delete your account?</h3><p className="mt-3 text-sm leading-6 text-[#4B5563]">All associated records will be permanently deleted from Sophis Central, including your uploaded resources and activity history. You cannot recover this account after deletion.</p></div></div><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDeleteConfirmOpen(false)} disabled={deletingAccount} className="rounded-xl border border-[#DCE4EF] bg-white px-4 py-2.5 font-semibold text-[#091F5B] disabled:opacity-50">Cancel</button><button type="button" onClick={() => void deleteAccount()} disabled={deletingAccount} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"><Trash2 size={15}/>{deletingAccount ? 'Deleting account…' : 'Yes, permanently delete'}</button></div></div></div>}
  </div>;
}
