import { apiRequest } from './client';

type PresignedUpload = { presignedUrl: string; key: string; uploadId: string; publicUrl: string };

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
  presign: (payload: { resourceId: string; filename: string; mimetype: string; size: number }) =>
    apiRequest<PresignedUpload>('/upload/presigned-url', { method: 'POST', body: JSON.stringify(payload) }),
  complete: (payload: { key: string; resourceId: string; mimetype: string; size: number }) =>
    apiRequest<{ success: boolean; resourceId: string; fileUrl: string; message: string }>('/upload/complete', { method: 'POST', body: JSON.stringify(payload) }),
};

export const supportAttachmentApi = {
  upload: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ url: string; key: string }>('/upload/support-attachment', { method: 'POST', body });
  },
};
