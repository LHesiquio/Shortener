import { Navigate } from 'react-router-dom';
import { useUserProfile } from '@/context/UserProfileContext';
import { PageSkeleton } from '@/components/molecules/PageSkeleton/PageSkeleton';
import type { ProtectedRouteProps } from './ProtectedRoute.types';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));
  const { user, isLoading, isError } = useUserProfile();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || (!user && !isError)) {
    return <PageSkeleton />;
  }

  if (isError || !user) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
