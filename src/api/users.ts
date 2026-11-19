import { apiRequest } from '../lib/api/client';
import type { User } from '../types';

export const usersApi = {
  list: () => apiRequest<User[]>('/users'),
  assignSupportRole: (id: string) => apiRequest<User>(`/users/${encodeURIComponent(id)}/platform-role`, { method: 'PATCH', body: JSON.stringify({ role: 'support' }) }),
};
