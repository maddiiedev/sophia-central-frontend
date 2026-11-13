import { apiRequest } from '../lib/api/client';
import type { User, UserRole } from '../types';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer'>;
  institutionId: string;
  institution?: string;
  faculty?: string;
  department?: string;
  academicHandle: string;
  referralCode?: string;
  socialHandle?: string;
  socialLinks?: { linkedin?: string; instagram?: string; twitter?: string };
};

export const authApi = {
  csrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  login: (payload: LoginPayload) => apiRequest<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) => apiRequest<{ emailSent: boolean; message: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  resendEmailVerification: (email: string) => apiRequest<{ message: string }>('/auth/email-verification/resend', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmEmailVerification: (token: string, password: string) => apiRequest<{ message: string }>('/auth/email-verification/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
  me: () => apiRequest<{ user: User }>('/auth/me'),
  logout: (options: RequestInit = {}) => apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', ...options }),
  requestPasswordReset: (email: string) => apiRequest<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
