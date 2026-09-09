export interface StatusToggleProps {
  active: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}
