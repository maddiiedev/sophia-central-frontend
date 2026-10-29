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

  const textField = (key: keyof typeof form, label: string, placeholder = '') => <label key={key} className="block">
    <span className="mb-2 block text-sm font-semibold text-[#091F5B]">{label}</span>
    <input value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="brand-input" />
  </label>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Account & settings</p><h2 className="mt-2 text-3xl font-bold text-[#091F5B]">Your profile</h2><p className="mt-2 text-[#4B5563]">Edit your academic profile. Changes are saved to your Sophis Central account.</p></div>
    <section className="glass-panel p-5 sm:p-7">
      <div className="mb-6 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
        <p className="text-xs uppercase tracking-wider text-[#5C6982]">Account identity</p>
        <p className="mt-2 font-semibold text-[#091F5B]">{user.name}</p>
        <p className="mt-1 text-sm text-[#4B5563]">{user.email}</p>
        <p className="mt-2 text-xs font-semibold capitalize text-[#6121D0]">{user.role} account</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {textField('institution', 'Institution', 'Your institution')}
        {textField('faculty', 'Faculty', 'Your faculty')}
        {textField('department', 'Department', 'Your department')}
        {user.role === 'student' && <>{textField('programme', 'Programme', 'Your programme')}{textField('studyLevel', 'Study level', 'e.g. 300 level')}</>}
        {user.role === 'lecturer' && <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Courses taught</span><input value={form.coursesTaught} onChange={(event) => update('coursesTaught', event.target.value)} placeholder="Separate course names with commas" className="brand-input" /><span className="mt-1 block text-xs text-[#5C6982]">Use commas between courses, for example: CSC 101, MTH 102.</span></label>}
        {textField('handle', 'Academic handle', '@yourname')}
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-[#091F5B]">Bio</span><textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} rows={4} className="brand-input" placeholder="Tell your academic community about yourself" /></label>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><Link to={user.role === 'lecturer' ? '/lecturer' : user.role === 'moderator' || user.role === 'admin' ? '/moderation' : '/dashboard'} className="rounded-xl border border-[#DCE4EF] bg-white px-5 py-3 font-semibold text-[#091F5B] transition hover:border-[#6121D0] hover:bg-[#F8F5FF]">Back to dashboard</Link><button type="button" onClick={() => void save()} disabled={saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white transition hover:bg-[#2C36D9] disabled:opacity-50">{saving ? 'Saving…' : 'Save profile changes'}</button></div>
    </section>
  </div>;
}
