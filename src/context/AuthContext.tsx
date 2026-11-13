import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { academicApi } from '../api/academic';
import { setCsrfToken } from '../lib/api/client';
import { clearPreAccountSession } from '../lib/registration-session';
import type { User, UserRole } from '../types';

type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer'>;
  [key: string]: unknown;
};
type OnboardingPayload = Parameters<typeof academicApi.completeOnboarding>[0];
type AuthContextValue = { user: User | null; isAuthenticated: boolean; isLoading: boolean; login: (identifier: string, password: string, _role?: UserRole) => Promise<void>; register: (payload: RegisterPayload) => Promise<{ emailSent: boolean; message: string }>; completeOnboarding: (payload: OnboardingPayload) => Promise<void>; completePreAccountOnboarding: (token: string, payload: OnboardingPayload) => Promise<void>; logout: () => Promise<void>; refreshSession: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeCsrf = useCallback(async () => {
    const response = await authApi.csrf();
    setCsrfToken(response.csrfToken);
  }, []);
  const clearSession = useCallback(() => { setUser(null); setCsrfToken(null); }, []);
  // /auth/me already returns the stable public R2 profile-image URL.
  // Keep session restoration independent from any separate image-URL request.
  const refreshSession = useCallback(async () => {
    const response = await authApi.me();
    setUser(response.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
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

  // Do not log out on pagehide/unload. Browser page lifecycle events also fire when
  // a tab is closed after a successful sign-in or enters the back-forward cache.
  // The session cookie is browser-session scoped; explicit logout owns invalidation.

  const login = useCallback(async (identifier: string, password: string, _role?: UserRole) => {
    await initializeCsrf();
    const response = await authApi.login({ identifier, password });
    setUser(response.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
  }, [initializeCsrf]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await initializeCsrf();
    const response = await authApi.register({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      referralCode: payload.role === 'student' && typeof payload.referralCode === 'string' ? payload.referralCode : undefined,
      academicHandle: typeof payload.handle === 'string' ? payload.handle.trim().replace(/^@/, '').toLowerCase() : '',
    });
    // Registration does not create a session. The user must verify their email first.
    if (response.emailSent === undefined) throw new Error('Registration request did not complete. Please try again.');
    return { emailSent: response.emailSent, message: response.message };
  }, [initializeCsrf]);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
    const response = await academicApi.completeOnboarding(payload);
    setUser(response.user);
  }, []);
  const completePreAccountOnboarding = useCallback(async (token: string, payload: OnboardingPayload) => {
    await initializeCsrf();
    const response = await authApi.completePreAccountOnboarding(token, payload);
    setUser(response.user);
    clearPreAccountSession();
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
  }, [initializeCsrf]);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { clearSession(); }
  }, [clearSession]);
  const value = useMemo<AuthContextValue>(() => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, completeOnboarding, completePreAccountOnboarding, logout, refreshSession }), [user, isLoading, login, register, completeOnboarding, completePreAccountOnboarding, logout, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
