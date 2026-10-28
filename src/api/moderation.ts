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
  uploader?: { id?: string; name?: string; firstName?: string; lastName?: string; email?: string };
  createdAt?: string;
};

export const moderationApi = {
  queue: async (token?: string | null): Promise<ModerationItem[]> => {
    const resources = await apiRequest<ApiModerationResource[]>(
      '/moderation/queue',
      { method: 'GET' },
      token ?? null,
    );

    // The backend returns Resource entities (moderationStatus/description/uploader),
    // while the page consumes ModerationItem (status/summary/uploadedBy).
    return resources.map((resource) => ({
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
      uploadedBy:
        resource.uploader?.name ??
        [resource.uploader?.firstName, resource.uploader?.lastName].filter(Boolean).join(' ') ??
        resource.uploader?.email ??
        resource.uploaderId ??
        'Unknown lecturer',
    }));
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
      {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(note ? { note } : {}) }),
      },
      token ?? null,
    );
  },
};
