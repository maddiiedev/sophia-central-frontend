import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Array<'student' | 'lecturer' | 'moderator' | 'admin'>;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="p-6 text-slate-300">Loading your workspace…</div>;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'moderator' || user.role === 'admin' ? '/moderation' : '/dashboard'} replace />;
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
