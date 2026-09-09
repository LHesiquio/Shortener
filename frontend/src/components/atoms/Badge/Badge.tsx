import type { BadgeProps } from './Badge.types';
import './Badge.css';

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`badge-root badge-variant-${variant} ${className}`}>
      {children}
    </span>
  );
}
