import type { StatusToggleProps } from './StatusToggle.types';
import './StatusToggle.css';

export function StatusToggle({
  active,
  onToggle,
  disabled = false,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  size = 'md',
  className = '',
}: StatusToggleProps) {
  const activeClass = active ? 'status-toggle-root--active' : 'status-toggle-root--inactive';
  const sizeClass = size === 'sm' ? 'status-toggle-root--sm' : '';
  const label = active ? activeLabel : inactiveLabel;

  return (
    <button
      type="button"
      className={`status-toggle-root ${activeClass} ${sizeClass} ${className}`.trim()}
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={active}
      title={`Status: ${label}. Click to switch to ${active ? inactiveLabel : activeLabel}`}
    >
      <span className="status-toggle-indicator" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
