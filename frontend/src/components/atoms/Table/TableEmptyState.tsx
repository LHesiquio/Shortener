import { Icon } from '@/components/atoms/Icon/Icon';
import type { TableEmptyStateProps } from './Table.types';

export function TableEmptyState({
  icon = 'mouse',
  title,
  description,
  actionLabel,
  onAction,
}: TableEmptyStateProps) {
  return (
    <div className="app-table-empty">
      <Icon name={icon} className="app-table-empty-icon" size={44} />
      <h3 className="app-table-empty-title">{title}</h3>
      {description && <p className="app-table-empty-desc">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="app-table-empty-btn" onClick={onAction}>
          <Icon name="add" size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
