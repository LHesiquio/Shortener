import type { SkeletonProps } from './Skeleton.types';
import './Skeleton.css';

export function Skeleton({
  variant = 'text',
  width,
  height,
  borderRadius,
  className = '',
  style = {},
}: SkeletonProps) {
  const combinedStyle = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={`skeleton-root skeleton-${variant} ${className}`}
      style={combinedStyle}
    />
  );
}
