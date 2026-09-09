import type { ButtonProps } from './Button.types';
import './Button.css';

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;

  return (
    <button className={baseClass.trim()} {...props}>
      {children}
    </button>
  );
}
