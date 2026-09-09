import { APP_CONFIG } from '@/config/app.config';
import type { ReleaseBadgeProps } from './ReleaseBadge.types';
import './ReleaseBadge.css';

export function ReleaseBadge({
  stage = APP_CONFIG.releaseStage,
  className = '',
  size = 'sm',
  variant = 'default',
}: ReleaseBadgeProps) {
  const classes = `release-badge release-badge--${size} release-badge--${variant} ${className}`.trim();
  return <span className={classes}>{stage}</span>;
}
