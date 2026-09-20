import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import type { NotificationKind } from '@/context/NotificationContext.types';
import { formatLocalizedTooltip } from '@/utils/date.utils';
import type { NotificationEventItemProps } from './NotificationCenter.types';

const EVENT_ICONS: Record<NotificationKind, string> = {
  'export-started': 'schedule',
  'export-completed': 'check_circle',
  'export-failed': 'error',
  info: 'info',
};

export function NotificationEventItem({
  notification,
  timezone,
  onDismiss,
}: NotificationEventItemProps) {
  const icon = EVENT_ICONS[notification.kind] ?? 'info';

  return (
    <div className={`notification-event notification-event--${notification.kind}`}>
      <div className="notification-event__icon">
        <Icon name={icon} size={18} />
      </div>
      <div className="notification-event__body">
        <p className="notification-event__title">{notification.title}</p>
        <p className="notification-event__text">{notification.body}</p>
        <span className="notification-event__time">
          {formatLocalizedTooltip(new Date(notification.createdAt), timezone)}
        </span>
      </div>
      <IconButton icon="close" title="Dismiss" onClick={() => onDismiss(notification.id)} />
    </div>
  );
}
