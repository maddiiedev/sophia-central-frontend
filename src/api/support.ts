import { apiRequest } from '../lib/api/client';

export type SupportRequestStatus = 'pending' | 'under_review' | 'reviewed' | 'response_sent' | 'concluded';
export type SupportEmailStatus = { configured: boolean; provider: 'resend'; inboundReplySync: boolean };
export type SupportTicketTracking = Pick<SupportRequest, 'id' | 'ticketNumber' | 'subject' | 'category' | 'status' | 'escalatedToRole' | 'createdAt'>;

export type SupportRequest = {
  id: string;
  ticketNumber?: string;
  userId: string;
  subject: string;
  category: string;
  description: string;
  links: string[];
  attachments: string[];
  status: SupportRequestStatus;
  escalatedToRole?: 'moderator' | 'admin' | null;
  resolutionMessage?: string | null;
  reviewerId?: string | null;
  reviewer?: { id: string; firstName?: string; lastName?: string; email?: string; role?: string } | null;
  user?: { id: string; firstName?: string; lastName?: string; name?: string; email: string; role: string; institution?: string; faculty?: string; department?: string; profileImage?: string } | null;
  createdAt: string;
  concludedAt?: string | null;
  confirmationMessage?: string;
};

export const supportApi = {
  emailStatus: () => apiRequest<SupportEmailStatus>('/support-requests/email-status'),
  create: (payload: { subject: string; category: string; description: string; links: string[]; attachments: string[] }) =>
    apiRequest<SupportRequest>('/support-requests', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiRequest<SupportTicketTracking[]>('/support-requests/mine'),
  mineActivity: () => apiRequest<SupportRequest[]>('/support-requests/mine/activity'),
  uploadImage: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ url: string; key: string }>('/upload/support-attachment', { method: 'POST', body });
  },
  queue: (status: SupportRequestStatus) =>
    apiRequest<SupportRequest[]>(`/support-requests/queue?status=${status}`),
  updateStatus: (id: string, status: 'under_review' | 'reviewed') =>
    apiRequest<SupportRequest>(`/support-requests/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  escalate: (id: string, targetRole: 'moderator' | 'admin', reason: string) =>
    apiRequest<{ success: boolean; ticketNumber: string; notified: number }>(`/support-requests/${encodeURIComponent(id)}/escalate`, { method: 'PATCH', body: JSON.stringify({ targetRole, reason }) }),
  conclude: (id: string, resolutionMessage: string) =>
    apiRequest<SupportRequest>(`/support-requests/${encodeURIComponent(id)}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionMessage }),
    }),
};
