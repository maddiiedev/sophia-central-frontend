import { apiRequest } from '../lib/api/client';
import type { User } from '../types';

export interface PlatformAccount {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'support' | 'moderator';
  platformRoleVerifiedAt?: string | null;
  emailVerified: boolean;
  isSuspended: boolean;
  accountStatus: string;
  createdAt: string;
}

export const usersApi = {
  list: () => apiRequest<User[]>('/users'),
  platformAccounts: () => apiRequest<PlatformAccount[]>('/users/platform-accounts'),
  assignPlatformRole: (id: string, role: 'support' | 'moderator') =>
    apiRequest<User>(`/users/${encodeURIComponent(id)}/platform-role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};
