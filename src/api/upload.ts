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

async function prepareProfileImage(file: File): Promise<File> {
  // Keep profile avatars small before they leave the device. The API still validates
  // the final MIME type and size, so this is an optimization, not a security boundary.
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The selected image could not be opened.'));
    });

    const maxDimension = 512;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82);
    });
    if (!blob || blob.size >= file.size) return file;

    const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], `profile-image.${extension}`, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const PROFILE_IMAGE_URL_CACHE_TTL_MS = 10 * 60 * 1000;
const profileImageUrlCache = new Map<string, { url: string; expiresAt: number }>();
const profileImageUrlRequests = new Map<string, Promise<{ url: string | null }>>();

function profileImageCacheStorageKey(userId: string) {
  return `sophis-central:profile-image-url:${userId}`;
}

function readCachedProfileImageUrl(userId: string): string | null {
  const cached = profileImageUrlCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  profileImageUrlCache.delete(userId);

  try {
    const raw = window.sessionStorage.getItem(profileImageCacheStorageKey(userId));
    if (!raw) return null;
    const stored = JSON.parse(raw) as { url?: unknown; expiresAt?: unknown };
    if (typeof stored.url === 'string' && typeof stored.expiresAt === 'number' && stored.expiresAt > Date.now()) {
      profileImageUrlCache.set(userId, { url: stored.url, expiresAt: stored.expiresAt });
      return stored.url;
    }
    window.sessionStorage.removeItem(profileImageCacheStorageKey(userId));
  } catch {
    // Browser storage is optional; the in-memory cache remains available.
  }
  return null;
}

function cacheProfileImageUrl(userId: string, url: string) {
  const expiresAt = Date.now() + PROFILE_IMAGE_URL_CACHE_TTL_MS;
  profileImageUrlCache.set(userId, { url, expiresAt });
  try {
    // Session-scoped only: signed image URLs are short-lived and never persist across browser sessions.
    window.sessionStorage.setItem(profileImageCacheStorageKey(userId), JSON.stringify({ url, expiresAt }));
  } catch {
    // Private browsing or storage limits must not prevent the image from loading.
  }
}

function invalidateProfileImageUrl(userId: string) {
  profileImageUrlCache.delete(userId);
  profileImageUrlRequests.delete(userId);
  try {
    window.sessionStorage.removeItem(profileImageCacheStorageKey(userId));
  } catch {
    // Browser storage is optional.
  }
}

export const profileImageApi = {
  getCachedUrl: (userId: string) => readCachedProfileImageUrl(userId),
  invalidate: (userId: string) => invalidateProfileImageUrl(userId),
  async getUrl(userId: string, options: { forceRefresh?: boolean } = {}) {
    if (options.forceRefresh) invalidateProfileImageUrl(userId);
    const cachedUrl = readCachedProfileImageUrl(userId);
    if (cachedUrl) return { url: cachedUrl };

    const pending = profileImageUrlRequests.get(userId);
    if (pending) return pending;

    const request = apiRequest<{ url: string | null }>(`/upload/profile-image/${encodeURIComponent(userId)}/url`)
      .then((result) => {
        if (result.url) cacheProfileImageUrl(userId, result.url);
        return result;
      })
      .finally(() => profileImageUrlRequests.delete(userId));
    profileImageUrlRequests.set(userId, request);
    return request;
  },
  async upload(file: File) {
    const optimizedFile = await prepareProfileImage(file);
    const body = new FormData();
    body.append('file', optimizedFile, optimizedFile.name);
    const result = await apiRequest<{ success: boolean; profileImage: string; user: import('../types').User }>(
      '/upload/profile-image',
      { method: 'POST', body },
    );
    if (result.user?.id) invalidateProfileImageUrl(result.user.id);
    return result;
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
