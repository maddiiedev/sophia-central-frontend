import { apiRequest } from '../lib/api/client';
import type { User, UserRole } from '../types';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer'>;
  academicHandle: string;
  referralCode?: string;
};

export const authApi = {
  csrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  login: (payload: LoginPayload) => apiRequest<{ user: User } | { preAccountRequired: true; onboardingToken: string; preAccount: { email: string; firstName: string; lastName: string; academicHandle: string; role: Extract<UserRole, 'student' | 'lecturer'>; progress?: Record<string, unknown> } }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  checkAcademicHandleAvailability: (handle: string) => apiRequest<{ available: boolean; message: string }>(`/auth/academic-handle/availability?handle=${encodeURIComponent(handle)}`),
  register: (payload: RegisterPayload) => apiRequest<{ emailSent: boolean; message: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  resendEmailVerification: (payload: RegisterPayload) => apiRequest<{ message: string }>('/auth/email-verification/resend', { method: 'POST', body: JSON.stringify(payload) }),
  confirmEmailVerification: (token: string, password: string) => apiRequest<{ message: string; onboardingToken?: string; preAccount?: { email: string; firstName: string; lastName: string; academicHandle: string; role: Extract<UserRole, 'student' | 'lecturer'> } }>('/auth/email-verification/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
  savePreAccountProgress: (preAccountToken: string, progress: Record<string, unknown>) => apiRequest<{ saved: true }>('/auth/onboarding/progress', { method: 'POST', body: JSON.stringify({ preAccountToken, progress }) }),
  completePreAccountOnboarding: (preAccountToken: string, profile: import('./academic').CompleteOnboardingPayload) => apiRequest<{ user: User }>('/auth/onboarding/complete', { method: 'POST', body: JSON.stringify({ ...profile, preAccountToken }) }),
  me: () => apiRequest<{ user: User }>('/auth/me'),
  logout: (options: RequestInit = {}) => apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', ...options }),
  requestPasswordReset: (email: string) => apiRequest<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
