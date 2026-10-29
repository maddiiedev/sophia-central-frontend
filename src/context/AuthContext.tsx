import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { academicApi } from '../api/academic';
import { setCsrfToken } from '../lib/api/client';
import type { User, UserRole } from '../types';

type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer'>;
  [key: string]: unknown;
};
type OnboardingPayload = Parameters<typeof academicApi.completeOnboarding>[0];
type AuthContextValue = { user: User | null; isAuthenticated: boolean; isLoading: boolean; login: (email: string, password: string, _role?: UserRole) => Promise<void>; register: (payload: RegisterPayload) => Promise<void>; completeOnboarding: (payload: OnboardingPayload) => Promise<void>; logout: () => Promise<void>; refreshSession: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function optionalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeCsrf = useCallback(async () => {
    const response = await authApi.csrf();
    setCsrfToken(response.csrfToken);
  }, []);
  const clearSession = useCallback(() => { setUser(null); setCsrfToken(null); }, []);
  const refreshSession = useCallback(async () => {
    const response = await authApi.me();
    setUser(response.user);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      // CSRF refresh is non-blocking on page load; session state is the only gate for protected routes.
      void initializeCsrf().catch(() => setCsrfToken(null));
      try {
        await refreshSession();
      } catch {
        clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void bootstrap();
    return () => { active = false; };
  }, [clearSession, initializeCsrf, refreshSession]);

  const login = useCallback(async (email: string, password: string, _role?: UserRole) => {
    await initializeCsrf();
    const response = await authApi.login({ email, password });
    setUser(response.user);
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
  }, [initializeCsrf]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await initializeCsrf();
    const socialLinks = payload.socialLinks as { linkedin?: string; instagram?: string; twitter?: string } | undefined;
    const response = await authApi.register({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      institution: typeof payload.institution === 'string' ? payload.institution.trim() || undefined : undefined,
      faculty: typeof payload.faculty === 'string' ? payload.faculty.trim() || undefined : undefined,
      department: typeof payload.department === 'string' ? payload.department.trim() || undefined : undefined,
      socialHandle: typeof payload.handle === 'string' ? payload.handle.trim() || undefined : undefined,
      socialLinks: socialLinks ? {
        linkedin: optionalUrl(socialLinks.linkedin),
        instagram: optionalUrl(socialLinks.instagram),
        twitter: optionalUrl(socialLinks.twitter),
      } : undefined,
    });
    setUser(response.user);
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
  }, [initializeCsrf]);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
    const response = await academicApi.completeOnboarding(payload);
    setUser(response.user);
  }, []);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { clearSession(); }
  }, [clearSession]);
  const value = useMemo<AuthContextValue>(() => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, completeOnboarding, logout, refreshSession }), [user, isLoading, login, register, completeOnboarding, logout, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
