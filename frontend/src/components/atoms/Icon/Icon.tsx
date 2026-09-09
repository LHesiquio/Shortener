import { MorphIcon } from 'morphicons/react';
import { resolveIconNode } from './iconMap';
import type { IconProps } from './Icon.types';
import './Icon.css';

export function Icon({
  name,
  icon,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  spring = 'snappy',
  className = '',
  style,
  title,
  ariaLabel,
  role,
  onClick
}: IconProps) {
  const iconNode = icon ?? resolveIconNode(name);

  return (
    <span
      className={`morph-icon-atom ${className}`}
      style={style}
      role={role}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
    >
      <MorphIcon
        icon={iconNode}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        spring={spring}
      />
    </span>
  );
}

