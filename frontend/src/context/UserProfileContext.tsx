/**
 * UserProfileContext.tsx
 *
 * Global context that exposes the authenticated user's profile to any
 * component without duplicating `useQuery(['auth-me'])` calls everywhere.
 *
 * Internally backed by TanStack Query, so data is shared from cache.
 * Components consume it via `useUserProfile()` — no extra network requests.
 */

import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { PublicUser } from '@/types/api';

interface UserProfileContextValue {
  /** The authenticated user's profile, or undefined while loading. */
  user: PublicUser | undefined;
  /** True while the first fetch is in-flight. */
  isLoading: boolean;
  /** True if the user profile fetch failed (e.g. 401 unauthenticated). */
  isError: boolean;
  /**
   * The resolved IANA timezone to use for all date display.
   * Priority: user.timezone (DB) > browser detection > 'UTC'
   */
  userTimezone: string;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: ({ signal }) => authService.getMe(signal),
    enabled: hasToken,
    retry: false,
    // Stale for 5 min — aligned with queryClient defaultOptions in App.tsx
    staleTime: 1000 * 60 * 5,
  });

  const storedTz = user?.timezone?.trim();
  const userTimezone =
    storedTz && storedTz !== 'auto'
      ? storedTz
      : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const contextValue = useMemo(
    () => ({ user, isLoading, isError, userTimezone }),
    [user, isLoading, isError, userTimezone]
  );

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

/**
 * Returns the global user profile and resolved timezone.
 * Must be called inside a component tree that is wrapped by `UserProfileProvider`.
 */
export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used inside <UserProfileProvider>');
  return ctx;
}
