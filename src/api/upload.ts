import { apiRequest } from './client';

type PresignedUpload = { presignedUrl: string; key: string; uploadId: string; publicUrl: string };

type ProfileImagePresign = { presignedUrl: string; key: string; publicUrl: string };

export const profileImageApi = {
  async upload(file: File) {
    const signed = await apiRequest<ProfileImagePresign>('/upload/profile-image/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimetype: file.type,
        size: file.size,
      }),
    });
    const uploaded = await fetch(signed.presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploaded.ok) {
      throw new Error('The profile image could not be uploaded. Please try again.');
    }
    return apiRequest<{ success: boolean; profileImage: string; user: import('../types').User }>(
      '/upload/profile-image/complete',
      {
        method: 'POST',
        body: JSON.stringify({ key: signed.key, mimetype: file.type, size: file.size }),
      },
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
