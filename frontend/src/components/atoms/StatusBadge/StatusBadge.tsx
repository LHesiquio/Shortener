import type { StatusBadgeProps } from './StatusBadge.types';

export function StatusBadge({ connected }: StatusBadgeProps) {
  const dotClass = connected ? 'online' : 'offline';
  const label = connected ? 'MongoDB Conectado' : 'MongoDB Desconectado';

  return (
    <div className="status-badge">
      <span className={`status-dot ${dotClass}`}></span>
      <span>{label}</span>
    </div>
  );
}
