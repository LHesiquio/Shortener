import { Icon } from '@/components/atoms/Icon/Icon';
import type { OfflineEmptyStateProps } from './OfflineEmptyState.types';
import './OfflineEmptyState.css';

export function OfflineEmptyState({
  title = 'No Internet Connection',
  description = 'You appear to be offline. Please check your network connection or Wi-Fi settings and try again.',
  onRetry,
  isRetrying = false,
  fullScreen = false,
  compact = false,
  className = '',
  actions,
}: OfflineEmptyStateProps) {
  const iconSize = compact ? 28 : 40;
  const modifierClasses = [
    fullScreen ? 'offline-empty-state--fullscreen' : '',
    compact ? 'offline-empty-state--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`offline-empty-state ${modifierClasses}`.trim()}
      role="region"
      aria-label="Offline indicator"
    >
      <div className="offline-empty-state__icon-wrapper">
        <div className="offline-empty-state__icon-halo" aria-hidden="true" />
        <Icon
          name="wifi_off"
          size={iconSize}
          ariaLabel="Offline icon"
        />
      </div>

      <div className="offline-empty-state__badge">
        <span className="offline-empty-state__badge-dot" aria-hidden="true" />
        <span>Offline</span>
      </div>

      <h3 className="offline-empty-state__title">{title}</h3>
      <p className="offline-empty-state__description">{description}</p>

      <div className="offline-empty-state__actions">
        {onRetry && (
          <button
            type="button"
            className="offline-empty-state__retry-btn"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <Icon
              name={isRetrying ? 'sync' : 'refresh'}
              size={18}
              className={isRetrying ? 'offline-empty-state__spinner' : ''}
            />
            <span>{isRetrying ? 'Checking...' : 'Try Reconnecting'}</span>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
