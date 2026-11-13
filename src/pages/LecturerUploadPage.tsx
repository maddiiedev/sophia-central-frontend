import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourcesApi } from '../api/resources';
import { uploadApi } from '../api/upload';
import { useAuth } from '../context/AuthContext';
import { resourceUploadSchema, type ResourceUploadValues } from '../lib/resourceValidation';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PENDING_UPLOAD_STORAGE_KEY = 'sophia-central.pending-lecturer-resource-upload.v1';
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

type PendingUpload = {
  resourceId: string;
  filename: string;
  mimetype: string;
  size: number;
};

function readPendingUpload(): PendingUpload | null {
  try {
    const raw = window.localStorage.getItem(PENDING_UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingUpload>;
    if (
      typeof value.resourceId === 'string' &&
      typeof value.filename === 'string' &&
      typeof value.mimetype === 'string' &&
      Number.isInteger(value.size) &&
      Number(value.size) > 0
    ) return value as PendingUpload;
  } catch {
    // Continue without a saved retry record if browser storage is unavailable.
  }
  return null;
}

function savePendingUpload(value: PendingUpload | null) {
  try {
    if (value) window.localStorage.setItem(PENDING_UPLOAD_STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(PENDING_UPLOAD_STORAGE_KEY);
  } catch {
    // In-memory retry remains available when browser storage is disabled.
  }
}

export function LecturerUploadPage() {
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(() => readPendingUpload());
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ResourceUploadValues>({
    resolver: zodResolver(resourceUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      course: '',
      topic: '',
      institution: '',
      level: '',
      type: 'lecture_notes',
      license: 'CC-BY-4.0',
      attribution: '',
      rightsConfirmed: false,
      tags: '',
    },
  });

  const clearPendingUpload = () => {
    savePendingUpload(null);
    setPendingUpload(null);
  };

  const finishSubmission = () => {
    clearPendingUpload();
    setAttachment(null);
    setSuccess('Your resource has been submitted for moderator review.');
    reset({
      title: '',
      description: '',
      course: '',
      topic: '',
      institution: user?.institution || '',
      level: '',
      type: 'lecture_notes',
      license: 'CC-BY-4.0',
      attribution: '',
      rightsConfirmed: false,
      tags: '',
    });
  };

  const retryPendingUpload = async () => {
    setError('');
    setSuccess('');
    if (!pendingUpload) return;
    if (!attachment) {
      setError('This resource record already exists. Re-select the original attachment to retry its upload; do not submit the resource again.');
      return;
    }
    if (
      attachment.name !== pendingUpload.filename ||
      attachment.type !== pendingUpload.mimetype ||
      attachment.size !== pendingUpload.size
    ) {
      setError('Select the exact original file again. The existing resource record will not be duplicated.');
      return;
    }
    try {
      await uploadApi.uploadResourceFile(pendingUpload.resourceId, attachment);
      finishSubmission();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Attachment retry failed. Your resource record is preserved; select the file and retry again.');
    }
  };

  const submit = async (values: ResourceUploadValues) => {
    setError('');
    setSuccess('');
    try {
      if (!isAuthenticated || user?.role !== 'lecturer') {
        throw new Error('Sign in with a lecturer account to submit a lecturer resource.');
      }
      if (pendingUpload) {
        await retryPendingUpload();
        return;
      }
      if (attachment) {
        if (!ALLOWED_FILE_TYPES.has(attachment.type)) {
          throw new Error('Unsupported file type. Upload a PDF, Word, PowerPoint, or plain-text file.');
        }
        if (attachment.size < 1 || attachment.size > MAX_FILE_SIZE) {
          throw new Error('The attachment must be between 1 byte and 50 MB.');
        }
      }

      const result = await resourcesApi.create({
        title: values.title.trim(),
        description: values.description.trim(),
        course: values.course.trim(),
        topic: values.topic.trim(),
        institution: values.institution.trim() || user.institution || '',
        level: values.level.trim(),
        type: values.type,
        license: values.license,
        attribution: values.attribution.trim(),
        rightsConfirmed: values.rightsConfirmed,
        tags: (values.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
      });
      const resourceId = typeof result.id === 'string' ? result.id : '';
      if (!resourceId) throw new Error('The server did not return a resource ID.');

      if (attachment) {
        const pending = {
          resourceId,
          filename: attachment.name,
          mimetype: attachment.type,
          size: attachment.size,
        };
        savePendingUpload(pending);
        setPendingUpload(pending);
        try {
          await uploadApi.uploadResourceFile(resourceId, attachment);
        } catch (uploadError) {
          throw new Error('Resource ' + resourceId + ' was created, but its attachment did not finish. ' + (uploadError instanceof Error ? uploadError.message : 'Retry the attachment.') + ' Re-select the same file and use “Retry attachment upload”; do not create another resource.');
        }
      }

      finishSubmission();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Resource submission failed.');
    }
  };

  const field = 'brand-input';
  return <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-6 border-b border-[#E5E7EB] pb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6121D0]">Lecturer workspace · Resource submission</p>
      <h2 className="mt-2 text-2xl font-bold text-[#091F5B]">Submit an academic resource</h2>
      <p className="mt-2 text-sm leading-6 text-[#4B5563]">Add the details of your teaching or research material and attach its file. Your submission enters moderator review before it can appear in the shared library.</p>
    </div>
    {pendingUpload && <div role="status" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Attachment upload needs to be completed</p>
      <p className="mt-1">Resource record: {pendingUpload.resourceId}</p>
      <p className="mt-1">Re-select <strong>{pendingUpload.filename}</strong> ({(pendingUpload.size / (1024 * 1024)).toFixed(2)} MB). Your resource will not be recreated.</p>
    </div>}
    <form onSubmit={event => {
      if (pendingUpload) {
        event.preventDefault();
        void retryPendingUpload();
      } else {
        void handleSubmit(submit)(event);
      }
    }} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div><label htmlFor="lecturer-resource-title" className="mb-2 block text-sm font-semibold text-[#091F5B]">Title</label><input id="lecturer-resource-title" disabled={Boolean(pendingUpload)} {...register('title')} className={field} aria-invalid={Boolean(errors.title)} />{errors.title && <p className="mt-1 text-sm text-red-700">{errors.title.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-type" className="mb-2 block text-sm font-semibold text-[#091F5B]">Resource type</label><select id="lecturer-resource-type" disabled={Boolean(pendingUpload)} {...register('type')} className={field}><option value="lecture_notes">Lecture Notes</option><option value="past_question">Past Question</option><option value="research_paper">Research Paper</option><option value="project">Project</option><option value="slides">Slides</option><option value="other">Other</option></select>{errors.type && <p className="mt-1 text-sm text-red-700">{errors.type.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-course" className="mb-2 block text-sm font-semibold text-[#091F5B]">Course taught</label><input id="lecturer-resource-course" disabled={Boolean(pendingUpload)} {...register('course')} placeholder="e.g. CSC 101" className={field} aria-invalid={Boolean(errors.course)} />{errors.course && <p className="mt-1 text-sm text-red-700">{errors.course.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-topic" className="mb-2 block text-sm font-semibold text-[#091F5B]">Topic</label><input id="lecturer-resource-topic" disabled={Boolean(pendingUpload)} {...register('topic')} className={field} aria-invalid={Boolean(errors.topic)} />{errors.topic && <p className="mt-1 text-sm text-red-700">{errors.topic.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-institution" className="mb-2 block text-sm font-semibold text-[#091F5B]">Institution</label><input id="lecturer-resource-institution" disabled={Boolean(pendingUpload)} {...register('institution')} placeholder={user?.institution || 'Your institution'} className={field} aria-invalid={Boolean(errors.institution)} />{errors.institution && <p className="mt-1 text-sm text-red-700">{errors.institution.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-level" className="mb-2 block text-sm font-semibold text-[#091F5B]">Level</label><input id="lecturer-resource-level" disabled={Boolean(pendingUpload)} {...register('level')} placeholder="e.g. 200 level" className={field} aria-invalid={Boolean(errors.level)} />{errors.level && <p className="mt-1 text-sm text-red-700">{errors.level.message}</p>}</div>
        <div className="md:col-span-2"><label htmlFor="lecturer-resource-description" className="mb-2 block text-sm font-semibold text-[#091F5B]">Description</label><textarea id="lecturer-resource-description" disabled={Boolean(pendingUpload)} {...register('description')} rows={5} className={field} aria-invalid={Boolean(errors.description)} />{errors.description && <p className="mt-1 text-sm text-red-700">{errors.description.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-license" className="mb-2 block text-sm font-semibold text-[#091F5B]">Licence</label><select id="lecturer-resource-license" disabled={Boolean(pendingUpload)} {...register('license')} className={field}><option value="CC-BY-4.0">CC BY 4.0</option><option value="CC-BY-SA-4.0">CC BY-SA 4.0</option><option value="CC0-1.0">CC0 1.0</option><option value="ALL-RIGHTS-RESERVED">All rights reserved</option></select>{errors.license && <p className="mt-1 text-sm text-red-700">{errors.license.message}</p>}</div>
        <div><label htmlFor="lecturer-resource-attribution" className="mb-2 block text-sm font-semibold text-[#091F5B]">Attribution</label><input id="lecturer-resource-attribution" disabled={Boolean(pendingUpload)} {...register('attribution')} placeholder="Author / source credit" className={field} aria-invalid={Boolean(errors.attribution)} />{errors.attribution && <p className="mt-1 text-sm text-red-700">{errors.attribution.message}</p>}</div>
        <div className="md:col-span-2"><label htmlFor="lecturer-resource-tags" className="mb-2 block text-sm font-semibold text-[#091F5B]">Tags</label><input id="lecturer-resource-tags" disabled={Boolean(pendingUpload)} {...register('tags')} placeholder="ai, revision, engineering" className={field} /><p className="mt-1 text-xs text-[#5C6982]">Separate tags with commas.</p></div>
        <div className="md:col-span-2"><label htmlFor="lecturer-resource-file" className="mb-2 block text-sm font-semibold text-[#091F5B]">Attach document</label><input id="lecturer-resource-file" className={field + ' file:mr-4 file:rounded-lg file:border-0 file:bg-[#004BEC] file:px-3 file:py-2 file:font-semibold file:text-white'} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" onChange={event => setAttachment(event.target.files?.[0] ?? null)} /><p className="mt-1 text-xs text-[#5C6982]">{pendingUpload ? 'Select the exact same file to resume the pending upload.' : 'PDF, Word, PowerPoint or TXT · Maximum 50 MB. Files are uploaded to private object storage.'}</p>{attachment && <p className="mt-1 text-sm text-[#1F2937]">Selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)} MB)</p>}</div>
        {!pendingUpload && <label className="md:col-span-2 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6"><input type="checkbox" className="mt-1" {...register('rightsConfirmed')} /><span>I confirm I created this work or have permission to share it under the selected licence. I understand it will be reviewed before publication.</span></label>}
        {!pendingUpload && errors.rightsConfirmed?.message && <p className="md:col-span-2 text-sm text-rose-700">{errors.rightsConfirmed.message}</p>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-blue-200 bg-[#F3F6FC] p-3 text-sm text-[#091F5B]">{success}</p>}
      {!isAuthenticated && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Sign in with a lecturer account to submit a resource.</p>}
      <button type="submit" disabled={!isAuthenticated || user?.role !== 'lecturer' || isSubmitting || (Boolean(pendingUpload) && !attachment)} className="w-full rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Uploading and submitting…' : pendingUpload ? 'Retry attachment upload' : 'Submit for moderator review'}</button>
    </form>
  </div>;
}
