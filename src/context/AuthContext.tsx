import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { academicApi } from '../api/academic';
import { setCsrfToken } from '../lib/api/client';
import { clearPreAccountSession, savePreAccountSession } from '../lib/registration-session';
import type { User, UserRole } from '../types';

type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: Extract<UserRole, 'student' | 'lecturer' | 'reviewer'>;
  [key: string]: unknown;
};
type OnboardingPayload = Parameters<typeof academicApi.completeOnboarding>[0];
type AuthContextValue = { user: User | null; isAuthenticated: boolean; isLoading: boolean; login: (identifier: string, password: string, _role?: UserRole) => Promise<{ requiresOnboarding: boolean; requiresAdminMfa?: boolean; requiresReactivation?: boolean; setupRequired?: boolean; challengeToken?: string }>; startAdminMfaEnrollment: (challengeToken: string) => Promise<{ provisioningUri: string; secret: string }>; confirmAdminMfaEnrollment: (challengeToken: string, code: string) => Promise<string[]>; verifyAdminMfa: (challengeToken: string, code: string) => Promise<void>; register: (payload: RegisterPayload) => Promise<{ emailSent: boolean; message: string }>; completeOnboarding: (payload: OnboardingPayload) => Promise<void>; completePreAccountOnboarding: (token: string, payload: OnboardingPayload) => Promise<void>; logout: () => Promise<void>; refreshSession: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_USER_CACHE_KEY = 'sophis-central-session-user';

function readCachedUser(): User | null {
  try {
    const value = window.sessionStorage.getItem(SESSION_USER_CACHE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as User;
    if (!parsed || typeof parsed.id !== 'string' || !['student', 'lecturer', 'reviewer', 'moderator', 'admin', 'support'].includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  try {
    if (user) window.sessionStorage.setItem(SESSION_USER_CACHE_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
  } catch {
    // Session storage is optional; authentication remains cookie-based.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);
  const initializeCsrf = useCallback(async () => {
    const response = await authApi.csrf();
    setCsrfToken(response.csrfToken);
  }, []);
  const clearSession = useCallback(() => { setUser(null); cacheUser(null); setCsrfToken(null); }, []);
  // /auth/me already returns the stable public R2 profile-image URL.
  // Keep session restoration independent from any separate image-URL request.
  const refreshSession = useCallback(async () => {
    const response = await authApi.me();
    setUser(response.user);
    cacheUser(response.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      // A same-tab cached profile lets the app shell render immediately while the
      // cookie-backed session is verified in the background. API authorization
      // still relies exclusively on the server session cookie.
      const cachedUser = readCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        setIsLoading(false);
      }
      void initializeCsrf().catch(() => setCsrfToken(null));
      try {
        await refreshSession();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : '';
        const unauthorized = /status 401|status 403|unauthorized|session expired/i.test(message);
        if (unauthorized || !cachedUser) clearSession();
        // Transient network/cold-start errors retain same-tab UI state; API
        // requests remain cookie-authorized and can retry independently.
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
    if ('reactivationRequired' in response) {
      setUser(null);
      cacheUser(null);
      return { requiresOnboarding: false, requiresReactivation: true };
    }
    if ('adminMfaRequired' in response) {
      setUser(null);
      cacheUser(null);
      return { requiresOnboarding: false, requiresAdminMfa: true, setupRequired: response.setupRequired, challengeToken: response.challengeToken };
    }
    if (!('user' in response)) {
      savePreAccountSession({ ...response.preAccount, onboardingToken: response.onboardingToken });
      setUser(null);
      cacheUser(null);
      return { requiresOnboarding: true };
    }
    setUser(response.user);
    cacheUser(response.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
    return { requiresOnboarding: false };
  }, [initializeCsrf]);

  const startAdminMfaEnrollment = useCallback(async (challengeToken: string) => {
    await initializeCsrf();
    const result = await authApi.adminMfaEnrollmentStart(challengeToken);
    return { provisioningUri: result.provisioningUri, secret: result.secret };
  }, [initializeCsrf]);
  const confirmAdminMfaEnrollment = useCallback(async (challengeToken: string, code: string) => {
    await initializeCsrf();
    const result = await authApi.adminMfaEnrollmentConfirm(challengeToken, code);
    setUser(result.user);
    cacheUser(result.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
    return result.recoveryCodes;
  }, [initializeCsrf]);
  const verifyAdminMfa = useCallback(async (challengeToken: string, code: string) => {
    await initializeCsrf();
    const result = await authApi.adminMfaVerify(challengeToken, code);
    setUser(result.user);
    cacheUser(result.user);
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
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
    // The onboarding endpoint has successfully completed the profile; keep the
    // client route guard in sync even if the response contains a stale flag.
    setUser({ ...response.user, isProfileComplete: true });
    cacheUser({ ...response.user, isProfileComplete: true });
  }, []);
  const completePreAccountOnboarding = useCallback(async (token: string, payload: OnboardingPayload) => {
    await initializeCsrf();
    const response = await authApi.completePreAccountOnboarding(token, payload);
    // A successful pre-account conversion means profile onboarding is complete.
    setUser({ ...response.user, isProfileComplete: true });
    cacheUser({ ...response.user, isProfileComplete: true });
    clearPreAccountSession();
    try { window.localStorage.setItem('sophis-central-has-authenticated', 'true'); } catch { /* Storage is optional. */ }
    void authApi.csrf().then((refreshed) => setCsrfToken(refreshed.csrfToken)).catch(() => setCsrfToken(null));
  }, [initializeCsrf]);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { clearSession(); }
  }, [clearSession]);
  const value = useMemo<AuthContextValue>(() => ({ user, isAuthenticated: Boolean(user), isLoading, login, startAdminMfaEnrollment, confirmAdminMfaEnrollment, verifyAdminMfa, register, completeOnboarding, completePreAccountOnboarding, logout, refreshSession }), [user, isLoading, login, startAdminMfaEnrollment, confirmAdminMfaEnrollment, verifyAdminMfa, register, completeOnboarding, completePreAccountOnboarding, logout, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
