import { apiRequest } from './client';
import type { Resource } from '../types';

type ApiResource = Resource & {
  uploaderId?: string | null;
  license?: 'CC-BY-4.0' | 'CC-BY-SA-4.0' | 'CC0-1.0' | 'ALL-RIGHTS-RESERVED';
  attribution?: string;
  faculty?: string;
  department?: string;
  origin?: 'community_upload' | 'open_source';
  hasFile?: boolean;
  sourceUrl?: string;
  uploader?: { id?: string; displayName?: string };
};

export type OpenSourceResearchResult = {
  id: string;
  doi: string | null;
  title: string;
  publicationYear: number | null;
  authors: string[];
  source: string | null;
  landingPageUrl: string | null;
  pdfAvailable: boolean;
  openAccess: boolean;
  licence: string | null;
  redistributionAllowedByLicence: boolean;
};
export type OpenSourceResearchImportResult = {
  imported: boolean;
  duplicate: boolean;
  copyStatus?: 'copied_to_platform' | 'metadata_only';
  copySkippedReason?: string;
  resource: { id: string; title: string; sourceUrl?: string; hasFile?: boolean };
};
export type OpenSourceResearchSearchPage = {
  results: OpenSourceResearchResult[];
  page: number;
  perPage: number;
  hasMore: boolean;
};
export type OpenSourceResearchBulkImportReport = {
  requested: number;
  imported: number;
  duplicates: number;
  failed: number;
  results: Array<{
    identifier: string;
    status: 'imported' | 'duplicate' | 'failed';
    result?: OpenSourceResearchImportResult;
    error?: string;
  }>;
};

export type PublicResourceFilters = { q?: string; author?: string; course?: string; topic?: string; institution?: string; faculty?: string; department?: string; departmentOnly?: boolean; origin?: 'community_upload' | 'open_source'; level?: string; type?: string; license?: string; page?: number; limit?: number };
export type PublicResourcePage = { items: ApiResource[]; page: number; limit: number; total: number; totalPages: number };

function mapResource(resource: ApiResource): Resource {
  return { ...resource, uploadedBy: resource.uploadedBy ?? resource.uploaderId ?? undefined, moderationStatus: resource.moderationStatus ?? (resource.isVerified ? 'approved' : 'pending') };
}
function queryString(filters: PublicResourceFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null && String(value).trim()) params.set(key, String(value).trim()); });
  const query = params.toString();
  return query ? `?${query}` : '';
}
export const resourcesApi = {
  searchOpenSource: (query: string, page = 1, perPage = 12) => apiRequest<OpenSourceResearchSearchPage>(`/resources/open-source/search?q=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`, { method: 'GET' }),
  importOpenSource: (identifier: string) => apiRequest<OpenSourceResearchImportResult>('/resources/open-source/import', { method: 'POST', body: JSON.stringify({ identifier }) }),
  importOpenSourceBulk: (identifiers: string[]) => apiRequest<OpenSourceResearchBulkImportReport>('/resources/open-source/import/bulk', { method: 'POST', body: JSON.stringify({ identifiers }) }),
  openSourceList: async (filters: PublicResourceFilters = {}) => {
    const page = await apiRequest<PublicResourcePage>(`/resources/open-source-library${queryString(filters)}`, { method: 'GET' });
    return { ...page, items: page.items.map(mapResource) };
  },
  openSourceById: async (id: string) => mapResource(await apiRequest<ApiResource>(`/resources/open-source-library/${encodeURIComponent(id)}`, { method: 'GET' })),
  openSourceFileUrl: (id: string) => apiRequest<{ url: string; filename: string; contentType?: string; license: string; attribution: string }>(`/resources/open-source-library/${encodeURIComponent(id)}/file-url`, { method: 'GET' }),
  publicList: async (filters: PublicResourceFilters = {}) => {
    const page = await apiRequest<PublicResourcePage>(`/resources/public${queryString(filters)}`, { method: 'GET' });
    return { ...page, items: page.items.map(mapResource) };
  },
  publicById: async (id: string) => mapResource(await apiRequest<ApiResource>(`/resources/public/${encodeURIComponent(id)}`, { method: 'GET' })),
  publicFileUrl: (id: string) => apiRequest<{ url: string; filename: string; contentType?: string; license: string; attribution: string }>(`/resources/public/${encodeURIComponent(id)}/file-url`, { method: 'GET' }),
  list: async (token?: string | null) => (await apiRequest<ApiResource[]>('/resources', { method: 'GET' }, token ?? null)).map(mapResource),
  mine: async (token?: string | null) => (await apiRequest<ApiResource[]>('/resources/mine', { method: 'GET' }, token ?? null)).map(mapResource),
  downloaded: async (token?: string | null) => (await apiRequest<ApiResource[]>('/resources/downloaded', { method: 'GET' }, token ?? null)).map(mapResource),
  downloadInApp: async (id: string, token?: string | null) => apiRequest<{ downloaded: true; resourceId: string }>(`/resources/${encodeURIComponent(id)}/download`, { method: 'POST' }, token ?? null),
  saved: async (token?: string | null) => (await apiRequest<ApiResource[]>('/resources/saved', { method: 'GET' }, token ?? null)).map(mapResource),
  save: async (id: string, token?: string | null) => apiRequest<{ saved: true; resourceId: string }>(`/resources/${encodeURIComponent(id)}/save`, { method: 'POST' }, token ?? null),
  unsave: async (id: string, token?: string | null) => apiRequest<{ saved: false; resourceId: string }>(`/resources/${encodeURIComponent(id)}/save`, { method: 'DELETE' }, token ?? null),
  fileUrl: async (id: string, token?: string | null) => apiRequest<{ url: string; filename: string; contentType?: string }>(`/resources/${encodeURIComponent(id)}/file-url`, { method: 'GET' }, token ?? null),
  byId: async (id: string, token?: string | null) => mapResource(await apiRequest<ApiResource>(`/resources/${encodeURIComponent(id)}`, { method: 'GET' }, token ?? null)),
  create: async (payload: Record<string, unknown>, token?: string | null) => apiRequest<Record<string, unknown>>('/resources', { method: 'POST', body: JSON.stringify(payload) }, token ?? null),
};
