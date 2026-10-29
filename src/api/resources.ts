import { apiRequest } from './client';
import type { Resource } from '../types';

type ApiResource = Resource & { uploaderId?: string };

function mapResource(resource: ApiResource): Resource {
  return {
    ...resource,
    uploadedBy: resource.uploadedBy ?? resource.uploaderId,
    moderationStatus: resource.moderationStatus ?? (resource.isVerified ? 'approved' : 'pending'),
  };
}

export const resourcesApi = {
  // The server scopes this list to approved resources for students and lecturers.
  list: async (token?: string | null) => {
    const resources = await apiRequest<ApiResource[]>('/resources', { method: 'GET' }, token ?? null);
    return resources.map(mapResource);
  },

  // Lecturer-only history endpoint: pending, approved and rejected resources owned by this lecturer.
  mine: async (token?: string | null) => {
    const resources = await apiRequest<ApiResource[]>('/resources/mine', { method: 'GET' }, token ?? null);
    return resources.map(mapResource);
  },

  byId: async (id: string, token?: string | null) => {
    const resource = await apiRequest<ApiResource>(`/resources/${encodeURIComponent(id)}`, { method: 'GET' }, token ?? null);
    return mapResource(resource);
  },

  create: async (payload: Record<string, unknown>, token?: string | null) => {
    return apiRequest<Record<string, unknown>>('/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token ?? null);
  },
};
