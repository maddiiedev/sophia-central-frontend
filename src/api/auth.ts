import { apiRequest } from '../lib/api/client';
import type { User, UserRole } from '../types';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer'>;
  institution?: string;
  faculty?: string;
  department?: string;
  academicHandle: string;
  socialHandle?: string;
  socialLinks?: { linkedin?: string; instagram?: string; twitter?: string };
};

export const authApi = {
  csrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  login: (payload: LoginPayload) => apiRequest<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) => apiRequest<{ user: User; csrfToken?: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiRequest<{ user: User }>('/auth/me'),
  logout: (options: RequestInit = {}) => apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', ...options }),
  requestPasswordReset: (email: string) => apiRequest<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
