import { useUserProfile } from '@/context/UserProfileContext';

export function useCurrentUser() {
  const { user } = useUserProfile();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.nickname ?? user?.email ?? 'User';

  let initials = 'U';
  if (user?.firstName) {
    const f = user.firstName[0] || '';
    const l = user.lastName ? user.lastName[0] : '';
    initials = (f + l).toUpperCase() || 'U';
  } else if (user?.email) {
    initials = user.email[0].toUpperCase();
  }

  return {
    user,
    initials,
    displayName,
    email: user?.email ?? '',
  };
}
