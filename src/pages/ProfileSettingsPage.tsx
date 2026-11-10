import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, LogOut, Pencil, Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileImageApi } from '../api/upload';
import { AdminProfilePage } from './AdminProfilePage';
import { apiRequest } from '../lib/api/client';
import { academicApi, type InstitutionOption, type TeachingAssignmentPayload } from '../api/academic';

const normalizeAcademicHandle = (value: string) => value.trim().replace(/^@+/, '').toLowerCase();
const academicHandleError = (value: string) => {
  const handle = normalizeAcademicHandle(value);
  if (handle.length < 3) return 'Username must be at least 3 characters.';
  if (handle.length > 30) return 'Username must be 30 characters or fewer.';
  if (!/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])$/.test(handle)) return 'Start and end with a letter or number; use only lowercase letters, numbers, periods, and underscores.';
  return '';
};

export function ProfileSettingsPage() {
  const { user, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ institution: '', faculty: '', department: '', programme: '', studyLevel: '', coursesTaught: '', bio: '', handle: '' });
  const [academicInstitutions, setAcademicInstitutions] = useState<InstitutionOption[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueSubmitting, setCatalogueSubmitting] = useState(false);
  const [facultyFocused, setFacultyFocused] = useState(false);
  const [departmentFocused, setDepartmentFocused] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignmentPayload[]>([]);
  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingCourses, setEditingCourses] = useState(false);
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
    let active = true;
    academicApi.institutions()
      .then((items) => { if (active) setAcademicInstitutions(items); })
      .catch(() => { if (active) setError('Unable to load the academic catalogue. Please try again later.'); })
      .finally(() => { if (active) setCatalogueLoading(false); });
    return () => { active = false; };
  }, []);

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
    setTeachingAssignments(user.teachingAssignments?.length ? user.teachingAssignments.map((item) => ({ courseName: item.courseName, courseCode: item.courseCode ?? '', levels: [...item.levels] })) : (user.coursesTaught ?? []).map((course) => { const separator = course.indexOf(' — '); return separator > 0 ? { courseName: course.slice(separator + 3).trim(), courseCode: course.slice(0, separator).trim(), levels: [] } : { courseName: course, courseCode: '', levels: [] }; }));
  }, [user]);

  if (!user) return null;
  if (user.role === 'moderator' || user.role === 'admin') return <AdminProfilePage />;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectedInstitution = academicInstitutions.find((item) => item.name.trim().toLocaleLowerCase() === form.institution.trim().toLocaleLowerCase());
  const facultyOptions = selectedInstitution?.faculties ?? [];
  const selectedFaculty = facultyOptions.find((item) => item.name.trim().toLocaleLowerCase() === form.faculty.trim().toLocaleLowerCase());
  const departmentOptions = selectedFaculty?.departments ?? [];
  const saveAcademicPlacement = async () => {
    const facultyName = form.faculty.trim();
    const departmentName = form.department.trim();
    if (!selectedInstitution || !facultyName || !departmentName) {
      setError('Select an approved institution and enter both your faculty and department.');
      return false;
    }
    const selectedDepartment = departmentOptions.find((item) => item.name.trim().toLocaleLowerCase() === departmentName.toLocaleLowerCase());
    setSavingField('faculty');
    setCatalogueSubmitting(true);
    setMessage('');
    setError('');
    try {
      let pendingFacultyId: string | undefined;
      if (!selectedFaculty) {
        const pendingFaculty = await academicApi.submitCatalogueEntry({
          entryType: 'faculty', name: facultyName, parentInstitutionId: selectedInstitution.id,
        }) as { id?: string };
        pendingFacultyId = pendingFaculty?.id;
        if (!pendingFacultyId) throw new Error('Faculty submission was not confirmed. Please try again.');
      }
      if (!selectedDepartment) {
        await academicApi.submitCatalogueEntry({
          entryType: 'department',
          name: departmentName,
          parentInstitutionId: selectedInstitution.id,
          ...(selectedFaculty ? { parentFacultyId: selectedFaculty.id } : { parentFacultySubmissionId: pendingFacultyId }),
        });
      }
      await apiRequest(`/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          institution: selectedInstitution.name,
          faculty: selectedFaculty?.name ?? facultyName,
          department: selectedDepartment?.name ?? departmentName,
          ...(user.role === 'student' ? { programme: form.programme.trim() } : {}),
        }),
      });
      await refreshSession();
      setEditingInstitution(false);
      const hasPending = !selectedFaculty || !selectedDepartment;
      setMessage(hasPending
        ? `Your institution and academic placement are saved and active now. Any missing faculty or department was sent to moderators/admins for catalogue review. ${user.role === 'student' ? 'Your Student Group Chat now uses the new institution, faculty and department; programme does not affect group membership.' : 'Your academic sections use the new placement.'} Review does not block access.`
        : `Academic placement updated successfully. ${user.role === 'student' ? 'Your Student Group Chat now uses institution, faculty and department; programme remains a separate profile field.' : 'Your academic sections use the selected institution, faculty and department.'}`);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update academic placement.');
      return false;
    } finally { setSavingField(null); setCatalogueSubmitting(false); }
  };
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
      const academicSaved = await saveAcademicPlacement();
      if (!academicSaved) return;
      if (user.role === 'lecturer' && teachingAssignments.some((item) => !item.courseName.trim() || !item.courseCode?.trim() || item.levels.length === 0)) {
        setError('Complete the course title, course code and level for every teaching assignment before saving all changes.');
        return;
      }
      const coursesTaught = teachingAssignments.map((item) => item.courseCode ? `${item.courseCode} — ${item.courseName}` : item.courseName);
      await apiRequest(`/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(user.role === 'student' ? { programme: form.programme.trim(), studyLevel: form.studyLevel.trim() } : { teachingAssignments, coursesTaught }),
          bio: form.bio.trim(),
          academicHandle: normalizeAcademicHandle(form.handle),
        }),
      });
      await refreshSession();
      const pendingPlacement = !selectedFaculty || !departmentOptions.some((item) => item.name.trim().toLocaleLowerCase() === form.department.trim().toLocaleLowerCase());
      setMessage(pendingPlacement
        ? 'Profile updated. Your new academic placement is active while the missing catalogue entries await moderator/admin review.'
        : 'Profile updated successfully.');
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
        <div className="space-y-3 sm:col-span-2 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="profile-institution" className="block text-sm font-semibold text-[#091F5B]">Institution</label>
              <button type="button" onClick={() => { if (editingInstitution) { setForm((current) => ({ ...current, institution: user.institution ?? '', faculty: user.faculty ?? '', department: user.department ?? '' })); setEditingInstitution(false); } else { setForm((current) => ({ ...current, institution: user.institution ?? '', faculty: user.faculty ?? '', department: user.department ?? '' })); setEditingInstitution(true); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4EF] bg-white px-3 py-2 text-sm font-semibold text-[#6121D0] transition hover:border-[#6121D0] hover:bg-[#F8F5FF]">
                <Pencil size={14}/>{editingInstitution ? 'Close edit' : 'Edit institution'}
              </button>
            </div>
            {editingInstitution ? <>
              <select id="profile-institution" value={form.institution} disabled={catalogueLoading} onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value, faculty: '', department: '' }))} className="brand-input" aria-label="Select institution">
                <option value="">Select an approved institution</option>
                {[...academicInstitutions].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
              <p className="mt-1 text-xs leading-5 text-[#5C6982]">Choose an institution from the approved catalogue. You must also select a faculty/school/college and department belonging to it. Your Student Group Chat placement changes only after the academic placement is saved.</p>
              <button type="button" onClick={() => { setForm((current) => ({ ...current, institution: user.institution ?? '', faculty: user.faculty ?? '', department: user.department ?? '' })); setEditingInstitution(false); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#5C6982] hover:text-[#091F5B]"><X size={13}/>Cancel institution change</button>
            </> : <input id="profile-institution" value={user.institution ?? 'Not set'} readOnly aria-readonly="true" className="brand-input cursor-not-allowed bg-[#EEF2F8]" />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-faculty" className="mb-2 block text-sm font-semibold text-[#091F5B]">Faculty / School / College</label>
              <input id="profile-faculty" value={form.faculty} disabled={catalogueLoading || !selectedInstitution} onFocus={() => setFacultyFocused(true)} onBlur={() => window.setTimeout(() => setFacultyFocused(false), 140)} onChange={(event) => setForm((current) => ({ ...current, faculty: event.target.value, department: '' }))} placeholder="Type or choose faculty / school" className="brand-input" autoComplete="off" role="combobox" aria-expanded={facultyFocused && facultyOptions.length > 0} aria-controls="profile-faculty-suggestions" />
              {facultyFocused && form.faculty.trim() && facultyOptions.filter((item) => item.name.toLocaleLowerCase().includes(form.faculty.trim().toLocaleLowerCase())).slice(0, 8).length > 0 && <div id="profile-faculty-suggestions" role="listbox" className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#DCE4EF] bg-white p-1 shadow-lg">{facultyOptions.filter((item) => item.name.toLocaleLowerCase().includes(form.faculty.trim().toLocaleLowerCase())).slice(0, 8).map((item) => <button key={item.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => { setForm((current) => ({ ...current, faculty: item.name, department: '' })); setFacultyFocused(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}
              {!catalogueLoading && form.faculty.trim() && !selectedFaculty && <p className="mt-1 text-xs leading-5 text-amber-700">This faculty is not in the imported catalogue. Save academic placement to submit it for moderator/admin review. You can enter the department below now.</p>}
            </div>
            <div>
              <label htmlFor="profile-department" className="mb-2 block text-sm font-semibold text-[#091F5B]">Department</label>
              <input id="profile-department" value={form.department} disabled={!form.faculty.trim() || catalogueLoading} onFocus={() => setDepartmentFocused(true)} onBlur={() => window.setTimeout(() => setDepartmentFocused(false), 140)} onChange={(event) => update('department', event.target.value)} placeholder={form.faculty.trim() ? 'Type or choose department' : 'Enter faculty first'} className="brand-input" autoComplete="off" role="combobox" aria-expanded={departmentFocused && departmentOptions.length > 0} aria-controls="profile-department-suggestions" />
              {departmentFocused && form.department.trim() && departmentOptions.filter((item) => item.name.toLocaleLowerCase().includes(form.department.trim().toLocaleLowerCase())).slice(0, 8).length > 0 && <div id="profile-department-suggestions" role="listbox" className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#DCE4EF] bg-white p-1 shadow-lg">{departmentOptions.filter((item) => item.name.toLocaleLowerCase().includes(form.department.trim().toLocaleLowerCase())).slice(0, 8).map((item) => <button key={item.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => { update('department', item.name); setDepartmentFocused(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#091F5B] hover:bg-[#F3F1FF]">{item.name}</button>)}</div>}
              {form.department.trim() && !departmentOptions.some((item) => item.name.toLocaleLowerCase() === form.department.trim().toLocaleLowerCase()) && <p className="mt-1 text-xs leading-5 text-amber-700">This department is not in the selected faculty's imported catalogue. It will be submitted under the faculty for moderator/admin review when you save.</p>}
            </div>
          </div>
          <p className="text-xs leading-5 text-[#5C6982]">Choose a matching imported suggestion when available. New faculty and department entries are submitted together for moderator/admin review. Group Chat membership uses institution, faculty/school/college and department only; programme is stored separately.</p>
          <div className="flex justify-end"><button type="button" onClick={() => void saveAcademicPlacement()} disabled={savingField !== null || catalogueSubmitting || !form.faculty.trim() || !form.department.trim() || !selectedInstitution} className="rounded-lg bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingField === 'faculty' || catalogueSubmitting ? 'Saving…' : 'Save academic placement'}</button></div>
        </div>
        {user.role === 'student' && textField('programme', 'Programme / Course of Study', 'e.g. B.Sc. Computer Science')}
        {user.role === 'student' && textField('studyLevel', 'Study level', 'e.g. 300 level')}
        {user.role === 'lecturer' && <div className="space-y-3 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="text-sm font-semibold text-[#091F5B]">Courses taught</h3><p className="mt-1 text-xs text-[#5C6982]">Each course has its own title, course code and level.</p></div>
            <button type="button" onClick={() => setEditingCourses((current) => !current)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#6121D0] hover:bg-[#F8F5FF]"><Pencil size={14}/>{editingCourses ? 'Close edit' : 'Edit courses'}</button>
          </div>
          {!editingCourses ? <div className="space-y-3">
            {teachingAssignments.length ? teachingAssignments.map((course, index) => <article key={`course-view-${index}`} className="rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71809A]">Course {index + 1}</p>
              <p className="mt-1 font-semibold text-[#091F5B]">{course.courseName || 'Untitled course'}</p>
              <p className="mt-1 text-sm text-[#5C6982]">{course.courseCode || 'No course code'} · {(course.levels ?? []).join(', ') || 'No level selected'}</p>
            </article>) : <p className="rounded-xl border border-dashed border-[#DCE4EF] p-4 text-sm text-[#5C6982]">No teaching courses have been added yet.</p>}
          </div> : <>
            <div className="flex justify-end"><button type="button" onClick={() => setTeachingAssignments((current) => [...current, { courseName: '', courseCode: '', levels: [] }])} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4EF] px-3 py-2 text-sm font-semibold text-[#6121D0] hover:bg-[#F8F5FF]"><Plus size={15}/>Add another course</button></div>
            {teachingAssignments.map((course, index) => <div key={`course-edit-${index}`} className="space-y-3 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] p-4">
              <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold text-[#091F5B]">Course {index + 1}</h4><button type="button" onClick={() => setTeachingAssignments((current) => current.filter((_, i) => i !== index))} className="text-xs font-semibold text-rose-600">Remove course</button></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="min-w-0 text-xs font-semibold text-[#5C6982]">Course title<input value={course.courseName} onChange={(event) => setTeachingAssignments((current) => current.map((item, i) => i === index ? { ...item, courseName: event.target.value } : item))} placeholder="e.g. Data Structures" className="brand-input mt-1" /></label>
                <label className="min-w-0 text-xs font-semibold text-[#5C6982]">Course code<input value={course.courseCode ?? ''} onChange={(event) => setTeachingAssignments((current) => current.map((item, i) => i === index ? { ...item, courseCode: event.target.value.toUpperCase() } : item))} placeholder="e.g. CSC 301" className="brand-input mt-1" /></label>
                <label className="min-w-0 text-xs font-semibold text-[#5C6982]">Course level<select value={course.levels[0] ?? ''} onChange={(event) => setTeachingAssignments((current) => current.map((item, i) => i === index ? { ...item, levels: event.target.value ? [event.target.value] : [] } : item))} className="brand-input mt-1"><option value="">Select level</option>{['100','200','300','400','500','600','Postgraduate','ND I','ND II','HND I','HND II','NCE I','NCE II','NCE III','Degree 100','Degree 200','Degree 300','Degree 400','Degree 500','Degree 600'].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
              </div>
            </div>)}
            <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setTeachingAssignments(user.teachingAssignments?.length ? user.teachingAssignments.map((item) => ({ courseName: item.courseName, courseCode: item.courseCode ?? '', levels: [...item.levels] })) : (user.coursesTaught ?? []).map((course) => { const separator = course.indexOf(' — '); return separator > 0 ? { courseName: course.slice(separator + 3).trim(), courseCode: course.slice(0, separator).trim(), levels: [] } : { courseName: course, courseCode: '', levels: [] }; })); setEditingCourses(false); }} className="rounded-lg border border-[#DCE4EF] px-4 py-2.5 text-sm font-semibold text-[#5C6982]">Cancel</button>
              <button type="button" disabled={savingField !== null || teachingAssignments.some((item) => !item.courseName.trim() || !item.courseCode?.trim() || item.levels.length === 0)} onClick={async () => { setSavingField('coursesTaught'); setError(''); setMessage(''); try { const coursesTaught = teachingAssignments.map((item) => item.courseCode ? `${item.courseCode} — ${item.courseName}` : item.courseName); await apiRequest(`/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', body: JSON.stringify({ teachingAssignments, coursesTaught }) }); await refreshSession(); setEditingCourses(false); setMessage('Teaching courses saved successfully.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save teaching courses.'); } finally { setSavingField(null); } }} className="rounded-lg bg-[#6121D0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savingField === 'coursesTaught' ? 'Saving…' : 'Save courses'}</button></div>
          </>}
        </div>}
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
