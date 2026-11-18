import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { academicApi, type InstitutionOption } from '../api/academic';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';

type TargetRole = 'student' | 'lecturer';

export function ExternalReviewerTransitionPage() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetIntent = searchParams.get('target');
  const [targetRole, setTargetRole] = useState<TargetRole | null>(() => targetIntent === 'student' || targetIntent === 'lecturer' ? targetIntent : null);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    academicApi.institutions().then(items => { if (active) setInstitutions(Array.isArray(items) ? items : []); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load the institution catalogue.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (!user || user.role !== 'reviewer' || user.academicAccountType !== 'external_reviewer') {
    return <Navigate to={user?.role === 'lecturer' ? '/lecturer/dashboard' : user?.role === 'student' ? '/student/dashboard' : '/moderation'} replace />;
  }

  const submit = async () => {
    if (!targetRole) { setError('Choose whether you want to become a Student or Lecturer.'); return; }
    if (!institutionId || !faculty.trim() || !department.trim()) { setError('Choose your institution and enter your faculty and department.'); return; }
    if (targetRole === 'student' && (!program.trim() || !studyLevel.trim())) { setError('Enter your programme and current academic level.'); return; }
    if (targetRole === 'lecturer' && (!courseName.trim() || !courseCode.trim() || !courseLevel.trim())) { setError('Add at least one course with its course code and academic level.'); return; }
    setSaving(true); setError('');
    try {
      await apiRequest('/users/me/academic-account-transition', {
        method: 'POST',
        body: JSON.stringify({
          targetRole,
          institutionId,
          faculty: faculty.trim(),
          department: department.trim(),
          program: targetRole === 'student' ? program.trim() : undefined,
          studyLevel: targetRole === 'student' ? studyLevel.trim() : undefined,
          coursesTaught: targetRole === 'lecturer' ? [`${courseCode.trim().toUpperCase()} — ${courseName.trim()}`] : undefined,
          teachingAssignments: targetRole === 'lecturer' ? [{ courseName: courseName.trim(), courseCode: courseCode.trim().toUpperCase(), levels: [courseLevel.trim()] }] : undefined,
        }),
      });
      await refreshSession();
      try { window.localStorage.setItem('sophis-central-preferred-workspace', 'academic'); } catch { /* Preference is optional. */ }
      navigate('/workspace', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add the academic workspace. Please try again.');
    } finally { setSaving(false); }
  };

  const field = 'brand-input dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const card = 'min-w-0 rounded-2xl border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#6121D0] sm:p-6';
  if (user.hasReviewerAccess !== true || user.reviewerStatus !== 'approved') {
    return <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#DCE4EF] bg-white p-5 sm:p-8"><h2 className="text-xl font-bold text-[#091F5B]">Additional access is not available yet</h2><p className="mt-2 text-sm leading-6 text-[#52627B]">Your External Reviewer account must first receive Admin approval. Your current reviewer application status is <strong className="capitalize">{user.reviewerStatus?.replace(/_/g, ' ') || 'not applied'}</strong>.</p><button type="button" onClick={() => navigate('/reviewer-application')} className="mt-5 rounded-xl bg-[#6121D0] px-4 py-3 text-sm font-semibold text-white">View reviewer application</button></section>;
  }

  return <div className="mx-auto w-full max-w-4xl space-y-6">
    <section className="rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-5 sm:p-7 dark:border-[#40365A] dark:bg-[#211A34]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6121D0] dark:text-[#C4A7FF]">External Reviewer account</p>
      <h2 className="mt-2 text-2xl font-bold text-[#091F5B] dark:text-white">Become a Student or Lecturer</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627B] dark:text-slate-300">You can add one academic identity to your existing reviewer account. Choose Student or Lecturer—not both. This choice becomes permanent after you submit it; your reviewer access and review history will be retained.</p>
    </section>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button type="button" onClick={() => { setTargetRole('student'); setError(''); }} aria-pressed={targetRole === 'student'} className={`${card} ${targetRole === 'student' ? 'border-[#6121D0] bg-[#F7F4FF] ring-1 ring-[#6121D0]/30 dark:bg-[#211A34]' : 'border-[#DCE4EF] bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
        <span className="inline-flex rounded-xl bg-[#EEF2FF] p-3 text-[#2C36D9] dark:bg-[#26315C] dark:text-[#B8C5FF]"><GraduationCap size={22}/></span>
        <span className="mt-4 block text-lg font-bold text-[#091F5B] dark:text-white">Become a Student</span>
        <span className="mt-2 block text-sm leading-6 text-[#52627B] dark:text-slate-300">Add a Student dashboard and academic learning tools to this same account.</span>
      </button>
      <button type="button" onClick={() => { setTargetRole('lecturer'); setError(''); }} aria-pressed={targetRole === 'lecturer'} className={`${card} ${targetRole === 'lecturer' ? 'border-[#6121D0] bg-[#F7F4FF] ring-1 ring-[#6121D0]/30 dark:bg-[#211A34]' : 'border-[#DCE4EF] bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
        <span className="inline-flex rounded-xl bg-[#F0EBFF] p-3 text-[#6121D0] dark:bg-[#35264F] dark:text-[#D8C6FF]"><Users size={22}/></span>
        <span className="mt-4 block text-lg font-bold text-[#091F5B] dark:text-white">Become a Lecturer</span>
        <span className="mt-2 block text-sm leading-6 text-[#52627B] dark:text-slate-300">Add a Lecturer dashboard and teaching tools to this same account.</span>
      </button>
    </div>

    {targetRole && <section className="space-y-5 rounded-2xl border border-[#DCE4EF] bg-white p-5 sm:p-7 dark:border-slate-700 dark:bg-slate-900">
      <div><h3 className="text-lg font-bold text-[#091F5B] dark:text-white">Complete your {targetRole} academic profile</h3><p className="mt-1 text-sm text-[#52627B] dark:text-slate-300">Your existing account and reviewer credentials will be retained.</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100 sm:col-span-2">Institution<select value={institutionId} onChange={e => setInstitutionId(e.target.value)} className={`${field} mt-2`} disabled={loading}><option value="">{loading ? 'Loading institutions…' : 'Select institution'}</option>{institutions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Faculty / school<input value={faculty} onChange={e => setFaculty(e.target.value)} maxLength={160} className={`${field} mt-2`} placeholder="Faculty or school"/></label>
        <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Department<input value={department} onChange={e => setDepartment(e.target.value)} maxLength={160} className={`${field} mt-2`} placeholder="Department"/></label>
        {targetRole === 'student' ? <>
          <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Programme<input value={program} onChange={e => setProgram(e.target.value)} maxLength={160} className={`${field} mt-2`} placeholder="e.g. Computer Science"/></label>
          <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Current academic level<input value={studyLevel} onChange={e => setStudyLevel(e.target.value)} maxLength={80} className={`${field} mt-2`} placeholder="e.g. 300 level"/></label>
        </> : <>
          <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Course name<input value={courseName} onChange={e => setCourseName(e.target.value)} maxLength={160} className={`${field} mt-2`} placeholder="Course name"/></label>
          <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100">Course code<input value={courseCode} onChange={e => setCourseCode(e.target.value)} maxLength={80} className={`${field} mt-2`} placeholder="Course code"/></label>
          <label className="text-sm font-semibold text-[#091F5B] dark:text-slate-100 sm:col-span-2">Academic level taught<input value={courseLevel} onChange={e => setCourseLevel(e.target.value)} maxLength={80} className={`${field} mt-2`} placeholder="e.g. 200 level"/></label>
        </>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setTargetRole(null)} disabled={saving} className="rounded-xl border border-[#DCE4EF] px-4 py-3 text-sm font-semibold text-[#52627B] dark:border-slate-700 dark:text-slate-300">Choose another option</button><button type="button" onClick={() => void submit()} disabled={saving || loading} className="rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Updating account…' : 'Confirm one-time choice'}</button></div>
    </section>}
    <p className="flex items-start gap-2 text-xs leading-5 text-[#64748B] dark:text-slate-400"><BookOpen size={15} className="mt-0.5 shrink-0"/>This action does not create a second account. Your reviewer workspace remains available alongside the one academic workspace you select.</p>
  </div>;
}
