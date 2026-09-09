import type { ReactNode } from 'react';

export interface OfflineEmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void | Promise<unknown>;
  isRetrying?: boolean;
  fullScreen?: boolean;
  compact?: boolean;
  className?: string;
  actions?: ReactNode;
}
