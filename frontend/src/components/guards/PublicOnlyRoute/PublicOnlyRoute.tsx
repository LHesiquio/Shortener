import { Navigate } from 'react-router-dom';
import { useUserProfile } from '@/context/UserProfileContext';
import type { PublicOnlyRouteProps } from './PublicOnlyRoute.types';

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));
  const { user, isLoading, isError } = useUserProfile();

  if (!hasToken || isError) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--surface, #fafaf3)', fontFamily: 'var(--font-body-lg)' }}>
        Verifying session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
