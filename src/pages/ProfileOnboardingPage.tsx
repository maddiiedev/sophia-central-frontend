import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicApi, type CourseOption, type DepartmentOption, type InstitutionOption } from '../api/academic';
import { useAuth } from '../context/AuthContext';

const levels = ['100', '200', '300', '400', '500', '600', 'Postgraduate'];
type Step = 1 | 2 | 3 | 4;
const fieldClass = 'w-full rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-[#091F5B] outline-none transition focus:border-[#6121D0] focus:ring-2 focus:ring-[#6121D0]/15';

export function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding, logout } = useAuth();
  const leaveSetup = async () => {
    try { await logout(); } finally { navigate('/', { replace: true }); }
  };
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [institutionId, setInstitutionId] = useState('');
  const [institutionManual, setInstitutionManual] = useState('');
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [catalogueNotice, setCatalogueNotice] = useState('');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [facultyId, setFacultyId] = useState('');
  const [facultyManual, setFacultyManual] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentManual, setDepartmentManual] = useState('');
  const [programme, setProgramme] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [coursesTaught, setCoursesTaught] = useState<string[]>([]);
  const [courseInput, setCourseInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isLecturer = user?.role === 'lecturer';
  const totalSteps = isLecturer ? 4 : 3;
  const selectedInstitution = useMemo(() => institutions.find((item) => item.id === institutionId), [institutions, institutionId]);
  const sortedInstitutions = useMemo(() => [...institutions].sort((a, b) => a.name.localeCompare(b.name)), [institutions]);
  const filteredInstitutions = useMemo(() => {
    const query = institutionSearch.trim().toLocaleLowerCase();
    return sortedInstitutions.filter((item) => !query || item.name.toLocaleLowerCase().includes(query) || [item.city, item.state].some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [sortedInstitutions, institutionSearch]);
  // Build one shared set from every imported institution. Each choice is still
  // validated/mapped to the selected institution through the review workflow.
  const sharedFaculties = useMemo(() => {
    const map = new Map<string, { name: string; departments: Map<string, DepartmentOption> }>();
    for (const institution of institutions) {
      for (const faculty of institution.faculties ?? []) {
        const key = faculty.name.trim().toLocaleLowerCase();
        if (!key) continue;
        if (!map.has(key)) map.set(key, { name: faculty.name.trim(), departments: new Map() });
        const target = map.get(key)!;
        for (const department of faculty.departments ?? []) {
          const departmentKey = department.name.trim().toLocaleLowerCase();
          if (departmentKey && !target.departments.has(departmentKey)) target.departments.set(departmentKey, { id: departmentKey, name: department.name.trim() });
        }
      }
    }
    const common: Record<string, string[]> = {
      'faculty of science': ['Biochemistry', 'Biology', 'Chemistry', 'Computer Science', 'Geology', 'Mathematics', 'Microbiology', 'Physics', 'Statistics'],
      'faculty of engineering': ['Agricultural Engineering', 'Chemical Engineering', 'Civil Engineering', 'Computer Engineering', 'Electrical/Electronics Engineering', 'Mechanical Engineering', 'Petroleum Engineering'],
      'faculty of arts': ['English and Literary Studies', 'History and International Studies', 'Linguistics', 'Philosophy', 'Religious Studies', 'Theatre Arts'],
      'faculty of social sciences': ['Economics', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'Social Work'],
      'faculty of education': ['Educational Administration', 'Educational Foundations', 'Guidance and Counselling', 'Science Education', 'Technical Education'],
      'faculty of management sciences': ['Accounting', 'Banking and Finance', 'Business Administration', 'Marketing', 'Public Administration'],
      'faculty of agriculture': ['Agricultural Economics', 'Agricultural Extension', 'Animal Science', 'Crop Science', 'Food Science and Technology', 'Soil Science'],
      'faculty of environmental sciences': ['Architecture', 'Building', 'Estate Management', 'Quantity Surveying', 'Urban and Regional Planning'],
      'faculty of basic medical sciences': ['Anatomy', 'Medical Biochemistry', 'Medical Laboratory Science', 'Medical Physiology', 'Nursing Science'],
      'faculty of clinical sciences': ['Medicine and Surgery', 'Medical Rehabilitation', 'Radiography'],
      'faculty of law': ['Law'],
      'faculty of pharmacy': ['Pharmacy'],
      'faculty of dentistry': ['Dentistry'],
      'faculty of communication and media studies': ['Broadcasting', 'Film and Multimedia Studies', 'Journalism and Media Studies', 'Public Relations'],
      'faculty of veterinary medicine': ['Veterinary Anatomy', 'Veterinary Medicine', 'Veterinary Microbiology'],
    };
    for (const [facultyName, names] of Object.entries(common)) {
      const key = facultyName.toLocaleLowerCase();
      if (!map.has(key)) map.set(key, { name: facultyName.replace(/^faculty of /, 'Faculty of ').replace(/\b\w/g, (letter) => letter.toUpperCase()), departments: new Map() });
      const target = map.get(key)!;
      for (const name of names) {
        const departmentKey = name.toLocaleLowerCase();
        if (!target.departments.has(departmentKey)) target.departments.set(departmentKey, { id: departmentKey, name });
      }
    }
    return [...map.values()].map((item) => ({ name: item.name, departments: [...item.departments.values()].sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [institutions]);
  const selectedFaculty = sharedFaculties.find((item) => item.name.toLocaleLowerCase() === facultyId.toLocaleLowerCase());
  const localSelectedFaculty = selectedInstitution?.faculties?.find((item) => item.name.toLocaleLowerCase() === facultyId.toLocaleLowerCase());
  const departments = selectedFaculty?.departments ?? [];
  const useManualInstitution = institutionId === '__manual__';
  const useManualFaculty = facultyId === '__manual__';

  useEffect(() => { let active = true; academicApi.institutions().then((data) => { if (active) setInstitutions(Array.isArray(data) ? data : []); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load institutions.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!institutionId || institutionId === '__manual__' || !isLecturer) { setCourses([]); return; } let active = true; academicApi.courses(institutionId).then((data) => { if (active) setCourses(Array.isArray(data) ? data : []); }).catch(() => { if (active) setCourses([]); }); return () => { active = false; }; }, [institutionId, isLecturer]);

  const institutionName = useManualInstitution ? institutionManual.trim() : selectedInstitution?.name ?? '';
  const facultyName = useManualFaculty ? facultyManual.trim() : selectedFaculty?.name ?? '';
  const canContinue = () => { if (step === 1) return useManualInstitution ? Boolean(institutionManual.trim()) : Boolean(institutionId); if (step === 2) return Boolean((useManualFaculty ? facultyManual.trim() : facultyId) && ((useManualFaculty || department === '__manual__') ? departmentManual.trim() : department.trim())); if (isLecturer) return step === 3 ? coursesTaught.length > 0 : step === 4; return Boolean(programme.trim() && studyLevel); };
  const addCourse = (value: string) => { const clean = value.trim(); if (!clean || coursesTaught.includes(clean)) return; setCoursesTaught((current) => [...current, clean]); setCourseInput(''); };
  const save = async () => {
    if (!canContinue()) return;
    setSaving(true);
    setError('');
    setCatalogueNotice('');
    try {
      const departmentName = (useManualFaculty || department === '__manual__') ? departmentManual.trim() : department.trim();
      const pending: string[] = [];

      let institutionSubmissionId: string | undefined;
      if (useManualInstitution && institutionName) {
        const institutionSubmission = await academicApi.submitCatalogueEntry({
          entryType: 'institution',
          name: institutionName,
        }) as { id: string };
        institutionSubmissionId = institutionSubmission.id;
        pending.push('institution');
      }

      if (facultyName && (selectedInstitution || institutionSubmissionId)) {
        let facultyForInstitution = localSelectedFaculty;
        let facultySubmissionId: string | undefined;

        if (institutionSubmissionId || !facultyForInstitution) {
          const facultySubmission = await academicApi.submitCatalogueEntry({
            entryType: 'faculty',
            name: facultyName,
            ...(institutionSubmissionId
              ? { parentInstitutionSubmissionId: institutionSubmissionId }
              : { parentInstitutionId: selectedInstitution!.id }),
          }) as { id: string };
          facultySubmissionId = facultySubmission.id;
          pending.push('faculty');
        }

        if (departmentName) {
          const departmentExistsLocally = facultyForInstitution?.departments?.some(
            (item) => item.name.toLocaleLowerCase() === departmentName.toLocaleLowerCase(),
          );
          const departmentExistsInSharedList = departments.some(
            (item) => item.name.toLocaleLowerCase() === departmentName.toLocaleLowerCase(),
          );
          if (facultySubmissionId) {
            await academicApi.submitCatalogueEntry({
              entryType: 'department',
              name: departmentName,
              ...(institutionSubmissionId
                ? { parentInstitutionSubmissionId: institutionSubmissionId }
                : { parentInstitutionId: selectedInstitution!.id }),
              parentFacultySubmissionId: facultySubmissionId,
            });
            pending.push('department');
          } else if (facultyForInstitution && !departmentExistsLocally && (department === '__manual__' || departmentExistsInSharedList)) {
            await academicApi.submitCatalogueEntry({
              entryType: 'department',
              name: departmentName,
              parentInstitutionId: selectedInstitution!.id,
              parentFacultyId: facultyForInstitution.id,
            });
            pending.push('department');
          }
        }
      }

      if (pending.length) {
        setCatalogueNotice('Your new ' + pending.join(' and ') + ' entr' + (pending.length > 1 ? 'ies have' : 'y has') + ' been submitted for moderator/admin review. Your profile can still be completed.');
      }

      await completeOnboarding({
        institution: institutionName,
        faculty: facultyName,
        department: departmentName,
        programme: isLecturer ? undefined : programme.trim(),
        studyLevel: isLecturer ? undefined : studyLevel,
        coursesTaught: isLecturer ? coursesTaught : undefined,
      });
      setOnboardingCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your academic profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  const stepLabel = isLecturer ? 'Lecturer' : 'Student';
  return <main className="profile-onboarding min-h-screen bg-[#F3F6FC] px-4 py-8 text-[#091F5B] sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-4xl">
    <div className="mb-7 rounded-3xl bg-[#2C36D9] p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">Sophis Central · Academic setup</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{isLecturer ? 'Set up your lecturer profile' : 'Set up your student profile'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">Complete your academic path before entering your dashboard.</p></div><div className="flex flex-wrap items-center gap-2"><div className="rounded-full bg-[#6121D0] px-4 py-2 text-xs font-semibold text-white">{stepLabel}</div><button type="button" onClick={() => void leaveSetup()} disabled={saving} className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50">Leave setup · Sign out</button></div></div></div>
    <div className="mb-6 flex gap-2" aria-label="Onboarding progress">{Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#6121D0]' : 'bg-[#E8EDF5]'}`} />)}</div>
    <section className="rounded-3xl border border-[#DCE4EF] bg-white p-5 text-[#091F5B] shadow-md sm:p-8">
      {loading ? <p className="text-[#5C6982]">Loading institutions…</p> : error && !institutions.length ? <p className="text-rose-600">{error}</p> : onboardingCompleted ? <div className="space-y-5 py-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600" aria-hidden="true">✓</div><h2 className="text-2xl font-bold text-[#091F5B]">Your academic profile is complete</h2><p className="mx-auto max-w-xl text-sm leading-6 text-[#5C6982]">You can now enter Sophis Central. Any new institution, faculty or department submitted for review will not prevent you from using your account while it is being reviewed.</p>{catalogueNotice && <div role="status" className="rounded-xl border border-[#D8CCFA] bg-[#F8F6FF] px-4 py-3 text-left text-sm leading-6 text-[#45208C]">{catalogueNotice}</div>}<button type="button" onClick={() => navigate(isLecturer ? '/lecturer' : '/dashboard', { replace: true })} className="rounded-xl bg-[#6121D0] px-6 py-3 font-semibold text-white hover:bg-[#5120B0]">Continue to dashboard</button></div> : <>
        {step === 1 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 1</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Institution {isLecturer ? 'select / verify' : 'selection'}</h2><p className="mt-2 text-sm text-[#5C6982]">Choose the institution that anchors your academic identity.</p></div><div className="relative"><label className="mb-2 block text-sm font-semibold text-[#091F5B]" htmlFor="institution-picker">Select institution</label><button id="institution-picker" type="button" aria-haspopup="listbox" aria-expanded={institutionDropdownOpen} onClick={() => { setInstitutionDropdownOpen((open) => !open); setInstitutionSearch(''); }} className={`${fieldClass} flex items-center justify-between gap-3 text-left`}><span className={institutionId ? 'text-[#091F5B]' : 'text-[#71809A]'}>{useManualInstitution ? 'My institution is not listed' : selectedInstitution?.name ?? 'Select institution'}</span><span aria-hidden="true" className="text-[#71809A]">▾</span></button>{institutionDropdownOpen && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#DCE4EF] bg-white shadow-xl"><div className="border-b border-[#E8EDF5] p-2"><input autoFocus value={institutionSearch} onChange={(event) => setInstitutionSearch(event.target.value)} placeholder="Search universities..." className={fieldClass} aria-label="Search universities" /></div><div role="listbox" aria-label="Imported institutions" className="max-h-64 overflow-y-auto p-1">{filteredInstitutions.length ? filteredInstitutions.map((item) => <button key={item.id} type="button" role="option" aria-selected={institutionId === item.id} onClick={() => { setInstitutionId(item.id); setFacultyId(''); setDepartment(''); setInstitutionDropdownOpen(false); setInstitutionSearch(''); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[#F3F1FF] ${institutionId === item.id ? 'bg-[#F3F1FF] font-semibold text-[#6121D0]' : 'text-[#091F5B]'}`}><span className="block">{item.name}</span>{(item.state || item.city) && <span className="mt-0.5 block text-xs text-[#71809A]">{[item.state, item.city].filter(Boolean).join(' · ')}</span>}</button>) : <p className="px-3 py-4 text-sm text-[#71809A]">No matching imported institution.</p>}</div><button type="button" role="option" aria-selected={useManualInstitution} onClick={() => { setInstitutionId('__manual__'); setInstitutionManual(institutionSearch); setFacultyId(''); setDepartment(''); setInstitutionDropdownOpen(false); setInstitutionSearch(''); }} className="w-full border-t border-[#E8EDF5] px-3 py-3 text-left text-sm font-semibold text-[#6121D0] hover:bg-[#F8F6FF]">My institution is not listed</button></div>}</div>{useManualInstitution && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="manual-institution">Enter institution name</label><input id="manual-institution" value={institutionManual} onChange={(event) => setInstitutionManual(event.target.value)} placeholder="Start typing your university name..." className={fieldClass} autoComplete="off" />{institutionManual.trim().length >= 2 && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching imported institutions</p>{sortedInstitutions.filter((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())).slice(0, 6).map((item) => <button key={item.id} type="button" onClick={() => { setInstitutionId(item.id); setInstitutionManual(''); setFacultyId(''); setDepartment(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}{!sortedInstitutions.some((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())) && <p className="px-3 py-2 text-sm text-[#71809A]">No imported match yet. You can submit this institution for review.</p>}</div>}</div>}{!institutions.length && <p className="text-sm text-[#5C6982]">No institutions were returned by the catalogue. Enter your institution manually to continue.</p>}</div>}
        {step === 2 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 2</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Faculty & department</h2><p className="mt-2 text-sm text-[#5C6982]">Choose from the shared academic catalogue. Options are collected across imported universities; selections not yet linked to your institution are submitted for moderator/admin review.</p></div><label className="block text-sm font-semibold text-[#091F5B]">Faculty<select value={facultyId} onChange={(event) => { setFacultyId(event.target.value); setFacultyManual(''); setDepartment(''); setDepartmentManual(''); }} className={fieldClass} aria-label="Faculty"><option value="">Select faculty</option>{sharedFaculties.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}<option value="__manual__">My faculty is not listed</option></select></label>{useManualFaculty && <input value={facultyManual} onChange={(event) => { setFacultyManual(event.target.value); setDepartment(''); }} placeholder="Enter faculty name" className={fieldClass} aria-label="Faculty name" />}<label className="block text-sm font-semibold text-[#091F5B]">Department{useManualFaculty ? <input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={`${fieldClass} mt-2`} aria-label="Department name" /> : <select value={department} onChange={(event) => { setDepartment(event.target.value); setDepartmentManual(''); }} disabled={!facultyId} className={`${fieldClass} mt-2 disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} aria-label="Department"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value="__manual__">My department is not listed</option></select>}</label>{department === '__manual__' && <input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={fieldClass} aria-label="Department name" />}</div>}
        {!isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Course of study / Department & level</h2><p className="mt-2 text-sm text-[#5C6982]">Enter your course of study so resource discovery can be scoped correctly.</p></div><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-course-of-study">Course of study / Department<input id="student-course-of-study" value={programme} onChange={(event) => setProgramme(event.target.value)} placeholder="e.g. Computer Science or Medicine and Surgery" className={`${fieldClass} mt-2`} aria-label="Course of study / Department" /></label><p className="-mt-3 text-xs leading-5 text-[#71809A]">Enter your actual course or discipline, not just the degree abbreviation. You may include both, for example: BSc Computer Science or MBBS Medicine and Surgery.</p><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-level">Current academic level<select id="student-level" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)} className={`${fieldClass} mt-2`} aria-label="Current academic level"><option value="">Select your current level</option>{levels.map((level) => <option key={level} value={level}>{level === 'Postgraduate' ? 'Postgraduate' : `${level} level`}</option>)}</select></label></div>}
        {isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Courses taught</h2><p className="mt-2 text-sm text-[#5C6982]">Select available courses or add a course manually if it is not in the catalogue.</p></div>{courses.length > 0 && <select onChange={(event) => { if (event.target.value) addCourse(event.target.value); }} className={fieldClass} aria-label="Course catalogue"><option value="">Add a course from the catalogue</option>{courses.map((course) => <option key={course.id} value={course.code ? `${course.code} — ${course.title}` : course.title}>{course.code ? `${course.code} — ${course.title}` : course.title}</option>)}</select>}<div className="flex gap-2"><input value={courseInput} onChange={(event) => setCourseInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCourse(courseInput); } }} placeholder="e.g. CSC 301 — Data Structures" className={`${fieldClass} min-w-0 flex-1`} /><button type="button" onClick={() => addCourse(courseInput)} className="rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white hover:bg-[#5120B0]">Add</button></div><div className="flex flex-wrap gap-2">{coursesTaught.map((course) => <button key={course} type="button" onClick={() => setCoursesTaught((current) => current.filter((item) => item !== course))} className="rounded-full border border-[#6121D0]/25 bg-[#6121D0]/10 px-3 py-1.5 text-sm font-medium text-[#6121D0]">{course} ×</button>)}</div></div>}
        {isLecturer && step === 4 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 4</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Verify your academic identity</h2><p className="mt-2 text-sm text-[#5C6982]">Review the institution, faculty, department and courses that will appear on your lecturer profile.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['Institution', institutionName], ['Faculty', facultyName], ['Department', (useManualFaculty || department === '__manual__') ? departmentManual : department], ['Courses taught', coursesTaught.join(', ') || 'None']].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71809A]">{label}</div><div className="mt-2 text-sm font-medium text-[#091F5B]">{value}</div></div>)}</div></div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} disabled={step === 1 || saving} className="rounded-xl border border-[#DCE4EF] px-5 py-3 font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-40">Back</button>{step < totalSteps ? <button type="button" onClick={() => canContinue() && setStep((current) => Math.min(totalSteps, current + 1) as Step)} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">Continue</button> : <button type="button" onClick={() => void save()} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving profile…' : isLecturer ? 'Enter lecturer dashboard' : 'Enter student dashboard'}</button>}</div>
      </>}
    </section>
  </div></main>;
}
