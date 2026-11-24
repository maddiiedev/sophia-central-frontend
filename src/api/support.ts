import { apiRequest } from '../lib/api/client';

export type SupportRequestStatus = 'pending' | 'under_review' | 'reviewed' | 'response_sent' | 'concluded';
export type SupportResolutionCategory = 'resolved' | 'information_provided' | 'duplicate' | 'unable_to_reproduce' | 'user_action_required' | 'other';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportCaseAssignee = { id: string; firstName?: string; lastName?: string; email: string };
export type SupportCaseEvent = { id: string; actorId: string | null; actorEmail: string; eventType: string; details: Record<string, unknown>; createdAt: string };
export type SupportInternalNote = { id: string; authorId: string | null; authorEmail: string; body: string; createdAt: string };

export type SupportAnalytics = {
  windowDays: 7 | 30 | 90;
  generatedAt: string;
  summary: {
    ticketsCreated: number;
    openBacklog: number;
    overdueBacklog: number;
    averageBacklogAgeHours: number;
    averageResponseMinutes: number;
    responseCount: number;
    averageResolutionMinutes: number;
    resolutionCount: number;
    escalatedTickets: number;
    escalationRate: number;
  };
  categoryTrends: { category: string; count: number }[];
  agentWorkload: { id: string; firstName?: string; lastName?: string; email: string; activeCases: number; completedInPeriod: number }[];
};

export type SupportEmailStatus = { configured: boolean; provider: 'resend'; inboundReplySync: boolean };
export type SupportTicketTracking = Pick<SupportRequest, 'id' | 'ticketNumber' | 'subject' | 'category' | 'status' | 'escalatedToRole' | 'createdAt'>;

export type SupportRequest = {
  id: string;
  ticketNumber?: string;
  userId: string | null;
  requesterType?: 'registered' | 'guest';
  senderName?: string | null;
  senderEmail?: string | null;
  senderInstitution?: string | null;
  senderFaculty?: string | null;
  senderDepartment?: string | null;
  senderAccountType?: string | null;
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
  responseEmailSent?: boolean;
  priority?: SupportPriority;
  assignedSupportId?: string | null;
  slaDueAt?: string | null;
  overdue?: boolean;
  resolvedAt?: string | null;
  resolutionCategory?: SupportResolutionCategory | null;
  closureReason?: string | null;
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
  analytics: (days: 7 | 30 | 90 = 30) => apiRequest<SupportAnalytics>(`/support-requests/cases/analytics?days=${days}`),
  caseAssignees: () => apiRequest<SupportCaseAssignee[]>('/support-requests/cases/assignees'),
  assignCase: (id: string, assigneeId: string | null) => apiRequest<unknown>(`/support-requests/cases/${encodeURIComponent(id)}/assignment`, { method: 'POST', body: JSON.stringify({ assigneeId }) }),
  resolveCase: (id: string, resolutionCategory: SupportResolutionCategory, closureReason?: string) => apiRequest<SupportRequest>(`/support-requests/cases/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionCategory, closureReason }) }),
  setCasePriority: (id: string, priority: SupportPriority) => apiRequest<unknown>(`/support-requests/cases/${encodeURIComponent(id)}/priority`, { method: 'POST', body: JSON.stringify({ priority }) }),
  addInternalNote: (id: string, body: string) => apiRequest<{ note: SupportInternalNote }>(`/support-requests/cases/${encodeURIComponent(id)}/notes`, { method: 'POST', body: JSON.stringify({ body }) }),
  getInternalNotes: (id: string) => apiRequest<SupportInternalNote[]>(`/support-requests/cases/${encodeURIComponent(id)}/notes`),
  getCaseTimeline: (id: string) => apiRequest<SupportCaseEvent[]>(`/support-requests/cases/${encodeURIComponent(id)}/timeline`),
  updateStatus: (id: string, status: 'under_review' | 'reviewed') =>
    apiRequest<SupportRequest>(`/support-requests/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  escalate: (id: string, targetRole: 'admin', reason: string) =>
    apiRequest<{ success: boolean; ticketNumber: string; notified: number }>(`/support-requests/${encodeURIComponent(id)}/escalate`, { method: 'PATCH', body: JSON.stringify({ targetRole, reason }) }),
  conclude: (id: string, resolutionMessage: string) =>
    apiRequest<SupportRequest>(`/support-requests/${encodeURIComponent(id)}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionMessage }),
    }),
};
