import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { StatsCardProps } from './StatsCard.types';
import './StatsCard.css';

export function StatsCard({ label, value, iconName, variant = 'primary', loading }: StatsCardProps) {
  if (loading) {
    return (
      <div className="stats-card-root">
        <Skeleton variant="circular" width="2.75rem" height="2.75rem" />
        <div style={{ flex: 1, marginLeft: '0.5rem' }}>
          <Skeleton variant="text" width="60%" height="0.85rem" />
          <Skeleton variant="text" width="40%" height="1.5rem" style={{ marginTop: '0.4rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stats-card-root">
      <div className={`stats-card-icon-container stats-card-icon-${variant}`}>
        <Icon name={iconName} />
      </div>
      <div>
        <p className="stats-card-label">{label}</p>
        <h3 className="stats-card-value">{value}</h3>
      </div>
    </div>
  );
}
