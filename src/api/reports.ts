import { apiRequest } from './client';

export type ReportTargetType = 'user' | 'resource' | 'chat_message';
export type ReportReason = 'spam' | 'harassment' | 'impersonation' | 'inappropriate_content' | 'misinformation' | 'copyright' | 'other';
export type ContentReportStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed';
export type ContentReport = {
  id: string;
  reporterId?: string | null;
  reporter?: { id?: string; firstName?: string; lastName?: string; email?: string; academicHandle?: string } | null;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string | null;
  targetLabel: string;
  targetSnapshot?: Record<string, unknown>;
  reason: ReportReason;
  details?: string | null;
  status: ContentReportStatus;
  assignedModeratorId?: string | null;
  assignedModerator?: { firstName?: string; lastName?: string; email?: string } | null;
  moderatorNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const reportsApi = {
  create: (payload: { targetType: ReportTargetType; targetId: string; reason: ReportReason; details?: string }) =>
    apiRequest<ContentReport>('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiRequest<ContentReport[]>('/reports/mine'),
  moderationQueue: (status?: ContentReportStatus | 'all') =>
    apiRequest<ContentReport[]>(`/moderation/reports${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
  update: (id: string, status: ContentReportStatus, moderatorNote?: string) =>
    apiRequest<ContentReport>(`/moderation/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ status, ...(moderatorNote ? { moderatorNote } : {}) }),
    }),
};
