import type React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'danger-active';
  title?: string;
  /** Preferred side; the tooltip flips automatically when it would overflow. */
  tooltipPosition?: 'top' | 'bottom';
}
