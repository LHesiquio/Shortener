import { IconButton } from '@/components/atoms/IconButton/IconButton';
import type { NotificationBellProps } from './NotificationBell.types';
import './NotificationBell.css';

function formatBadge(count: number): string {
  return count > 9 ? '9+' : String(count);
}

export function NotificationBell({ unreadCount, isOpen, onClick }: NotificationBellProps) {
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <span className="notification-bell">
      <IconButton
        icon="notifications"
        title="Notifications"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={isOpen ? 'notification-bell__button--active' : ''}
        onClick={onClick}
      />
      {unreadCount > 0 && (
        <span className="notification-bell__badge" aria-hidden="true">
          {formatBadge(unreadCount)}
        </span>
      )}
    </span>
  );
}
