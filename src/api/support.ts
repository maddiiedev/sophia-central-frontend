import { apiRequest } from '../lib/api/client';

export type SupportRequestStatus = 'pending' | 'concluded';
export type SupportRequest = {
  id: string;
  userId: string;
  subject: string;
  category: string;
  description: string;
  links: string[];
  attachments: string[];
  status: SupportRequestStatus;
  resolutionMessage?: string | null;
  reviewerId?: string | null;
  reviewer?: { id: string; firstName?: string; lastName?: string; email?: string; role?: string } | null;
  user?: { id: string; firstName?: string; lastName?: string; name?: string; email: string; role: string; institution?: string; faculty?: string; department?: string; profileImage?: string } | null;
  createdAt: string;
  concludedAt?: string | null;
  confirmationMessage?: string;
};

export const supportApi = {
  create: (payload: { subject: string; category: string; description: string; links: string[]; attachments: string[] }) =>
    apiRequest<SupportRequest>('/support-requests', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiRequest<SupportRequest[]>('/support-requests/mine'),
  uploadImage: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ url: string; key: string }>('/upload/support-attachment', { method: 'POST', body });
  },
  moderationList: (status: SupportRequestStatus) =>
    apiRequest<SupportRequest[]>(`/moderation/support-requests?status=${status}`),
  conclude: (id: string, resolutionMessage: string) =>
    apiRequest<SupportRequest>(`/moderation/support-requests/${encodeURIComponent(id)}/conclude`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionMessage }),
    }),
};
