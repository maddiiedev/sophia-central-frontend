import { apiRequest } from './client';

type PresignedUpload = { presignedUrl: string; key: string; uploadId: string; publicUrl: string };
type UploadMetadata = { resourceId: string; filename: string; mimetype: string; size: number };

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
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`File storage rejected the upload (HTTP ${response.status}). Please retry.`);
    }
  },
  complete: (payload: { key: string; resourceId: string; mimetype: string; size: number }) =>
    apiRequest<{ success: boolean; resourceId: string; fileUrl: string; message: string }>('/upload/complete', { method: 'POST', body: JSON.stringify(payload) }),
  async uploadResourceFile(resourceId: string, file: File) {
    const metadata = { resourceId, filename: file.name, mimetype: file.type, size: file.size };
    const signed = await this.presign(metadata);
    await this.putFile(signed.presignedUrl, file);
    return this.complete({ key: signed.key, resourceId, mimetype: file.type, size: file.size });
  },
};

export const supportAttachmentApi = {
  upload: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ url: string; key: string }>('/upload/support-attachment', { method: 'POST', body });
  },
};
