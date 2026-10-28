import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProfileSettingsPage() {
  const { user, completeOnboarding } = useAuth();
  const [form, setForm] = useState({ institution: '', faculty: '', department: '', programme: '', studyLevel: '', coursesTaught: '', bio: '', handle: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
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
    } finally {
      setSaving(false);
    }
  };

  const textField = (key: keyof typeof form, label: string, placeholder = '') => (
    <label key={key} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-violet-400" />
    </label>
  );

  return <div className="mx-auto max-w-4xl space-y-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Account & Settings</p>
      <h2 className="mt-2 text-3xl font-bold text-white">Your profile</h2>
      <p className="mt-2 text-slate-400">Edit your academic profile. Changes are saved to your Sophis Central account.</p>
    </div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">Account identity</p>
        <p className="mt-2 font-semibold text-white">{user.name}</p>
        <p className="mt-1 text-sm text-slate-400">{user.email}</p>
        <p className="mt-2 text-xs capitalize text-violet-300">{user.role} account</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {textField('institution', 'Institution', 'Your institution')}
        {textField('faculty', 'Faculty', 'Your faculty')}
        {textField('department', 'Department', 'Your department')}
        {user.role === 'student' && <>
          {textField('programme', 'Programme', 'Your programme')}
          {textField('studyLevel', 'Study level', 'e.g. 300 level')}
        </>}
        {user.role === 'lecturer' && <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-300">Courses taught</span><input value={form.coursesTaught} onChange={(event) => update('coursesTaught', event.target.value)} placeholder="Separate course names with commas" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-violet-400" /><span className="mt-1 block text-xs text-slate-500">Use commas between courses, for example: CSC 101, MTH 102.</span></label>}
        {textField('handle', 'Academic handle', '@yourname')}
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-300">Bio</span><textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Tell your academic community about yourself" /></label>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><Link to={user.role === 'lecturer' ? '/lecturer' : '/dashboard'} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200">Back to dashboard</Link><button type="button" onClick={() => void save()} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save profile changes'}</button></div>
    </section>
  </div>;
}
