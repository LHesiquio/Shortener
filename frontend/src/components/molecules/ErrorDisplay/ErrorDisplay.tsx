import type { ErrorDisplayProps } from './ErrorDisplay.types';

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div>
      <p className="description" style={{ color: 'var(--status-error)' }}>
        Error al conectar con el servidor: {error}
      </p>
      <div className="status-badge">
        <span className="status-dot offline"></span>
        <span>Backend Offline</span>
      </div>
    </div>
  );
}
