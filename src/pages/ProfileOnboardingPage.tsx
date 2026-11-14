import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { academicApi, type CourseOption, type InstitutionOption, type InstitutionType } from '../api/academic';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { clearPreAccountSession, readPreAccountSession, type PreAccountSession } from '../lib/registration-session';

const getAcademicLevels = (type: InstitutionType) => {
  if (type === 'polytechnic' || type === 'monotechnic') return ['ND I', 'ND II', 'HND I', 'HND II'];
  if (['college_of_education', 'college_of_health_technology', 'college_of_agriculture', 'other_college'].includes(type)) return ['100', '200', '300', '400', '500', '600', 'NCE I', 'NCE II', 'NCE III', 'ND I', 'ND II', 'HND I', 'HND II', 'Postgraduate'];
  return ['100', '200', '300', '400', '500', '600', 'Postgraduate'];
};
type TeachingAssignment = { courseName: string; courseCode: string; levels: string[] };
type Step = 1 | 2 | 3 | 4;
const normalizeAcademicLabel = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const matchesAcademicLabel = (label: string, query: string) => { const normalizedLabel = normalizeAcademicLabel(label); const normalizedQuery = normalizeAcademicLabel(query); return !normalizedQuery || normalizedLabel.includes(normalizedQuery) || (normalizedQuery.length >= 4 && normalizedQuery.includes(normalizedLabel)); };
const fieldClass = 'brand-input';

export function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding, completePreAccountOnboarding, logout } = useAuth();
  const [preAccount] = useState<PreAccountSession | null>(() => readPreAccountSession());
  const savedProgress = preAccount?.progress ?? {};
  const savedString = (key: string) => typeof savedProgress[key] === 'string' ? savedProgress[key] as string : '';
  const savedStep = Number(savedProgress.step);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [step, setStep] = useState<Step>([1, 2, 3, 4].includes(savedStep) ? savedStep as Step : 1);
  const [institutionId, setInstitutionId] = useState(user?.institutionId ?? savedString('institutionId'));
  const [institutionType, setInstitutionType] = useState<InstitutionType>((savedString('institutionType') as InstitutionType) || 'university');
  const [institutionManual, setInstitutionManual] = useState(savedString('institutionManual'));
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState(savedString('institutionSearch'));
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [facultyId, setFacultyId] = useState(savedString('facultyId'));
  const [facultySearch, setFacultySearch] = useState(savedString('facultySearch'));
  const [facultyManual, setFacultyManual] = useState(savedString('facultyManual'));
  const [department, setDepartment] = useState(savedString('department'));
  const [departmentSearch, setDepartmentSearch] = useState(savedString('departmentSearch'));
  const [departmentManual, setDepartmentManual] = useState(savedString('departmentManual'));
  const [programme, setProgramme] = useState(savedString('programme'));
  const [studyLevel, setStudyLevel] = useState(savedString('studyLevel'));
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>(Array.isArray(savedProgress.teachingAssignments) ? savedProgress.teachingAssignments as TeachingAssignment[] : []);
  const [courseTitleInput, setCourseTitleInput] = useState(savedString('courseTitleInput'));
  const [courseCodeInput, setCourseCodeInput] = useState(savedString('courseCodeInput'));
  const [courseLevelInput, setCourseLevelInput] = useState(savedString('courseLevelInput'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onboardingProgress = {
    step, institutionId, institutionType, institutionManual, institutionSearch,
    facultyId, facultySearch, facultyManual, department, departmentSearch,
    departmentManual, programme, studyLevel, teachingAssignments,
    courseTitleInput, courseCodeInput, courseLevelInput,
  };
  const leaveSetup = async () => {
    try {
      if (preAccount?.onboardingToken) await authApi.savePreAccountProgress(preAccount.onboardingToken, onboardingProgress).catch(() => undefined);
      if (user) await logout();
      else clearPreAccountSession();
    } finally { navigate('/', { replace: true }); }
  };
  useEffect(() => {
    if (!preAccount?.onboardingToken || onboardingCompleted) return;
    const timeout = window.setTimeout(() => {
      const progress = {
        step, institutionId, institutionType, institutionManual, institutionSearch,
        facultyId, facultySearch, facultyManual, department, departmentSearch,
        departmentManual, programme, studyLevel, teachingAssignments,
        courseTitleInput, courseCodeInput, courseLevelInput,
      };
      void authApi.savePreAccountProgress(preAccount.onboardingToken, progress).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    preAccount?.onboardingToken, onboardingCompleted, step, institutionId, institutionType,
    institutionManual, institutionSearch, facultyId, facultySearch, facultyManual,
    department, departmentSearch, departmentManual, programme, studyLevel,
    teachingAssignments, courseTitleInput, courseCodeInput, courseLevelInput,
  ]);

  const isLecturer = (user?.role ?? preAccount?.role) === 'lecturer';
  const totalSteps = isLecturer ? 4 : 3;
  const selectedInstitution = useMemo(() => institutions.find((item) => item.id === institutionId), [institutions, institutionId]);
  const sortedInstitutions = useMemo(() => [...institutions].sort((a, b) => a.name.localeCompare(b.name)), [institutions]);
  const categoryInstitutions = useMemo(() => sortedInstitutions.filter((item) => {
    const type = item.institutionType ?? 'university';
    return type === institutionType;
  }), [sortedInstitutions, institutionType]);
  const filteredInstitutions = useMemo(() => {
    const query = institutionSearch.trim().toLocaleLowerCase();
    return categoryInstitutions.filter((item) => !query || item.name.toLocaleLowerCase().includes(query) || [item.city, item.state].some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [categoryInstitutions, institutionSearch]);
  // Only show academic units belonging to the selected institution.
  // If its catalogue is incomplete, allow the learner to enter the exact name
  // without creating a moderation submission or blocking onboarding.
  const sharedFaculties = useMemo(
    () => selectedInstitution?.faculties ?? [],
    [selectedInstitution],
  );
  const normalizedFacultyQuery = normalizeAcademicLabel(facultySearch);
  const filteredSharedFaculties = useMemo(() => sharedFaculties.filter((item) => matchesAcademicLabel(item.name, facultySearch)), [sharedFaculties, normalizedFacultyQuery]);
  const typedFacultyMatch = facultySearch.trim() ? sharedFaculties.find((item) => normalizeAcademicLabel(item.name) === normalizedFacultyQuery) : undefined;
  const selectedFaculty = sharedFaculties.find((item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(facultyId)) ?? typedFacultyMatch;
  const localSelectedFaculty = selectedFaculty;
  // Never borrow departments from another institution or generic suggestions.
  const departments = localSelectedFaculty?.departments ?? [];
  const normalizedDepartmentQuery = normalizeAcademicLabel(departmentSearch);
  const filteredDepartments = departments.filter((item) => matchesAcademicLabel(item.name, departmentSearch));
  const typedDepartmentMatch = departmentSearch.trim() ? departments.find((item) => normalizeAcademicLabel(item.name) === normalizedDepartmentQuery) : undefined;
  const useManualInstitution = false;
  const useManualFaculty = facultyId === '__manual__';

  useEffect(() => { let active = true; academicApi.institutions().then((data) => { if (active) setInstitutions(Array.isArray(data) ? data : []); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load institutions.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!user?.institutionId || !institutions.length) return; const assigned = institutions.find((item) => item.id === user.institutionId); if (assigned) setInstitutionType(assigned.institutionType ?? 'university'); }, [user?.institutionId, institutions]);
  useEffect(() => { if (!institutionId || institutionId === '__manual__' || !isLecturer) { setCourses([]); return; } let active = true; academicApi.courses(institutionId).then((data) => { if (active) setCourses(Array.isArray(data) ? data : []); }).catch(() => { if (active) setCourses([]); }); return () => { active = false; }; }, [institutionId, isLecturer]);

  const academicLevels = getAcademicLevels(institutionType);
  const institutionName = selectedInstitution?.name ?? '';
  const facultyName = useManualFaculty ? facultyManual.trim() : selectedFaculty?.name ?? facultySearch.trim();
  const resolvedDepartmentName = useManualFaculty || department === '__manual__' ? departmentManual.trim() : department.trim() || typedDepartmentMatch?.name || departmentSearch.trim();
  const studentDepartmentName = resolvedDepartmentName;
  const canContinue = () => { if (step === 1) return Boolean(selectedInstitution && institutionId === selectedInstitution.id); if (step === 2) return Boolean(facultyName && resolvedDepartmentName); if (isLecturer) return step === 3 ? Boolean(teachingAssignments.length > 0 && teachingAssignments.every((course) => course.courseName.trim() && course.courseCode.trim() && course.levels.length === 1)) : step === 4; return Boolean(studentDepartmentName && programme.trim() && studyLevel); };
  const addTeachingAssignment = () => {
    const courseName = courseTitleInput.trim();
    const courseCode = courseCodeInput.trim().toUpperCase();
    const courseLevel = courseLevelInput.trim();
    if (!courseName || !courseCode || !courseLevel) return;
    if (teachingAssignments.some((item) => item.courseCode.toLowerCase() === courseCode.toLowerCase())) {
      setError('This course code has already been added.');
      return;
    }
    setTeachingAssignments((current) => [...current, { courseName, courseCode, levels: [courseLevel] }]);
    setCourseTitleInput('');
    setCourseCodeInput('');
    setCourseLevelInput('');
    setError('');
  };
  const save = async () => {
    if (!canContinue()) return;
    setSaving(true);
    setError('');
    try {
      const departmentName = resolvedDepartmentName;

      const profile = {
        institutionId,
        institution: institutionName,
        faculty: facultyName,
        department: departmentName,
        programme: isLecturer ? undefined : programme.trim(),
        studyLevel: isLecturer ? undefined : studyLevel,
        coursesTaught: isLecturer ? teachingAssignments.map((item) => item.courseCode ? `${item.courseCode} — ${item.courseName}` : item.courseName) : undefined,
        teachingAssignments: isLecturer ? teachingAssignments : undefined,
      };
      if (user) await completeOnboarding(profile);
      else if (preAccount?.onboardingToken) await completePreAccountOnboarding(preAccount.onboardingToken, profile);
      else throw new Error('Your verified registration session has expired. Please restart account creation.');
      setOnboardingCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your academic profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user && !preAccount) return <Navigate to="/onboarding" replace />;
  const stepLabel = isLecturer ? 'Lecturer' : 'Student';
  return <main className="profile-onboarding min-h-screen bg-[#F3F6FC] px-4 py-6 text-[#091F5B] sm:px-6 sm:py-8"><div className="mx-auto w-full max-w-4xl">
    <div className="mb-7 rounded-3xl bg-[#2C36D9] p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">Sophis Central · Academic setup</p><h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{isLecturer ? 'Set up your lecturer profile' : 'Set up your student profile'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">Complete your academic path before entering your dashboard.</p></div><div className="flex flex-wrap items-center gap-2"><div className="rounded-full bg-[#6121D0] px-4 py-2 text-xs font-semibold text-white">{stepLabel}</div><button type="button" onClick={() => void leaveSetup()} disabled={saving} className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50">Leave setup · Sign out</button></div></div></div>
    <div className="mb-6 flex gap-2" aria-label="Onboarding progress">{Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#6121D0]' : 'bg-[#E8EDF5]'}`} />)}</div>
    <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 text-[#091F5B] shadow-sm sm:p-8">
      {loading ? <p className="text-[#5C6982]">Loading institutions…</p> : onboardingCompleted ? <div className="space-y-5 py-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600" aria-hidden="true">✓</div><h2 className="text-2xl font-bold text-[#091F5B]">Your account is ready</h2><p className="mx-auto max-w-xl text-sm leading-6 text-[#5C6982]">Your academic profile has been saved, and your Sophis Central account and permanent Institution ID have now been created. Group Chat membership uses your institution, faculty and department.</p><button type="button" onClick={() => navigate(isLecturer ? '/lecturer/dashboard' : '/student/dashboard', { replace: true })} className="rounded-xl bg-[#6121D0] px-6 py-3 font-semibold text-white hover:bg-[#5120B0]">Continue to dashboard</button></div> : <>
        {step === 1 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 1</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Institution {isLecturer ? 'select / verify' : 'selection'}</h2><p className="mt-2 text-sm text-[#5C6982]">Choose the institution that anchors your academic identity.</p></div><div className="relative"><label className="mb-2 block text-sm font-semibold text-[#091F5B]" htmlFor="institution-type">Institution category</label><select id="institution-type" value={institutionType} disabled={Boolean(user?.institutionId)} onChange={(event) => { setInstitutionType(event.target.value as InstitutionType); setStudyLevel(''); setInstitutionId(''); setInstitutionManual(''); setFacultyId(''); setFacultySearch(''); setDepartment(''); setDepartmentSearch(''); setFacultyManual(''); setDepartmentManual(''); }} className={fieldClass}><option value="university">Universities</option><option value="polytechnic">Polytechnics</option><option value="college_of_education">Colleges of Education</option></select><label className="mb-2 mt-4 block text-sm font-semibold text-[#091F5B]" htmlFor="institution-picker">Select institution</label><button id="institution-picker" type="button" disabled={Boolean(user?.institutionId)} aria-haspopup="listbox" aria-expanded={institutionDropdownOpen} onClick={() => { setInstitutionDropdownOpen((open) => !open); setInstitutionSearch(''); }} className={`${fieldClass} flex items-center justify-between gap-3 text-left`}><span className={institutionId ? 'text-[#091F5B]' : 'text-[#71809A]'}>{useManualInstitution ? 'My institution is not listed' : selectedInstitution?.name ?? 'Select institution'}</span><span aria-hidden="true" className="text-[#71809A]">▾</span></button>{institutionDropdownOpen && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#DCE4EF] bg-white shadow-xl"><div className="border-b border-[#E8EDF5] p-2"><input autoFocus value={institutionSearch} onChange={(event) => setInstitutionSearch(event.target.value)} placeholder={institutionType === 'university' ? 'Search universities...' : institutionType === 'polytechnic' ? 'Search polytechnics...' : 'Search institutions...'} className={fieldClass} aria-label="Search universities" /></div><div role="listbox" aria-label="Imported institutions" className="max-h-64 overflow-y-auto p-1">{filteredInstitutions.length ? filteredInstitutions.map((item) => <button key={item.id} type="button" role="option" aria-selected={institutionId === item.id} onClick={() => { setInstitutionId(item.id); setFacultyId(''); setFacultySearch(''); setDepartment(''); setDepartmentSearch(''); setInstitutionDropdownOpen(false); setInstitutionSearch(''); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[#F3F1FF] ${institutionId === item.id ? 'bg-[#F3F1FF] font-semibold text-[#6121D0]' : 'text-[#091F5B]'}`}><span className="block">{item.name}</span>{(item.state || item.city) && <span className="mt-0.5 block text-xs text-[#71809A]">{[item.state, item.city].filter(Boolean).join(' · ')}</span>}</button>) : <p className="px-3 py-4 text-sm text-[#71809A]">No matching imported institution.</p>}</div></div>}</div>{useManualInstitution && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="manual-institution">Enter institution name</label><input id="manual-institution" value={institutionManual} onChange={(event) => setInstitutionManual(event.target.value)} placeholder={institutionType === 'university' ? 'Start typing your university name...' : institutionType === 'polytechnic' ? 'Start typing your polytechnic name...' : 'Start typing your institution name...'} className={fieldClass} autoComplete="off" />{institutionManual.trim().length >= 2 && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching imported institutions</p>{categoryInstitutions.filter((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())).slice(0, 6).map((item) => <button key={item.id} type="button" onClick={() => { setInstitutionId(item.id); setInstitutionManual(''); setFacultyId(''); setDepartment(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}{!categoryInstitutions.some((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())) && <p className="px-3 py-2 text-sm text-[#71809A]">No imported match yet. Enter the institution name to continue; it will be saved to your profile.</p>}</div>}</div>}{!institutions.length && <p className="text-sm text-[#5C6982]">No institutions were returned by the catalogue. Enter your institution manually to continue.</p>}</div>}
        {step === 2 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 2</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Faculty & department</h2><p className="mt-2 text-sm text-[#5C6982]">Choose the faculty, school or college that your institution uses.</p><div role="note" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Please enter your academic details carefully.</p><p className="mt-1">If your institution's directory is incomplete or unavailable, type the full official name of your faculty, school or college and your complete department name exactly as shown in your admission letter or academic records. Avoid abbreviations and do not guess. These details are saved to your profile only; they are not sent to moderators and will not be added to the shared catalogue automatically.</p></div></div><div className="space-y-3"><div className="space-y-2"><label htmlFor="faculty-picker" className="block text-sm font-semibold text-[#091F5B]">Faculty / School / College</label><select id="faculty-picker" value={facultyId} disabled={Boolean(facultySearch.trim())} onChange={(event) => { setFacultyId(event.target.value); setFacultySearch(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} aria-label="Faculty, school or college"><option value="">Select faculty / school / college</option>{sharedFaculties.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}<option value="__manual__">My faculty / school / college is not listed</option></select><label htmlFor="faculty-search" className="block text-sm font-medium text-[#5C6982]">Or search / enter your faculty</label><input id="faculty-search" value={facultySearch} disabled={Boolean(facultyId)} onChange={(event) => { setFacultySearch(event.target.value); setFacultyId(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} placeholder="Type your faculty, school or college..." className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} autoComplete="off" /><p className="text-xs text-[#71809A]">Choose from the list above or type below. The two methods are mutually exclusive.</p>{typedFacultyMatch && <p role="status" className="text-xs font-medium text-emerald-700">Matched catalogue entry: {typedFacultyMatch.name}</p>}{facultySearch.trim() && filteredSharedFaculties.length > 0 && !typedFacultyMatch && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching faculties, schools and colleges</p>{filteredSharedFaculties.slice(0, 8).map((item) => <button key={item.name} type="button" onClick={() => { setFacultyId(item.name); setFacultySearch(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}</div>{useManualFaculty && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="manual-faculty">Enter faculty / school / college name</label><input id="manual-faculty" value={facultyManual} onChange={(event) => { setFacultyManual(event.target.value); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} placeholder="Enter faculty name" className={fieldClass} aria-label="Faculty name" /></div>}{!useManualFaculty && <div className="space-y-2"><label htmlFor="department-picker" className="block text-sm font-semibold text-[#091F5B]">Department</label><select id="department-picker" value={department} disabled={!selectedFaculty || Boolean(departmentSearch.trim())} onChange={(event) => { setDepartment(event.target.value); setDepartmentSearch(''); setDepartmentManual(''); }} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} aria-label="Department"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value="__manual__">My department is not listed</option></select><label htmlFor="department-search" className="block text-sm font-medium text-[#5C6982]">Or search / enter your department</label><input id="department-search" value={departmentSearch} disabled={Boolean(department)} onChange={(event) => { setDepartmentSearch(event.target.value); setDepartment(''); setDepartmentManual(''); }} placeholder={selectedFaculty ? "Type your department..." : "Enter your department..."} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} autoComplete="off" /><p className="text-xs text-[#71809A]">Choose from the department list or type below. Choose an exact match where available, or enter your institution's name as it appears in your academic records.</p>{typedDepartmentMatch && <p role="status" className="text-xs font-medium text-emerald-700">Matched catalogue entry: {typedDepartmentMatch.name}</p>}{departmentSearch.trim() && filteredDepartments.length > 0 && !typedDepartmentMatch && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching departments</p>{filteredDepartments.slice(0, 8).map((item) => <button key={item.id} type="button" onClick={() => { setDepartment(item.name); setDepartmentSearch(''); setDepartmentManual(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}{department === '__manual__' && <input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={fieldClass} aria-label="Department name" />}</div>}{useManualFaculty && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]">Department</label><input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={fieldClass} aria-label="Department name" /></div>}</div></div>}
        {!isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Programme / Course of Study</h2><p className="mt-2 text-sm text-[#5C6982]">Enter the academic programme you are enrolled in. Your department was selected in Step 2 and remains the basis for your Student Group Chat.</p></div><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-programme">Programme / Course of Study<input id="student-programme" required value={programme} onChange={(event) => setProgramme(event.target.value)} placeholder="e.g. B.Sc. Computer Science, HND Accountancy, B.NSc Nursing" maxLength={160} className={`${fieldClass} mt-2`} /></label><p className="-mt-3 text-xs leading-5 text-[#71809A]">Enter the programme name as shown in your admission or academic records. This does not change your department or Group Chat.</p><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-level">Current academic level<select id="student-level" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)} className={`${fieldClass} mt-2`} aria-label="Current academic level"><option value="">Select your current level</option>{academicLevels.map((level) => <option key={level} value={level}>{level.includes('Degree ') ? `${level} level` : level === 'Postgraduate' ? 'Postgraduate' : level.includes('level') ? level : `${level} level`}</option>)}</select></label></div>}
        {isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Courses taught</h2><p className="mt-2 text-sm text-[#5C6982]">Add each course with its title, course code and academic level.</p></div>{courses.length > 0 && <label className="block space-y-2 text-sm font-semibold text-[#091F5B]">Select from your institution’s course catalogue<select value="" onChange={(event) => { const selected = courses.find((item) => item.id === event.target.value); if (selected) { setCourseTitleInput(selected.title); setCourseCodeInput(selected.code ?? ''); setCourseLevelInput(selected.level && academicLevels.includes(selected.level) ? selected.level : ''); } }} className={fieldClass}><option value="">Choose a course to fill the fields</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} — ${course.title}` : course.title}</option>)}</select></label>}<div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#091F5B]">Course title<input required value={courseTitleInput} onChange={(event) => setCourseTitleInput(event.target.value)} placeholder="e.g. Data Structures and Algorithms" className={`${fieldClass} mt-2`} /></label><label className="block text-sm font-semibold text-[#091F5B]">Course code<input required value={courseCodeInput} onChange={(event) => setCourseCodeInput(event.target.value.toUpperCase())} placeholder="e.g. CSC 301" className={`${fieldClass} mt-2`} /></label><label className="block text-sm font-semibold text-[#091F5B] sm:col-span-2">Course level<select required value={courseLevelInput} onChange={(event) => setCourseLevelInput(event.target.value)} className={`${fieldClass} mt-2`}><option value="">Select the level for this course</option>{academicLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label></div><button type="button" disabled={!courseTitleInput.trim() || !courseCodeInput.trim() || !courseLevelInput} onClick={addTeachingAssignment} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">Add course</button><div className="space-y-3">{teachingAssignments.map((course, index) => <div key={`${course.courseCode}-${course.courseName}-${index}`} className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-[#091F5B]">{course.courseName}</p><p className="text-xs text-[#71809A]">{course.courseCode} · {course.levels[0]}</p></div><button type="button" onClick={() => setTeachingAssignments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-sm font-semibold text-rose-600">Remove</button></div></div>)}</div></div>}
        {isLecturer && step === 4 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 4</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Verify your academic identity</h2><p className="mt-2 text-sm text-[#5C6982]">Review the academic details that establish your teaching profile and help identify the students whose academic pathway aligns with yours.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['Institution', institutionName], ['Faculty', facultyName], ['Department', (useManualFaculty || department === '__manual__') ? departmentManual : department], ['Courses taught', teachingAssignments.map((course) => `${course.courseCode ? `${course.courseCode} — ` : ''}${course.courseName} (${course.levels.join(', ') || 'No level selected'})`).join('; ') || 'None']].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71809A]">{label}</div><div className="mt-2 text-sm font-medium text-[#091F5B]">{value}</div></div>)}</div></div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} disabled={step === 1 || saving} className="rounded-xl border border-[#DCE4EF] px-5 py-3 font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-40">Back</button>{step < totalSteps ? <button type="button" onClick={() => canContinue() && setStep((current) => Math.min(totalSteps, current + 1) as Step)} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">Continue</button> : <button type="button" onClick={() => void save()} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving profile…' : isLecturer ? 'Enter lecturer dashboard' : 'Enter student dashboard'}</button>}</div>
      </>}
    </section>
  </div></main>;
}
