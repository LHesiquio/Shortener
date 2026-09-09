import { useNetwork } from '@/context/NetworkContext';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { OfflineBannerProps } from './OfflineBanner.types';
import './OfflineBanner.css';

export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { isOnline, isChecking, checkConnection } = useNetwork();

  const handleRetry = () => {
    void checkConnection();
  };

  const isVisible = !isOnline;

  return (
    <div
      className={`offline-banner ${isVisible ? 'offline-banner--visible' : ''} ${className}`.trim()}
      role="alert"
      aria-live="assertive"
      aria-hidden={!isVisible}
    >
      <div className="offline-banner__icon">
        <Icon name="wifi_off" size={18} ariaLabel="Offline" />
      </div>
      <span className="offline-banner__text">
        You are currently offline. Check your network.
      </span>
      <button
        type="button"
        className="offline-banner__retry-btn"
        onClick={handleRetry}
        disabled={isChecking}
        aria-label="Check connection"
      >
        <Icon
          name={isChecking ? 'sync' : 'refresh'}
          size={14}
          className={isChecking ? 'offline-banner__spinner' : ''}
        />
        <span>{isChecking ? 'Checking...' : 'Retry'}</span>
      </button>
    </div>
  );
}
