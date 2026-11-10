import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicApi, type CourseOption, type DepartmentOption, type InstitutionOption } from '../api/academic';
import academicStructureCandidates from '../data/nigerian-academic-structures-candidates.json';
import { useAuth } from '../context/AuthContext';

type AcademicStructureCandidate = { institutionName: string; institutionType: string; structures: Array<{ name: string; departments: string[] }> };
const structureCandidates = academicStructureCandidates as AcademicStructureCandidate[];
const normalizeInstitutionName = (value: string) => {
  const parts = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/&/g, ' and ').split(',');
  const normalizePart = (part: string) => part.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const head = normalizePart(parts.shift() ?? '');
  const headTokens = new Set(head.split(' ').filter(Boolean));
  const stateNames = new Set(['abia', 'adamawa', 'akwa', 'anambra', 'bauchi', 'bayelsa', 'benue', 'borno', 'cross', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu', 'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara', 'fct']);
  const suffix = parts.flatMap((part) => normalizePart(part).split(' ')).filter((token) => token && token !== 'state' && token !== 'nigeria' && !stateNames.has(token) && !headTokens.has(token));
  return [head, ...suffix].filter(Boolean).join(' ');
};

const getAcademicLevels = (type: 'university' | 'polytechnic' | 'college_of_education') => {
  if (type === 'polytechnic') return ['ND I', 'ND II', 'HND I', 'HND II'];
  if (type === 'college_of_education') return ['NCE I', 'NCE II', 'NCE III', 'Degree 100', 'Degree 200', 'Degree 300', 'Degree 400', 'Degree 500', 'Degree 600', 'Postgraduate'];
  return ['100', '200', '300', '400', '500', '600', 'Postgraduate'];
};
type TeachingAssignment = { courseName: string; courseCode?: string; levels: string[] };
type Step = 1 | 2 | 3 | 4;
const normalizeAcademicLabel = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const matchesAcademicLabel = (label: string, query: string) => { const normalizedLabel = normalizeAcademicLabel(label); const normalizedQuery = normalizeAcademicLabel(query); return !normalizedQuery || normalizedLabel.includes(normalizedQuery) || (normalizedQuery.length >= 4 && normalizedQuery.includes(normalizedLabel)); };
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
  const [institutionType, setInstitutionType] = useState<'university' | 'polytechnic' | 'college_of_education'>('university');
  const [institutionManual, setInstitutionManual] = useState('');
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [catalogueNotice, setCatalogueNotice] = useState('');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [facultyId, setFacultyId] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyManual, setFacultyManual] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentManual, setDepartmentManual] = useState('');
  const [programme, setProgramme] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [courseInput, setCourseInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isLecturer = user?.role === 'lecturer';
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
  const institutionStructureCandidates = useMemo(() => {
    if (!selectedInstitution) return [];
    const selectedType = selectedInstitution.institutionType ?? institutionType;
    const selectedName = normalizeInstitutionName(selectedInstitution.name);
    const match = structureCandidates.find((item) => item.institutionType === selectedType && normalizeInstitutionName(item.institutionName) === selectedName);
    return match?.structures ?? [];
  }, [selectedInstitution, institutionType]);

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

      'faculty of agriculture & agricultural technology': ['Agricultural Economics', 'Agricultural Extension', 'Animal Science', 'Crop Science', 'Fisheries and Aquaculture', 'Forestry and Wildlife Management', 'Soil Science'],
      'faculty of agriculture and forestry': ['Agricultural Economics', 'Agronomy', 'Forest Resources Management'],
      'faculty of allied health sciences': ['Medical Laboratory Science', 'Medical Rehabilitation', 'Nursing Science', 'Radiography'],
      'faculty of allied medical sciences': ['Medical Laboratory Science', 'Medical Rehabilitation', 'Nursing Science', 'Radiography'],
      'faculty of basic clinical sciences': ['Chemical Pathology', 'Haematology', 'Medical Microbiology', 'Pathology', 'Pharmacology'],
      'faculty of dental surgery': ['Child Dental Health', 'Oral and Maxillofacial Surgery', 'Oral Pathology', 'Preventive Dentistry'],
      'faculty of pharmaceutical sciences': ['Clinical Pharmacy', 'Pharmaceutical Chemistry', 'Pharmaceutics', 'Pharmacognosy', 'Pharmacology'],
      'faculty of communication': ['Mass Communication', 'Public Relations'],
      'faculty of communication and information sciences': ['Computer Science', 'Information and Communication Science', 'Library and Information Science', 'Telecommunication Science'],
      'faculty of computing and informatics': ['Computer Science', 'Cyber Security', 'Information Technology', 'Software Engineering'],
      'faculty of computer science and information technology': ['Computer Science', 'Information Technology', 'Software Engineering'],
      'faculty of earth and environmental sciences': ['Architecture', 'Estate Management', 'Geography', 'Geology', 'Quantity Surveying', 'Urban and Regional Planning'],
      'faculty of environmental design and management': ['Architecture', 'Building', 'Estate Management', 'Quantity Surveying', 'Urban and Regional Planning'],
      'faculty of environmental technology': ['Architecture', 'Building Technology', 'Estate Management', 'Quantity Surveying', 'Urban and Regional Planning'],
      'faculty of life sciences': ['Biochemistry', 'Botany', 'Microbiology', 'Plant Biology', 'Zoology'],
      'faculty of natural sciences': ['Biochemistry', 'Biology', 'Chemistry', 'Computer Science', 'Mathematics', 'Physics'],
      'faculty of physical sciences': ['Chemistry', 'Geology', 'Mathematics', 'Physics', 'Statistics'],
      'faculty of management technology': ['Accountancy', 'Business Administration', 'Economics', 'Management Technology'],
      'faculty of administration': ['Accounting', 'Business Administration', 'Public Administration'],
      'faculty of social and management sciences': ['Economics', 'Political Science', 'Public Administration', 'Sociology'],
      'faculty of arts and islamic studies': ['Arabic', 'English', 'History', 'Islamic Studies', 'Linguistics'],
      'faculty of arts and humanities': ['English and Literary Studies', 'History', 'Linguistics', 'Philosophy', 'Religious Studies'],
      'faculty of arts and social sciences': ['Economics', 'English', 'History', 'Political Science', 'Sociology'],
      'faculty of education and arts': ['Arts Education', 'Educational Foundations', 'Language Education', 'Social Science Education'],
      'faculty of science and technology': ['Biochemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Statistics'],
      'faculty of technology education': ['Automobile Technology Education', 'Building Technology Education', 'Electrical/Electronics Technology Education', 'Mechanical Technology Education'],
      'faculty of engineering and engineering technology': ['Agricultural Engineering', 'Chemical Engineering', 'Civil Engineering', 'Computer Engineering', 'Electrical/Electronics Engineering', 'Mechanical Engineering'],
      'faculty of applied sciences': ['Computer Science', 'Food Science and Technology', 'Mathematics', 'Science Laboratory Technology', 'Statistics'],
      'faculty of industrial technology': ['Food Technology', 'Industrial Chemistry', 'Industrial Physics', 'Textile Technology'],
      'faculty of health sciences': ['Community Health', 'Human Nutrition and Dietetics', 'Medical Laboratory Science', 'Nursing Science', 'Public Health'],
      'faculty of health science and technology': ['Environmental Health Science', 'Medical Laboratory Science', 'Nursing Science', 'Public Health'],
      'faculty of nursing sciences': ['Nursing Science'],
      'faculty of agriculture and natural resources': ['Agricultural Economics', 'Animal Science', 'Crop Science', 'Fisheries and Aquaculture', 'Forestry and Wildlife Management'],
      'faculty of food science and technology': ['Food Science and Technology', 'Food Technology', 'Human Nutrition and Dietetics'],
      'faculty of aviation and aerospace engineering': ['Aeronautical Engineering', 'Aircraft Maintenance Engineering', 'Avionics'],
      'school of engineering technology': ['Agricultural Engineering Technology', 'Civil Engineering Technology', 'Computer Engineering Technology', 'Electrical/Electronics Engineering Technology', 'Mechanical Engineering Technology'],
      'school of environmental studies': ['Architectural Technology', 'Building Technology', 'Estate Management', 'Quantity Surveying', 'Urban and Regional Planning'],
      'school of business studies': ['Accountancy', 'Business Administration and Management', 'Marketing', 'Office Technology and Management', 'Public Administration'],
      'school of applied sciences': ['Computer Science', 'Food Technology', 'Science Laboratory Technology', 'Statistics'],
      'school of science and technology': ['Computer Science', 'Mathematics and Statistics', 'Science Laboratory Technology'],
      'school of general and basic studies': ['General Studies', 'Languages', 'Social Sciences'],
      'school of vocational and technical education': ['Agricultural Education', 'Business Education', 'Home Economics Education', 'Technical Education'],
      'school of education': ['Educational Foundations', 'Educational Psychology', 'Curriculum Studies', 'Guidance and Counselling'],
      'college of medical sciences': ['Anatomy', 'Biochemistry', 'Medicine and Surgery', 'Medical Laboratory Science', 'Physiology'],
      'college of health sciences': ['Basic Medical Sciences', 'Clinical Sciences', 'Nursing Science', 'Public Health'],
      'college of engineering and technology': ['Chemical Engineering', 'Civil Engineering', 'Computer Engineering', 'Electrical/Electronics Engineering', 'Mechanical Engineering'],
      'college of computing': ['Computer Science', 'Cyber Security', 'Information Technology', 'Software Engineering'],
      'college of agriculture': ['Agricultural Economics', 'Agronomy', 'Animal Science', 'Crop Science'],
      'college of natural and applied sciences': ['Biochemistry', 'Biology', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics'],
      'college of social and management sciences': ['Accounting', 'Business Administration', 'Economics', 'Political Science', 'Sociology'],
      'college of arts and social sciences': ['Economics', 'English', 'History', 'Political Science', 'Sociology'],
      'college of veterinary medicine': ['Veterinary Anatomy', 'Veterinary Medicine', 'Veterinary Microbiology'],
      'college of pharmacy': ['Pharmacy'],
      'college of law': ['Law'],
      'college of communication and media studies': ['Broadcasting', 'Film and Multimedia Studies', 'Journalism and Media Studies', 'Public Relations'],
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
    for (const candidate of institutionStructureCandidates) {
      const key = candidate.name.trim().toLocaleLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, { name: candidate.name.trim(), departments: new Map() });
      const target = map.get(key)!;
      for (const department of candidate.departments) {
        const departmentKey = department.trim().toLocaleLowerCase();
        if (departmentKey && !target.departments.has(departmentKey)) target.departments.set(departmentKey, { id: departmentKey, name: department.trim() });
      }
    }
    return [...map.values()].map((item) => ({ name: item.name, departments: [...item.departments.values()].sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [institutions, institutionStructureCandidates]);
  const normalizedFacultyQuery = normalizeAcademicLabel(facultySearch);
  const filteredSharedFaculties = useMemo(() => sharedFaculties.filter((item) => matchesAcademicLabel(item.name, facultySearch)), [sharedFaculties, normalizedFacultyQuery]);
  const typedFacultyMatch = facultySearch.trim() ? sharedFaculties.find((item) => normalizeAcademicLabel(item.name) === normalizedFacultyQuery) : undefined;
  const selectedFaculty = sharedFaculties.find((item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(facultyId)) ?? typedFacultyMatch;
  const facultyLookupName = selectedFaculty?.name ?? (facultyId || facultySearch.trim());
  const localSelectedFaculty = selectedInstitution?.faculties?.find((item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(facultyLookupName));
  const candidateSelectedFaculty = institutionStructureCandidates.find((item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(facultyLookupName));
  const departments = localSelectedFaculty?.departments?.length ? localSelectedFaculty.departments : candidateSelectedFaculty?.departments?.map((item) => ({ id: normalizeAcademicLabel(item), name: item })) ?? selectedFaculty?.departments ?? [];
  const normalizedDepartmentQuery = normalizeAcademicLabel(departmentSearch);
  const filteredDepartments = departments.filter((item) => matchesAcademicLabel(item.name, departmentSearch));
  const typedDepartmentMatch = departmentSearch.trim() ? departments.find((item) => normalizeAcademicLabel(item.name) === normalizedDepartmentQuery) : undefined;
  const useManualInstitution = institutionId === '__manual__';
  const useManualFaculty = facultyId === '__manual__';

  useEffect(() => { let active = true; academicApi.institutions().then((data) => { if (active) setInstitutions(Array.isArray(data) ? data : []); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load institutions.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!institutionId || institutionId === '__manual__' || !isLecturer) { setCourses([]); return; } let active = true; academicApi.courses(institutionId).then((data) => { if (active) setCourses(Array.isArray(data) ? data : []); }).catch(() => { if (active) setCourses([]); }); return () => { active = false; }; }, [institutionId, isLecturer]);

  const academicLevels = getAcademicLevels(institutionType);
  const institutionName = useManualInstitution ? institutionManual.trim() : selectedInstitution?.name ?? '';
  const facultyName = useManualFaculty ? facultyManual.trim() : selectedFaculty?.name ?? facultySearch.trim();
  const resolvedDepartmentName = useManualFaculty || department === '__manual__' ? departmentManual.trim() : department.trim() || typedDepartmentMatch?.name || departmentSearch.trim();
  const canContinue = () => { if (step === 1) return useManualInstitution ? Boolean(institutionManual.trim()) : Boolean(institutionId); if (step === 2) return Boolean(facultyName && resolvedDepartmentName); if (isLecturer) return step === 3 ? Boolean(teachingAssignments.length > 0 && teachingAssignments.every((course) => course.levels.length > 0)) : step === 4; return Boolean(programme.trim() && studyLevel); };
  const addCourse = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const match = clean.match(/^([A-Za-z]{2,}[A-Za-z0-9/.-]*\s*\d+[A-Za-z]?)\s*[—-]\s*(.+)$/);
    const courseCode = match?.[1]?.trim();
    const courseName = (match?.[2] ?? clean).trim();
    if (!courseName || teachingAssignments.some((item) => item.courseName.toLowerCase() === courseName.toLowerCase() && (item.courseCode ?? '') === (courseCode ?? ''))) return;
    setTeachingAssignments((current) => [...current, { courseName, ...(courseCode ? { courseCode } : {}), levels: [] }]);
    setCourseInput('');
  };
  const toggleCourseLevel = (courseIndex: number, level: string) => setTeachingAssignments((current) => current.map((course, index) => index !== courseIndex ? course : { ...course, levels: course.levels.includes(level) ? course.levels.filter((item) => item !== level) : [...course.levels, level] }));
  const save = async () => {
    if (!canContinue()) return;
    setSaving(true);
    setError('');
    setCatalogueNotice('');
    try {
      const departmentName = resolvedDepartmentName;
      const pending: string[] = [];

      let institutionSubmissionId: string | undefined;
      if (useManualInstitution && institutionName) {
        const institutionSubmission = await academicApi.submitCatalogueEntry({
          entryType: 'institution',
          name: institutionName,
          institutionType,
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
            (item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(departmentName),
          );
          const departmentExistsInSharedList = departments.some(
            (item) => normalizeAcademicLabel(item.name) === normalizeAcademicLabel(departmentName),
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
          } else if (facultyForInstitution && !departmentExistsLocally && (department === '__manual__' || departmentExistsInSharedList || Boolean(departmentSearch.trim()))) {
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
        programme: isLecturer ? '' : programme.trim(),
        studyLevel: isLecturer ? undefined : studyLevel,
        coursesTaught: isLecturer ? teachingAssignments.map((item) => item.courseCode ? `${item.courseCode} — ${item.courseName}` : item.courseName) : undefined,
        teachingAssignments: isLecturer ? teachingAssignments : undefined,
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
        {step === 1 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 1</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Institution {isLecturer ? 'select / verify' : 'selection'}</h2><p className="mt-2 text-sm text-[#5C6982]">Choose the institution that anchors your academic identity.</p></div><div className="relative"><label className="mb-2 block text-sm font-semibold text-[#091F5B]" htmlFor="institution-type">Institution category</label><select id="institution-type" value={institutionType} onChange={(event) => { setInstitutionType(event.target.value as 'university' | 'polytechnic' | 'college_of_education'); setStudyLevel(''); setInstitutionId(''); setInstitutionManual(''); setFacultyId(''); setFacultySearch(''); setDepartment(''); setDepartmentSearch(''); setFacultyManual(''); setDepartmentManual(''); }} className={fieldClass}><option value="university">Universities</option><option value="polytechnic">Polytechnics</option><option value="college_of_education">Colleges of Education</option></select><label className="mb-2 mt-4 block text-sm font-semibold text-[#091F5B]" htmlFor="institution-picker">Select institution</label><button id="institution-picker" type="button" aria-haspopup="listbox" aria-expanded={institutionDropdownOpen} onClick={() => { setInstitutionDropdownOpen((open) => !open); setInstitutionSearch(''); }} className={`${fieldClass} flex items-center justify-between gap-3 text-left`}><span className={institutionId ? 'text-[#091F5B]' : 'text-[#71809A]'}>{useManualInstitution ? 'My institution is not listed' : selectedInstitution?.name ?? 'Select institution'}</span><span aria-hidden="true" className="text-[#71809A]">▾</span></button>{institutionDropdownOpen && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#DCE4EF] bg-white shadow-xl"><div className="border-b border-[#E8EDF5] p-2"><input autoFocus value={institutionSearch} onChange={(event) => setInstitutionSearch(event.target.value)} placeholder={institutionType === 'university' ? 'Search universities...' : institutionType === 'polytechnic' ? 'Search polytechnics...' : 'Search colleges of education...'} className={fieldClass} aria-label="Search universities" /></div><div role="listbox" aria-label="Imported institutions" className="max-h-64 overflow-y-auto p-1">{filteredInstitutions.length ? filteredInstitutions.map((item) => <button key={item.id} type="button" role="option" aria-selected={institutionId === item.id} onClick={() => { setInstitutionId(item.id); setFacultyId(''); setFacultySearch(''); setDepartment(''); setDepartmentSearch(''); setInstitutionDropdownOpen(false); setInstitutionSearch(''); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[#F3F1FF] ${institutionId === item.id ? 'bg-[#F3F1FF] font-semibold text-[#6121D0]' : 'text-[#091F5B]'}`}><span className="block">{item.name}</span>{(item.state || item.city) && <span className="mt-0.5 block text-xs text-[#71809A]">{[item.state, item.city].filter(Boolean).join(' · ')}</span>}</button>) : <p className="px-3 py-4 text-sm text-[#71809A]">No matching imported institution.</p>}</div><button type="button" role="option" aria-selected={useManualInstitution} onClick={() => { setInstitutionId('__manual__'); setInstitutionManual(institutionSearch); setFacultyId(''); setFacultySearch(''); setDepartment(''); setDepartmentSearch(''); setInstitutionDropdownOpen(false); setInstitutionSearch(''); }} className="w-full border-t border-[#E8EDF5] px-3 py-3 text-left text-sm font-semibold text-[#6121D0] hover:bg-[#F8F6FF]">My institution is not listed</button></div>}</div>{useManualInstitution && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="manual-institution">Enter institution name</label><input id="manual-institution" value={institutionManual} onChange={(event) => setInstitutionManual(event.target.value)} placeholder={institutionType === 'university' ? 'Start typing your university name...' : institutionType === 'polytechnic' ? 'Start typing your polytechnic name...' : 'Start typing your college of education name...'} className={fieldClass} autoComplete="off" />{institutionManual.trim().length >= 2 && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching imported institutions</p>{categoryInstitutions.filter((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())).slice(0, 6).map((item) => <button key={item.id} type="button" onClick={() => { setInstitutionId(item.id); setInstitutionManual(''); setFacultyId(''); setDepartment(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}{!categoryInstitutions.some((item) => item.name.toLocaleLowerCase().includes(institutionManual.trim().toLocaleLowerCase())) && <p className="px-3 py-2 text-sm text-[#71809A]">No imported match yet. You can submit this institution for review.</p>}</div>}</div>}{!institutions.length && <p className="text-sm text-[#5C6982]">No institutions were returned by the catalogue. Enter your institution manually to continue.</p>}</div>}
        {step === 2 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 2</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Faculty & department</h2><p className="mt-2 text-sm text-[#5C6982]">Choose the faculty, school or college that your institution uses.</p></div><div className="space-y-3"><div className="space-y-2"><label htmlFor="faculty-picker" className="block text-sm font-semibold text-[#091F5B]">Faculty / School / College</label><select id="faculty-picker" value={facultyId} disabled={Boolean(facultySearch.trim())} onChange={(event) => { setFacultyId(event.target.value); setFacultySearch(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} aria-label="Faculty, school or college"><option value="">Select faculty / school / college</option>{sharedFaculties.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}<option value="__manual__">My faculty / school / college is not listed</option></select><label htmlFor="faculty-search" className="block text-sm font-medium text-[#5C6982]">Or search / enter your faculty</label><input id="faculty-search" value={facultySearch} disabled={Boolean(facultyId)} onChange={(event) => { setFacultySearch(event.target.value); setFacultyId(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} placeholder="Type your faculty, school or college..." className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} autoComplete="off" /><p className="text-xs text-[#71809A]">Choose from the list above or type below. The two methods are mutually exclusive.</p>{typedFacultyMatch && <p role="status" className="text-xs font-medium text-emerald-700">Matched catalogue entry: {typedFacultyMatch.name}</p>}{facultySearch.trim() && filteredSharedFaculties.length > 0 && !typedFacultyMatch && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching faculties, schools and colleges</p>{filteredSharedFaculties.slice(0, 8).map((item) => <button key={item.name} type="button" onClick={() => { setFacultyId(item.name); setFacultySearch(''); setFacultyManual(''); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}</div>{useManualFaculty && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="manual-faculty">Enter faculty / school / college name</label><input id="manual-faculty" value={facultyManual} onChange={(event) => { setFacultyManual(event.target.value); setDepartment(''); setDepartmentSearch(''); setDepartmentManual(''); }} placeholder="Enter faculty name" className={fieldClass} aria-label="Faculty name" /></div>}{!useManualFaculty && <div className="space-y-2"><label htmlFor="department-picker" className="block text-sm font-semibold text-[#091F5B]">Department</label><select id="department-picker" value={department} disabled={!selectedFaculty || Boolean(departmentSearch.trim())} onChange={(event) => { setDepartment(event.target.value); setDepartmentSearch(''); setDepartmentManual(''); }} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} aria-label="Department"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}<option value="__manual__">My department is not listed</option></select><label htmlFor="department-search" className="block text-sm font-medium text-[#5C6982]">Or search / enter your department</label><input id="department-search" value={departmentSearch} disabled={Boolean(department)} onChange={(event) => { setDepartmentSearch(event.target.value); setDepartment(''); setDepartmentManual(''); }} placeholder={selectedFaculty ? "Type your department..." : "Enter your department..."} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[#F3F6FC] disabled:text-[#9AA6B8]`} autoComplete="off" /><p className="text-xs text-[#71809A]">Choose from the department list or type below. Matching names are linked to the catalogue entry.</p>{typedDepartmentMatch && <p role="status" className="text-xs font-medium text-emerald-700">Matched catalogue entry: {typedDepartmentMatch.name}</p>}{departmentSearch.trim() && filteredDepartments.length > 0 && !typedDepartmentMatch && <div className="rounded-xl border border-[#DCE4EF] bg-white p-2 shadow-sm"><p className="px-2 py-1 text-xs text-[#71809A]">Matching departments</p>{filteredDepartments.slice(0, 8).map((item) => <button key={item.id} type="button" onClick={() => { setDepartment(item.name); setDepartmentSearch(''); setDepartmentManual(''); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}{department === '__manual__' && <input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={fieldClass} aria-label="Department name" />}</div>}{useManualFaculty && <div className="space-y-2"><label className="block text-sm font-semibold text-[#091F5B]">Department</label><input value={departmentManual} onChange={(event) => setDepartmentManual(event.target.value)} placeholder="Enter department name" className={fieldClass} aria-label="Department name" /></div>}</div></div>}
        {!isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Course of study / Department & level</h2><p className="mt-2 text-sm text-[#5C6982]">Enter your course of study so resource discovery can be scoped correctly.</p></div><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-course-of-study">Course of study / Department<input id="student-course-of-study" value={programme} onChange={(event) => setProgramme(event.target.value)} placeholder="e.g. Computer Science or Medicine and Surgery" className={`${fieldClass} mt-2`} aria-label="Course of study / Department" /></label><p className="-mt-3 text-xs leading-5 text-[#71809A]">Enter your course of study or academic discipline.</p><label className="block text-sm font-semibold text-[#091F5B]" htmlFor="student-level">Current academic level<select id="student-level" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)} className={`${fieldClass} mt-2`} aria-label="Current academic level"><option value="">Select your current level</option>{academicLevels.map((level) => <option key={level} value={level}>{level.includes('Degree ') ? `${level} level` : level === 'Postgraduate' ? 'Postgraduate' : level.includes('level') ? level : `${level} level`}</option>)}</select></label></div>}
        {isLecturer && step === 3 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 3</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Courses taught</h2><p className="mt-2 text-sm text-[#5C6982]">Add the specific course titles or codes you teach, then select the academic levels for each course.</p></div><p className="text-xs leading-5 text-[#71809A]">Add the specific course titles or codes you teach.</p>{courses.length > 0 && <select onChange={(event) => { if (event.target.value) addCourse(event.target.value); }} className={fieldClass} aria-label="Course catalogue"><option value="">Add a course from the catalogue</option>{courses.map((course) => <option key={course.id} value={course.code ? `${course.code} — ${course.title}` : course.title}>{course.code ? `${course.code} — ${course.title}` : course.title}</option>)}</select>}<div className="flex gap-2"><input value={courseInput} onChange={(event) => setCourseInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCourse(courseInput); } }} placeholder="e.g. CSC 301 — Data Structures" className={`${fieldClass} min-w-0 flex-1`} /><button type="button" onClick={() => addCourse(courseInput)} className="rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white hover:bg-[#5120B0]">Add</button></div><div className="flex flex-wrap gap-2">{teachingAssignments.map((course, index) => <div key={`${course.courseCode ?? ''}-${course.courseName}-${index}`} className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-[#091F5B]">{course.courseName}</p>{course.courseCode && <p className="text-xs text-[#71809A]">{course.courseCode}</p>}</div><button type="button" onClick={() => setTeachingAssignments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-sm font-semibold text-rose-600">Remove</button></div>
          <p className="mt-3 text-xs font-semibold text-[#5C6982]">Academic level(s) taught in this course</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{academicLevels.map((level) => <label key={level} className="flex items-center gap-2 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm text-[#091F5B]"><input type="checkbox" checked={course.levels.includes(level)} onChange={() => toggleCourseLevel(index, level)} className="accent-[#6121D0]" />{level}</label>)}</div>
          {!course.levels.length && <p className="mt-2 text-xs text-amber-700">Select at least one level for this course.</p>}
        </div>)}</div></div>}
        {isLecturer && step === 4 && <div className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6121D0]">Step 4</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Verify your academic identity</h2><p className="mt-2 text-sm text-[#5C6982]">Review the academic details that establish your teaching profile and help identify the students whose academic pathway aligns with yours.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['Institution', institutionName], ['Faculty', facultyName], ['Department', (useManualFaculty || department === '__manual__') ? departmentManual : department], ['Courses taught', teachingAssignments.map((course) => `${course.courseCode ? `${course.courseCode} — ` : ''}${course.courseName} (${course.levels.join(', ') || 'No level selected'})`).join('; ') || 'None']].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFD] p-4"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71809A]">{label}</div><div className="mt-2 text-sm font-medium text-[#091F5B]">{value}</div></div>)}</div></div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} disabled={step === 1 || saving} className="rounded-xl border border-[#DCE4EF] px-5 py-3 font-medium text-[#091F5B] hover:border-[#6121D0] disabled:opacity-40">Back</button>{step < totalSteps ? <button type="button" onClick={() => canContinue() && setStep((current) => Math.min(totalSteps, current + 1) as Step)} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">Continue</button> : <button type="button" onClick={() => void save()} disabled={!canContinue() || saving} className="rounded-xl bg-[#6121D0] px-5 py-3 font-semibold text-white hover:bg-[#5120B0] disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving profile…' : isLecturer ? 'Enter lecturer dashboard' : 'Enter student dashboard'}</button>}</div>
      </>}
    </section>
  </div></main>;
}
