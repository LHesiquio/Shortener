import type React from 'react';
import type { IconInput, SpringPreset, MorphOptions } from 'morphicons/react';

export interface IconProps {
  name?: string;
  icon?: IconInput;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  spring?: SpringPreset | MorphOptions;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  ariaLabel?: string;
  role?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

