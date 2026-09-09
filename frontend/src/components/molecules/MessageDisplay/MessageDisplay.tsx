import { StatusBadge } from '@/components/atoms/StatusBadge/StatusBadge';
import type { MessageDisplayProps } from './MessageDisplay.types';

export function MessageDisplay({ data }: MessageDisplayProps) {
  return (
    <div>
      <p className="description">{data.message}</p>
      <StatusBadge connected={data.mongoConnected} />
      {data.collectionsCount !== undefined && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Colecciones existentes: {data.collectionsCount}
        </p>
      )}
    </div>
  );
}
