import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourcesApi } from '../api/resources';
import { uploadApi } from '../api/upload';
import { useAuth } from '../context/AuthContext';
import { resourceUploadSchema, type ResourceUploadValues } from '../lib/resourceValidation';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', txt: 'text/plain',
};
const ACCEPTED_TYPES = Object.keys(MIME_BY_EXTENSION).map((extension) => '.' + extension).join(',');

function fileMimeType(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const expected = MIME_BY_EXTENSION[extension];
  if (!expected || (file.type && file.type !== expected && file.type !== 'application/octet-stream')) return null;
  return expected;
}

export function UploadPage() {
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ResourceUploadValues>({ resolver: zodResolver(resourceUploadSchema), defaultValues: { title: '', description: '', course: '', topic: '', institution: '', level: '', type: 'lecture_notes', fileUrl: '', tags: '' } });

  const onChooseFile = (file?: File) => {
    setFileError(null); setSuccessMessage(null);
    if (!file) { setSelectedFile(null); return; }
    if (!fileMimeType(file)) { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; setFileError('Choose a PDF, Word, PowerPoint, or plain-text file.'); return; }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; setFileError('The file must be smaller than or equal to 50 MB.'); return; }
    setSelectedFile(file);
  };

  const onSubmit = async (values: ResourceUploadValues) => {
    if (!isAuthenticated) { setSubmitError('Your session is not active. Sign in again before submitting.'); return; }
    if (fileError) return;
    try {
      setSubmitError(null); setSuccessMessage(null);
      const resource = await resourcesApi.create({ title: values.title.trim(), description: values.description.trim(), course: values.course.trim(), topic: values.topic.trim(), institution: values.institution.trim() || user?.institution || '', level: values.level.trim(), type: values.type, ...(values.fileUrl?.trim() ? { fileUrl: values.fileUrl.trim() } : {}), tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean) });
      const resourceId = typeof resource?.id === 'string' ? resource.id : '';
      if (!resourceId) throw new Error('The server did not return the saved resource ID. Please contact support before retrying to avoid duplicate records.');
      if (selectedFile) {
        const mimetype = fileMimeType(selectedFile);
        if (!mimetype) throw new Error('The selected file type is not supported.');
        const upload = await uploadApi.presign({ resourceId, filename: selectedFile.name, mimetype, size: selectedFile.size });
        const putResponse = await fetch(upload.presignedUrl, { method: 'PUT', headers: { 'Content-Type': mimetype }, body: selectedFile });
        if (!putResponse.ok) throw new Error('The resource record was saved, but storage rejected the file upload. Please contact support before retrying.');
        await uploadApi.complete({ key: upload.key, resourceId, mimetype, size: selectedFile.size });
      }
      setSuccessMessage(selectedFile ? 'Resource and file uploaded successfully. Your resource is awaiting moderator review.' : 'Resource submitted successfully. Your resource is awaiting moderator review.');
      reset({ title: '', description: '', course: '', topic: '', institution: user?.institution ?? '', level: '', type: 'lecture_notes', fileUrl: '', tags: '' });
      setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed. Please try again.');
    }
  };

  const inputClass = 'brand-input';
  return <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-6 border-b border-[#E5E7EB] pb-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Lecturer workspace · Resource submission</p><h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Submit an academic resource</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">Add resource details and attach a document, or provide a secure HTTPS link. Submissions enter moderator review.</p></div>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div><label htmlFor="resource-title" className="mb-2 block text-sm font-semibold text-[#091F5B]">Title</label><input id="resource-title" {...register('title')} className={inputClass} aria-invalid={Boolean(errors.title)} />{errors.title && <p className="mt-1 text-sm text-red-700">{errors.title.message}</p>}</div>
        <div><label htmlFor="resource-type" className="mb-2 block text-sm font-semibold text-[#091F5B]">Resource type</label><select id="resource-type" {...register('type')} className={inputClass}><option value="lecture_notes">Lecture Notes</option><option value="past_question">Past Question</option><option value="research_paper">Research Paper</option><option value="project">Project</option><option value="slides">Slides</option><option value="other">Other</option></select>{errors.type && <p className="mt-1 text-sm text-red-700">{errors.type.message}</p>}</div>
        <div><label htmlFor="resource-course" className="mb-2 block text-sm font-semibold text-[#091F5B]">Course taught</label><input id="resource-course" {...register('course')} placeholder="e.g. CSC 101" className={inputClass} aria-invalid={Boolean(errors.course)} />{errors.course && <p className="mt-1 text-sm text-red-700">{errors.course.message}</p>}</div>
        <div><label htmlFor="resource-topic" className="mb-2 block text-sm font-semibold text-[#091F5B]">Topic</label><input id="resource-topic" {...register('topic')} className={inputClass} aria-invalid={Boolean(errors.topic)} />{errors.topic && <p className="mt-1 text-sm text-red-700">{errors.topic.message}</p>}</div>
        <div><label htmlFor="resource-institution" className="mb-2 block text-sm font-semibold text-[#091F5B]">Institution</label><input id="resource-institution" {...register('institution')} placeholder={user?.institution || 'Your institution'} className={inputClass} aria-invalid={Boolean(errors.institution)} />{errors.institution && <p className="mt-1 text-sm text-red-700">{errors.institution.message}</p>}</div>
        <div><label htmlFor="resource-level" className="mb-2 block text-sm font-semibold text-[#091F5B]">Level</label><input id="resource-level" {...register('level')} placeholder="e.g. 200 level" className={inputClass} aria-invalid={Boolean(errors.level)} />{errors.level && <p className="mt-1 text-sm text-red-700">{errors.level.message}</p>}</div>
        <div className="md:col-span-2"><label htmlFor="resource-file" className="mb-2 block text-sm font-semibold text-[#091F5B]">Attach document (optional if a file URL is supplied)</label><input ref={fileInputRef} id="resource-file" type="file" accept={ACCEPTED_TYPES} onChange={(event) => onChooseFile(event.currentTarget.files?.[0])} className={inputClass + ' file:mr-4 file:rounded-lg file:border-0 file:bg-[#004BEC] file:px-3 file:py-2 file:font-semibold file:text-white'} aria-describedby="resource-file-help" /><p id="resource-file-help" className="mt-1 text-xs text-[#4B5563]">PDF, Word, PowerPoint, or TXT · Maximum 50 MB.</p>{selectedFile && <p className="mt-1 text-sm text-[#1F2937]">Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</p>}{fileError && <p role="alert" className="mt-1 text-sm text-red-700">{fileError}</p>}</div>
        <div className="md:col-span-2"><label htmlFor="resource-file-url" className="mb-2 block text-sm font-semibold text-[#091F5B]">External resource file URL (optional)</label><input id="resource-file-url" type="url" {...register('fileUrl')} placeholder="https://…" className={inputClass} aria-describedby="resource-url-help" />{errors.fileUrl && <p className="mt-1 text-sm text-red-700">{errors.fileUrl.message}</p>}<p id="resource-url-help" className="mt-1 text-xs text-[#4B5563]">Use HTTPS for a file hosted in storage you control. If you attach a file, it will be uploaded instead.</p></div>
        <div className="md:col-span-2"><label htmlFor="resource-description" className="mb-2 block text-sm font-semibold text-[#091F5B]">Description</label><textarea id="resource-description" {...register('description')} rows={5} className={inputClass} aria-invalid={Boolean(errors.description)} />{errors.description && <p className="mt-1 text-sm text-red-700">{errors.description.message}</p>}</div>
        <div className="md:col-span-2"><label htmlFor="resource-tags" className="mb-2 block text-sm font-semibold text-[#091F5B]">Tags</label><input id="resource-tags" {...register('tags')} placeholder="ai, revision, engineering" className={inputClass} aria-describedby="resource-tags-help" /><p id="resource-tags-help" className="mt-1 text-xs text-[#4B5563]">Separate tags with commas. Example: ai, revision, engineering.</p></div>
      </div>
      {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}
      {successMessage && <p role="status" className="rounded-xl border border-blue-200 bg-[#F3F6FC] p-3 text-sm text-[#091F5B]">{successMessage}</p>}
      {!isAuthenticated && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your session is not active. Sign in with a lecturer account to submit a resource.</p>}
      <button type="submit" disabled={isSubmitting || !isAuthenticated || Boolean(fileError)} className="brand-button w-full px-4 py-3 font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Uploading and submitting…' : 'Submit for moderator review'}</button>
    </form>
  </div>;
}
