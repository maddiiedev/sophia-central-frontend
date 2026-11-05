import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourcesApi } from '../api/resources';
import { uploadApi } from '../api/upload';
import { useAuth } from '../context/AuthContext';
import { resourceUploadSchema, type ResourceUploadValues } from '../lib/resourceValidation';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const PENDING_UPLOAD_STORAGE_KEY = 'sophia-central.pending-resource-upload.v1';
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
    ) {
      return value as PendingUpload;
    }
  } catch {
    // Storage may be unavailable or contain an invalid record.
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

export function UploadPage() {
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(() => readPendingUpload());
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ResourceUploadValues>({
    resolver: zodResolver(resourceUploadSchema),
    defaultValues: { title: '', description: '', course: '', topic: '', institution: '', level: '', type: 'lecture_notes', license: 'CC-BY-4.0', attribution: '', rightsConfirmed: false, tags: '' },
  });

  const clearPendingUpload = () => {
    savePendingUpload(null);
    setPendingUpload(null);
  };

  const finishSubmission = () => {
    clearPendingUpload();
    setAttachment(null);
    setSuccess('Your contribution has been submitted for moderator review.');
    reset({ title: '', description: '', course: '', topic: '', institution: user?.institution || '', level: '', type: 'lecture_notes', license: 'CC-BY-4.0', attribution: '', rightsConfirmed: false, tags: '' });
  };

  const retryPendingUpload = async () => {
    setError('');
    setSuccess('');
    if (!pendingUpload) return;
    if (!attachment) {
      setError('This contribution is already created. Re-select the original attachment to retry its upload; do not submit the contribution again.');
      return;
    }
    if (
      attachment.name !== pendingUpload.filename ||
      attachment.type !== pendingUpload.mimetype ||
      attachment.size !== pendingUpload.size
    ) {
      setError(`Select the original file again: ${pendingUpload.filename} (${pendingUpload.size} bytes, ${pendingUpload.mimetype}). The contribution record will not be duplicated.`);
      return;
    }
    try {
      await uploadApi.uploadResourceFile(pendingUpload.resourceId, attachment);
      finishSubmission();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Attachment retry failed. Your contribution record is preserved; select the file and retry again.');
    }
  };

  const submit = async (values: ResourceUploadValues) => {
    setError('');
    setSuccess('');
    try {
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
        institution: values.institution.trim() || user?.institution || '',
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
          throw new Error(`Contribution ${resourceId} was created, but its attachment did not finish. ${uploadError instanceof Error ? uploadError.message : 'Retry the attachment.'} Re-select the same file and use “Retry attachment upload”; do not create another contribution.`);
        }
      }

      finishSubmission();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Submission failed.');
    }
  };

  const field = 'brand-input';
  return <div className="mx-auto max-w-4xl rounded-2xl border border-[#DCE4EF] bg-white p-6">
    <h2 className="text-2xl font-bold text-[#091F5B]">Contribute academic material</h2>
    <p className="mt-2 text-sm text-[#5C6982]">Students and lecturers can submit notes, past questions, research and study resources. All submissions are reviewed before publication.</p>
    {pendingUpload && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Attachment upload needs to be completed</p>
      <p className="mt-1">Contribution record: {pendingUpload.resourceId}</p>
      <p className="mt-1">Re-select <strong>{pendingUpload.filename}</strong> ({(pendingUpload.size / (1024 * 1024)).toFixed(2)} MB). Your contribution will not be recreated.</p>
    </div>}
    <form onSubmit={event => {
      if (pendingUpload) {
        event.preventDefault();
        void retryPendingUpload();
      } else {
        void handleSubmit(submit)(event);
      }
    }} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Title<input className={field} disabled={Boolean(pendingUpload)} {...register('title')} />{errors.title?.message}</label>
      <label className="text-sm font-semibold">Material type<select className={field} disabled={Boolean(pendingUpload)} {...register('type')}><option value="lecture_notes">Lecture notes</option><option value="past_question">Past question</option><option value="research_paper">Research paper</option><option value="project">Project</option><option value="slides">Slides</option><option value="other">Other</option></select></label>
      <label className="text-sm font-semibold">Course / subject<input className={field} disabled={Boolean(pendingUpload)} {...register('course')} />{errors.course?.message}</label>
      <label className="text-sm font-semibold">Topic<input className={field} disabled={Boolean(pendingUpload)} {...register('topic')} />{errors.topic?.message}</label>
      <label className="text-sm font-semibold">Institution<input className={field} disabled={Boolean(pendingUpload)} {...register('institution')} />{errors.institution?.message}</label>
      <label className="text-sm font-semibold">Academic level<input className={field} disabled={Boolean(pendingUpload)} {...register('level')} />{errors.level?.message}</label>
      <label className="sm:col-span-2 text-sm font-semibold">Description<textarea rows={4} className={field} disabled={Boolean(pendingUpload)} {...register('description')} />{errors.description?.message}</label>
      <label className="text-sm font-semibold">Licence<select className={field} disabled={Boolean(pendingUpload)} {...register('license')}><option value="CC-BY-4.0">CC BY 4.0</option><option value="CC-BY-SA-4.0">CC BY-SA 4.0</option><option value="CC0-1.0">CC0 1.0</option><option value="ALL-RIGHTS-RESERVED">All rights reserved</option></select></label>
      <label className="text-sm font-semibold">Attribution<input className={field} disabled={Boolean(pendingUpload)} placeholder="Author / source credit" {...register('attribution')} />{errors.attribution?.message}</label>
      <label className="sm:col-span-2 text-sm font-semibold">Tags<input className={field} disabled={Boolean(pendingUpload)} placeholder="comma-separated" {...register('tags')} /></label>
      <label className="sm:col-span-2 text-sm font-semibold">Attachment (optional)
        <input className={field + ' mt-2'} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" onChange={event => setAttachment(event.target.files?.[0] ?? null)} />
        <span className="mt-1 block text-xs font-normal text-[#5C6982]">{pendingUpload ? 'Select the exact same file to resume the pending upload.' : 'PDF, Word, PowerPoint or TXT; maximum 50 MB. The file is uploaded to private object storage after the contribution record is created.'}</span>
        {attachment && <span className="mt-1 block text-xs font-normal">{attachment.name} · {(attachment.size / (1024 * 1024)).toFixed(2)} MB</span>}
      </label>
      {!pendingUpload && <label className="sm:col-span-2 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6"><input type="checkbox" className="mt-1" {...register('rightsConfirmed')} /><span>I confirm I created this work or have permission to share it under the selected licence. I understand it will be reviewed before publication.</span></label>}
      {!pendingUpload && errors.rightsConfirmed?.message && <p className="sm:col-span-2 text-sm text-rose-700">{errors.rightsConfirmed.message}</p>}
      {error && <p role="alert" className="sm:col-span-2 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="sm:col-span-2 text-sm text-emerald-800">{success}</p>}
      <button type="submit" disabled={!isAuthenticated || isSubmitting || (Boolean(pendingUpload) && !attachment)} className="sm:col-span-2 rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Submitting…' : pendingUpload ? 'Retry attachment upload' : 'Submit for review'}</button>
    </form>
  </div>;
}
