import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({
  children,
  allowedRoles,
  requiresReviewerAccess = false,
}: {
  children: ReactNode;
  allowedRoles: Array<'student' | 'lecturer' | 'reviewer' | 'moderator' | 'support' | 'admin'>;
  requiresReviewerAccess?: boolean;
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
    return <Navigate to={user.role === 'moderator' ? '/moderation' : user.role === 'support' ? '/support' : user.role === 'reviewer' ? '/reviewer/dashboard' : user.role === 'admin' ? '/admin' : user.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard'} replace />;
  }

  if (requiresReviewerAccess && user.role !== 'admin' && user.role !== 'moderator' && user.hasReviewerAccess !== true) {
    return <Navigate to={user.role === 'student' || user.role === 'lecturer' ? (user.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard') : user.role === 'reviewer' ? '/profile' : '/login'} replace />;
  }

  if (
    (user.role === 'student' || user.role === 'lecturer') &&
    user.isProfileComplete === false &&
    location.pathname !== '/student/onboarding/profile' && location.pathname !== '/lecturer/onboarding/profile'
  ) {
    return <Navigate to={user.role === 'lecturer' ? '/lecturer/onboarding/profile' : '/student/onboarding/profile'} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
