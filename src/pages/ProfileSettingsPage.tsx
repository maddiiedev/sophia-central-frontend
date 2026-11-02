import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, LogOut } from 'lucide-react';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileImageApi } from '../api/upload';
import { AdminProfilePage } from './AdminProfilePage';
import { apiRequest } from '../lib/api/client';

const normalizeAcademicHandle = (value: string) => value.trim().replace(/^@+/, '').toLowerCase();
const academicHandleError = (value: string) => {
  const handle = normalizeAcademicHandle(value);
  if (handle.length < 3) return 'Username must be at least 3 characters.';
  if (handle.length > 30) return 'Username must be 30 characters or fewer.';
  if (!/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])$/.test(handle)) return 'Start and end with a letter or number; use only lowercase letters, numbers, periods, and underscores.';
  return '';
};

export function ProfileSettingsPage() {
  const { user, completeOnboarding, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ institution: '', faculty: '', department: '', programme: '', studyLevel: '', coursesTaught: '', bio: '', handle: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [savingField, setSavingField] = useState<keyof typeof form | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
      handle: user.academicHandle ?? '',
    });
  }, [user]);

  if (!user) return null;
  if (user.role === 'moderator' || user.role === 'admin') return <AdminProfilePage />;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a supported image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Your profile image must be 5 MB or less.');
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
      const handleError = academicHandleError(form.handle);
      if (handleError) {
        setError(handleError);
        setSaving(false);
        return;
      }
      await completeOnboarding({
        institution: form.institution.trim(),
        faculty: form.faculty.trim(),
        department: form.department.trim(),
        programme: user.role === 'student' ? form.programme.trim() : undefined,
        studyLevel: user.role === 'student' ? form.studyLevel.trim() : undefined,
        coursesTaught: user.role === 'lecturer' ? form.coursesTaught.split(',').map((course) => course.trim()).filter(Boolean) : undefined,
        bio: form.bio.trim(),
        academicHandle: normalizeAcademicHandle(form.handle),
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
    if (key === 'handle') {
      const handleError = academicHandleError(value);
      if (handleError) {
        setError(handleError);
        setSavingField(null);
        return;
      }
    }
    const payload: Record<string, unknown> = key === 'handle'
      ? { academicHandle: normalizeAcademicHandle(value) }
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

  const fieldSaveButton = (key: keyof typeof form) => <button type="button" onClick={() => void saveField(key)} disabled={savingField !== null} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2.5 text-sm font-semibold text-[#6121D0] transition hover:border-[#6121D0] hover:bg-[#F8F5FF] disabled:opacity-50">{savingField === key ? 'Saving…' : <><Save size={14}/> Save</>}</button>;

  const textField = (key: keyof typeof form, label: string, placeholder = '') => <div key={key} className="flex items-end gap-2">
    <label className="block min-w-0 flex-1">
      <span className="mb-2 block text-sm font-semibold text-[#091F5B]">{label}</span>
      <input
        value={form[key]}
        onChange={(event) => update(key, key === 'handle' ? event.target.value.replace(/^@+/, '').toLowerCase() : event.target.value)}
        placeholder={key === 'handle' ? 'username' : placeholder}
        autoCapitalize={key === 'handle' ? 'none' : undefined}
        autoComplete={key === 'handle' ? 'username' : undefined}
        spellCheck={key === 'handle' ? false : undefined}
        minLength={key === 'handle' ? 3 : undefined}
        maxLength={key === 'handle' ? 30 : undefined}
        className="brand-input"
      />
      {key === 'handle' && <span className="mt-1 block text-xs text-[#5C6982]">3–30 characters: lowercase letters, numbers, periods, or underscores. Any leading @ is removed.</span>}
    </label>
    {fieldSaveButton(key)}
  </div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Your profile</h2><p className="mt-2 text-[#4B5563]">Edit each field and save it individually, or save all changes together.</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#2C36D9] text-2xl font-bold text-white shadow-sm">
            {user.profileImage ? <img src={user.profileImage} alt="Profile picture" className="h-full w-full object-cover" /> : (user.firstName?.[0] || user.name?.[0] || 'U').toUpperCase()}
          </div>
          <button type="button" aria-label="Change profile picture" title="Change profile picture" disabled={uploadingPhoto} onClick={() => setPhotoMenuOpen((open) => !open)} className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#6121D0] text-white shadow-md transition hover:bg-[#2C36D9] disabled:cursor-wait disabled:opacity-60">
            {uploadingPhoto ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera size={15} />}
          </button>
          {photoMenuOpen && !uploadingPhoto && <div className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-[#DCE4EF] bg-white py-1 shadow-xl">
            <button type="button" onClick={() => { setPhotoMenuOpen(false); cameraInputRef.current?.click(); }} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#091F5B] hover:bg-[#F8F5FF]">Take photo</button>
            <button type="button" onClick={() => { setPhotoMenuOpen(false); galleryInputRef.current?.click(); }} className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#091F5B] hover:bg-[#F8F5FF]">Choose from gallery</button>
          </div>}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" disabled={uploadingPhoto} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingPhoto} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-[#5C6982]">Account identity</p>
          <p className="mt-1 font-semibold text-[#091F5B]">{user.name}</p>
          <p className="mt-1 text-sm text-[#4B5563]">{user.email}</p>
          <p className="mt-1 text-xs font-semibold capitalize text-[#6121D0]">{user.role} account</p>
          {uploadingPhoto && <p className="mt-2 text-xs text-[#6121D0]" role="status">Uploading profile picture…</p>}
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

<section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4"><span className="rounded-xl bg-rose-50 p-3 text-rose-700"><LogOut size={20}/></span><div className="min-w-0 flex-1"><h3 className="font-bold text-[#091F5B]">Sign out</h3><p className="mt-1 text-sm text-[#4B5563]">Sign out of your Sophis Central account on this device.</p><button type="button" onClick={() => setConfirmSignOut(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"><LogOut size={16}/>Sign out</button></div></div>
      </section>
      {confirmSignOut && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !signingOut) setConfirmSignOut(false); }}><section role="dialog" aria-modal="true" aria-labelledby="signout-title" className="w-full max-w-md rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-2xl"><h3 id="signout-title" className="text-xl font-bold text-[#091F5B]">Sign out?</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">Are you sure you want to sign out of your Sophis Central account?</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={signingOut} onClick={() => setConfirmSignOut(false)} className="rounded-xl border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#091F5B] disabled:opacity-50">Cancel</button><button type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); navigate('/login', { replace: true }); } finally { setSigningOut(false); setConfirmSignOut(false); } }} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{signingOut ? 'Signing out…' : 'Yes, sign out'}</button></div></section></div>}

  </div>;
}
