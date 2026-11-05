import { apiRequest } from './client';

type PresignedUpload = { presignedUrl: string; key: string; uploadId: string; publicUrl: string };
type UploadMetadata = { resourceId: string; filename: string; mimetype: string; size: number };

function stageError(stage: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : 'Unknown upload error.';
  if (error instanceof TypeError || detail.toLowerCase().includes('failed to fetch')) {
    return new Error(`${stage} failed because the browser could not reach the service. This can be caused by network interruption or a CORS configuration problem. Retry when connected; if it persists, the service's allowed-origin settings need inspection.`);
  }
  return new Error(`${stage} failed: ${detail}`);
}

export const profileImageApi = {
  getUrl: () => apiRequest<{ url: string | null }>('/upload/profile-image/url', { method: 'GET' }),
  async upload(file: File) {
    const body = new FormData();
    body.append('file', file, file.name);
    return apiRequest<{ success: boolean; profileImage: string; user: import('../types').User }>(
      '/upload/profile-image',
      { method: 'POST', body },
    );
  },
};

export const uploadApi = {
  presign: (payload: UploadMetadata) =>
    apiRequest<PresignedUpload>('/upload/presigned-url', { method: 'POST', body: JSON.stringify(payload) }),
  async putFile(presignedUrl: string, file: File) {
    let response: Response;
    try {
      response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
    } catch (error) {
      throw stageError('Object-storage PUT', error);
    }
    if (!response.ok) {
      throw new Error(`Object-storage PUT failed with HTTP ${response.status}. Check the storage response and retry.`);
    }
  },
  complete: (payload: { key: string; resourceId: string; mimetype: string; size: number }) =>
    apiRequest<{ success: boolean; resourceId: string; fileUrl: string; message: string }>('/upload/complete', { method: 'POST', body: JSON.stringify(payload) }),
  async uploadResourceFile(resourceId: string, file: File) {
    const metadata = { resourceId, filename: file.name, mimetype: file.type, size: file.size };
    let signed: PresignedUpload;
    try {
      signed = await this.presign(metadata);
    } catch (error) {
      throw stageError('Upload initialization (POST /upload/presigned-url)', error);
    }
    await this.putFile(signed.presignedUrl, file);
    try {
      return await this.complete({ key: signed.key, resourceId, mimetype: file.type, size: file.size });
    } catch (error) {
      throw stageError('Upload finalization (POST /upload/complete)', error);
    }
  },
};

export const supportAttachmentApi = {
  upload: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ url: string; key: string }>('/upload/support-attachment', { method: 'POST', body });
  },
};
