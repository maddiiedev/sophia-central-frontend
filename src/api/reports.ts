import { apiRequest } from './client';

export type ReportTargetType = 'user' | 'resource' | 'chat_message';
export type ReportReason = 'spam' | 'harassment' | 'impersonation' | 'inappropriate_content' | 'misinformation' | 'copyright' | 'other';
export type ContentReportStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed';
export type ReportSeverity = 'low' | 'normal' | 'high' | 'critical';
export type ContentReport = {
  id: string;
  ticketNumber?: string;
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
  severity?: ReportSeverity;
  assignedModeratorId?: string | null;
  assignedModerator?: { firstName?: string; lastName?: string; email?: string } | null;
  moderatorNote?: string | null;
  escalatedToRole?: 'admin' | null;
  escalationReason?: string | null;
  escalatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const reportsApi = {
  create: (payload: { targetType: ReportTargetType; targetId: string; reason: ReportReason; details?: string }) =>
    apiRequest<ContentReport>('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  mine: () => apiRequest<ContentReport[]>('/reports/mine'),
  moderationQueue: (status?: ContentReportStatus | 'all', filters: { assignedToMe?: boolean; unassigned?: boolean; severity?: ReportSeverity } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (filters.assignedToMe) params.set('assignedToMe', 'true');
    if (filters.unassigned) params.set('unassigned', 'true');
    if (filters.severity) params.set('severity', filters.severity);
    const query = params.toString();
    return apiRequest<ContentReport[]>(`/moderation/reports${query ? `?${query}` : ''}`);
  },
  claim: (id: string, reason: string) => apiRequest<ContentReport>(`/moderation/reports/${encodeURIComponent(id)}/assignment`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  setSeverity: (id: string, severity: ReportSeverity, reason: string) => apiRequest<ContentReport>(`/moderation/reports/${encodeURIComponent(id)}/severity`, { method: 'PATCH', body: JSON.stringify({ severity, reason }) }),
  history: (id: string) => apiRequest<Array<{ id: string; actorEmail?: string; eventType: string; fromModeratorId?: string; toModeratorId?: string; fromSeverity?: string; toSeverity?: string; reason: string; createdAt: string }>>(`/moderation/reports/${encodeURIComponent(id)}/history`),
  escalate: (id: string, targetRole: 'admin', reason: string) =>
    apiRequest<{ success: boolean; ticketNumber: string; notified: number }>(`/moderation/reports/${encodeURIComponent(id)}/escalate`, { method: 'PATCH', body: JSON.stringify({ targetRole, reason }) }),
  update: (id: string, status: ContentReportStatus, moderatorNote?: string) =>
    apiRequest<ContentReport>(`/moderation/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ status, ...(moderatorNote ? { moderatorNote } : {}) }),
    }),
};
