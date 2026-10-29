import { apiRequest } from './client';
import type { ModerationItem } from '../types';

type ApiModerationResource = {
  id: string;
  title: string;
  description?: string | null;
  type?: string;
  course?: string | null;
  institution?: string | null;
  level?: string | null;
  topic?: string | null;
  fileUrl?: string | null;
  tags?: string[];
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged' | 'draft';
  isVerified?: boolean;
  uploaderId?: string;
  uploader?: { id?: string; name?: string; firstName?: string; lastName?: string; email?: string; faculty?: string; department?: string };
  createdAt?: string;
};

export type ModerationHistoryItem = {
  id: string;
  status: 'approved' | 'rejected' | string;
  note?: string | null;
  createdAt?: string;
  resource?: ApiModerationResource;
  reviewer?: { id?: string; name?: string; firstName?: string; lastName?: string; email?: string };
};

function mapModerationResource(resource: ApiModerationResource): ModerationItem {
  const uploaderName = resource.uploader?.name ||
    [resource.uploader?.firstName, resource.uploader?.lastName].filter(Boolean).join(' ') ||
    resource.uploader?.email ||
    resource.uploaderId ||
    'Unknown lecturer';
  return {
    ...resource,
    id: resource.id,
    title: resource.title,
    status: resource.moderationStatus ?? 'pending',
    summary: resource.description ?? undefined,
    course: resource.course ?? undefined,
    institution: resource.institution ?? undefined,
    level: resource.level ?? undefined,
    topic: resource.topic ?? undefined,
    fileUrl: resource.fileUrl ?? undefined,
    uploadedBy: uploaderName,
  };
}

export const moderationApi = {
  queue: async (token?: string | null): Promise<ModerationItem[]> => {
    const resources = await apiRequest<ApiModerationResource[]>('/moderation/queue', { method: 'GET' }, token ?? null);
    return resources.map(mapModerationResource);
  },

  history: async (token?: string | null): Promise<ModerationHistoryItem[]> => {
    return apiRequest<ModerationHistoryItem[]>('/moderation/history', { method: 'GET' }, token ?? null);
  },

  review: async (
    resourceId: string,
    status: 'approved' | 'rejected',
    token?: string | null,
    note?: string,
  ) => {
    return apiRequest<{
      id: string;
      status: 'approved' | 'rejected';
      resource?: { id: string; moderationStatus: 'approved' | 'rejected'; isVerified: boolean };
    }>(
      `/moderation/resources/${encodeURIComponent(resourceId)}/review`,
      { method: 'PATCH', body: JSON.stringify({ status, ...(note ? { note } : {}) }) },
      token ?? null,
    );
  },
};
