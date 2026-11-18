import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Application = {
  id: string;
  status: string;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  qualifications?: string[];
  expertiseAreas?: string[];
  institution?: string | null;
  faculty?: string | null;
  department?: string | null;
  academicLevels?: string[];
  reviewExperience?: string;
  supportingDocuments?: string[];
  conflictDeclaration?: string;
};

const splitLines = (value: string) => value.split(/[\n,;]/).map(item => item.trim()).filter(Boolean);

export function ReviewerApplicationPage() {
  const { user, refreshSession } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [expertiseAreas, setExpertiseAreas] = useState('');
  const [academicLevels, setAcademicLevels] = useState('');
  const [reviewExperience, setReviewExperience] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState('');
  const [conflictDeclaration, setConflictDeclaration] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const recruitmentOpen = import.meta.env.VITE_REVIEWER_RECRUITMENT_OPEN === 'true';
  const testAccountEmail = (import.meta.env.VITE_REVIEWER_TEST_ACCOUNT_EMAIL || '').trim().toLowerCase();
  const testAccountAllowed = Boolean(testAccountEmail && user?.email?.trim().toLowerCase() === testAccountEmail);

  useEffect(() => {
    let active = true;
    apiRequest<Application[]>('/reviewer-applications/me')
      .then(items => {
        if (!active || !items.length) return;
        const latest = items[0];
        setApplication(latest);
        if (['rejected', 'more_information_required'].includes(latest.status)) {
          setQualifications((latest.qualifications ?? []).join('\n'));
          setExpertiseAreas((latest.expertiseAreas ?? []).join('\n'));
          setInstitution(latest.institution ?? user?.institution ?? '');
          setFaculty(latest.faculty ?? user?.faculty ?? '');
          setDepartment(latest.department ?? user?.department ?? '');
          setAcademicLevels((latest.academicLevels ?? []).join('\n'));
          setReviewExperience(latest.reviewExperience ?? '');
          setSupportingDocuments((latest.supportingDocuments ?? []).join('\n'));
          setConflictDeclaration(latest.conflictDeclaration ?? '');
        }
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your application status.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.institution, user?.faculty, user?.department]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await apiRequest<Application>('/reviewer-applications', {
        method: 'POST',
        body: JSON.stringify({
          qualifications: splitLines(qualifications),
          expertiseAreas: splitLines(expertiseAreas),
          institution: institution.trim(),
          faculty: faculty.trim(),
          department: department.trim(),
          academicLevels: splitLines(academicLevels),
          reviewExperience,
          supportingDocuments: splitLines(supportingDocuments),
          conflictDeclaration,
          policyAccepted,
        }),
      });
      setApplication(result);
      await refreshSession().catch(() => undefined);
      setNotice('Your Academic Reviewer application has been submitted for administrator review.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your application.');
    } finally { setSaving(false); }
  };

  const canResubmit = application ? ['rejected', 'more_information_required'].includes(application.status) : !['submitted', 'under_review', 'approved', 'suspended', 'revoked'].includes(user?.reviewerStatus || 'not_applied');
  const accessBlocked = user?.reviewerStatus === 'suspended' || user?.reviewerStatus === 'revoked';
  if (accessBlocked) return <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-7 dark:border-rose-900 dark:bg-rose-950/30"><h2 className="text-xl font-bold text-rose-900 dark:text-rose-200">Reviewer access is {user?.reviewerStatus}</h2><p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-200">This account cannot submit a new reviewer application or enter the reviewer workspace while access is suspended or revoked. Contact Sophis Central support or an administrator for a formal access review.</p></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <section className="rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-4 sm:p-7 dark:border-[#40365A] dark:bg-[#211A34]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6121D0] dark:text-[#C4A7FF]">Additional account capability</p>
      <h2 className="mt-2 text-2xl font-bold text-[#091F5B] dark:text-white">Become an Academic Reviewer</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627B] dark:text-slate-300">Reviewer access is an additional capability. Your existing {user?.role === 'lecturer' ? 'Lecturer' : user?.role === 'reviewer' ? 'External Reviewer' : 'Student'} account, resources and academic identity remain unchanged. Access is enabled only after administrator approval.</p>
    </section>
    {!recruitmentOpen && !testAccountAllowed && !user?.hasReviewerAccess && <section role="status" className="rounded-2xl border border-[#E4DDF8] bg-[#F7F4FF] p-5 sm:p-7 dark:border-[#40365A] dark:bg-[#211A34]"><h3 className="text-xl font-bold text-[#091F5B] dark:text-white">Applications are currently closed</h3><p className="mt-2 text-sm leading-6 text-[#52627B] dark:text-slate-300">Academic Reviewer applications are not currently being accepted. Please check back for an announcement when applications reopen.</p></section>}
    {loading ? <p className="text-sm text-[#64748B]">Loading application status…</p> : (application || (user?.reviewerStatus && user.reviewerStatus !== 'not_applied')) && <section className="rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-[#091F5B] dark:text-white">Latest application status</p>
      <p className="mt-2 inline-flex rounded-full bg-[#F0EBFF] px-3 py-1 text-sm font-semibold capitalize text-[#6121D0] dark:bg-[#35264F] dark:text-[#D8C6FF]">{(application?.status ?? user?.reviewerStatus ?? 'not_applied').replace(/_/g, ' ')}</p>
      {application?.decisionNote && <p className="mt-3 text-sm leading-6 text-[#52627B] dark:text-slate-300">Administrator note: {application.decisionNote}</p>}
      {application?.createdAt && <p className="mt-2 text-xs text-[#64748B] dark:text-slate-400">Submitted {new Date(application.createdAt).toLocaleString()}</p>}
    </section>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}
    {(recruitmentOpen || testAccountAllowed || user?.hasReviewerAccess) && canResubmit && <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#DCE4EF] bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-7">
      <p className="text-sm leading-6 text-[#52627B] dark:text-slate-300 dark:text-slate-300">Provide accurate, verifiable information. Separate entries with commas or new lines.</p>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Qualifications and credentials<textarea required minLength={2} value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="Degrees, professional credentials, certifications…" className="mt-2 min-h-24 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Subject expertise<textarea required minLength={2} value={expertiseAreas} onChange={e => setExpertiseAreas(e.target.value)} placeholder="e.g. Computer science, statistics, research methods…" className="mt-2 min-h-24 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3"><label className="min-w-0 text-sm font-semibold text-[#091F5B] dark:text-slate-100">{user?.role === 'reviewer' ? 'Institution / research affiliation (optional)' : 'Institution'}<input readOnly={user?.role !== 'reviewer'} value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Institution or independent researcher" className="mt-2 w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-slate-50 p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" /></label><label className="min-w-0 text-sm font-semibold text-[#091F5B] dark:text-slate-100">{user?.role === 'reviewer' ? 'Faculty / research unit (optional)' : 'Faculty'}<input readOnly={user?.role !== 'reviewer'} value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="Faculty or research unit" className="mt-2 w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-slate-50 p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" /></label><label className="min-w-0 text-sm font-semibold text-[#091F5B] dark:text-slate-100">{user?.role === 'reviewer' ? 'Department / specialty (optional)' : 'Department'}<input readOnly={user?.role !== 'reviewer'} value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department or specialty" className="mt-2 w-full min-w-0 rounded-xl border border-[#DCE4EF] bg-slate-50 p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" /></label></div>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Academic levels qualified to review<textarea required value={academicLevels} onChange={e => setAcademicLevels(e.target.value)} placeholder="e.g. Undergraduate, postgraduate, doctoral…" className="mt-2 min-h-20 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Academic, research or peer-review experience<textarea required minLength={30} maxLength={5000} value={reviewExperience} onChange={e => setReviewExperience(e.target.value)} placeholder="Describe relevant experience and responsibilities…" className="mt-2 min-h-32 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Supporting document links (HTTPS only)<textarea value={supportingDocuments} onChange={e => setSupportingDocuments(e.target.value)} placeholder="https://… (one link per line)" className="mt-2 min-h-20 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <label className="block text-sm font-semibold text-[#091F5B] dark:text-slate-100">Conflict-of-interest declaration<textarea required minLength={20} maxLength={3000} value={conflictDeclaration} onChange={e => setConflictDeclaration(e.target.value)} placeholder="Declare relevant personal, academic, financial or professional relationships and confirm you will recuse yourself when conflicts arise." className="mt-2 min-h-28 w-full rounded-xl border border-[#DCE4EF] p-3 text-sm font-normal text-[#26364F] dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder:dark:text-slate-500" /></label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[#52627B] dark:text-slate-300"><input type="checkbox" checked={policyAccepted} onChange={e => setPolicyAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-[#6121D0]" /><span>I have read and agree to the Sophis Central Academic Reviewer policy, including impartiality, confidentiality, conflict disclosure, recusal and the prohibition on reviewing my own work.</span></label>
      <button type="submit" disabled={saving || !policyAccepted} className="rounded-xl bg-[#6121D0] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Submitting…' : 'Submit reviewer application'}</button>
    </form>}
  </div>;
}
