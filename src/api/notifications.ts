import { apiRequest } from '../lib/api/client';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationList = { notifications: AppNotification[]; unreadCount: number };

export const notificationsApi = {
  list: (limit = 30) => apiRequest<NotificationList>(`/notifications?limit=${limit}`),
  markRead: (id: string) => apiRequest<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllRead: () => apiRequest<{ updated: number }>('/notifications/mark-all-read', { method: 'PATCH' }),
};
