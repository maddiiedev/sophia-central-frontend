import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Array<'student' | 'lecturer' | 'reviewer' | 'moderator' | 'admin'>;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="p-6 text-slate-300">Loading your workspace…</div>;
  if (!isAuthenticated || !user) {
    let hasAuthenticatedBefore = false;
    try {
      hasAuthenticatedBefore = window.localStorage.getItem('sophis-central-has-authenticated') === 'true';
    } catch {
      // If browser storage is unavailable, use the first-visit registration path.
    }
    const redirectTo = location.pathname === '/library' && !hasAuthenticatedBefore ? '/onboarding' : '/login';
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'reviewer' || user.role === 'moderator' || user.role === 'admin' ? '/moderation' : '/dashboard'} replace />;
  }

  if (
    (user.role === 'student' || user.role === 'lecturer') &&
    user.isProfileComplete === false &&
    location.pathname !== '/onboarding/profile'
  ) {
    return <Navigate to="/onboarding/profile" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
