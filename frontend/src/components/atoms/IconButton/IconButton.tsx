import { Icon } from '@/components/atoms/Icon/Icon';
import type { IconButtonProps } from './IconButton.types';
import './IconButton.css';

export function IconButton({
  icon,
  variant = 'default',
  className = '',
  title,
  tooltipPosition = 'top',
  ...props
}: IconButtonProps) {
  const variantClass = variant === 'default' ? '' : `icon-btn-${variant}`;

  return (
    <div className="icon-btn-wrapper">
      <button
        type="button"
        className={`icon-btn-root ${variantClass} ${className}`}
        aria-label={title || props['aria-label']}
        {...props}
      >
        <Icon name={icon} />
      </button>
      {title && (
        <span className={`icon-btn-tooltip icon-btn-tooltip-${tooltipPosition}`} role="tooltip">
          {title}
        </span>
      )}
    </div>
  );
}
