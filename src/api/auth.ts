import { apiRequest } from '../lib/api/client';
import type { User, UserRole } from '../types';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer' | 'reviewer'>;
  academicHandle: string;
  referralCode?: string;
};

export const authApi = {
  csrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  login: (payload: LoginPayload) => apiRequest<{ user: User } | { adminMfaRequired: true; setupRequired: boolean; challengeToken: string } | { reactivationRequired: true; message: string } | { preAccountRequired: true; onboardingToken: string; preAccount: { email: string; firstName: string; lastName: string; academicHandle: string; role: Extract<UserRole, 'student' | 'lecturer' | 'reviewer'>; progress?: Record<string, unknown> } }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  verifyAccountReactivation: (identifier: string, code: string) => apiRequest<{ confirmationRequired: true; confirmationToken: string }>('/auth/account-reactivation/verify', { method: 'POST', body: JSON.stringify({ identifier, code }) }),
  confirmAccountReactivation: (confirmationToken: string) => apiRequest<{ user: User }>('/auth/account-reactivation/confirm', { method: 'POST', body: JSON.stringify({ confirmationToken }) }),
  adminMfaEnrollmentStart: (challengeToken: string) => apiRequest<{ challengeToken: string; provisioningUri: string; secret: string }>('/auth/admin-mfa/enrollment/start', { method: 'POST', body: JSON.stringify({ challengeToken }) }),
  adminMfaEnrollmentConfirm: (challengeToken: string, code: string) => apiRequest<{ user: User; recoveryCodes: string[] }>('/auth/admin-mfa/enrollment/confirm', { method: 'POST', body: JSON.stringify({ challengeToken, code }) }),
  adminMfaVerify: (challengeToken: string, code: string) => apiRequest<{ user: User }>('/auth/admin-mfa/verify', { method: 'POST', body: JSON.stringify({ challengeToken, code }) }),
  checkAcademicHandleAvailability: (handle: string) => apiRequest<{ available: boolean; message: string }>(`/auth/academic-handle/availability?handle=${encodeURIComponent(handle)}`),
  checkReviewerRegistrationIntent: (payload: { email: string; academicHandle: string }) => apiRequest<{ requiresSignIn: boolean; signInIdentifier?: string }>('/auth/reviewer-registration-check', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) => apiRequest<{ emailSent: boolean; message: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  resendEmailVerification: (payload: RegisterPayload) => apiRequest<{ message: string }>('/auth/email-verification/resend', { method: 'POST', body: JSON.stringify(payload) }),
  confirmEmailVerification: (token: string, password: string) => apiRequest<{ message: string; onboardingToken?: string; preAccount?: { email: string; firstName: string; lastName: string; academicHandle: string; role: Extract<UserRole, 'student' | 'lecturer' | 'reviewer'> } }>('/auth/email-verification/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
  savePreAccountProgress: (preAccountToken: string, progress: Record<string, unknown>) => apiRequest<{ saved: true }>('/auth/onboarding/progress', { method: 'POST', body: JSON.stringify({ preAccountToken, progress }) }),
  completePreAccountOnboarding: (preAccountToken: string, profile: import('./academic').CompleteOnboardingPayload) => apiRequest<{ user: User }>('/auth/onboarding/complete', { method: 'POST', body: JSON.stringify({ ...profile, preAccountToken }) }),
  me: () => apiRequest<{ user: User }>('/auth/me'),
  logout: (options: RequestInit = {}) => apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', ...options }),
  requestPasswordReset: (email: string) => apiRequest<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
