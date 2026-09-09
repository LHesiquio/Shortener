import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { TableSkeletonProps } from './Table.types';

export function TableSkeleton({ rows = 5, columns = 5, className = '' }: TableSkeletonProps) {
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  return (
    <tbody className={className}>
      {rowList.map((_, rIdx) => (
        <tr key={rIdx} className="app-table-row">
          {colList.map((_, cIdx) => (
            <td key={cIdx} className="app-table-td">
              <Skeleton
                width={cIdx === 0 ? '120px' : cIdx === 1 ? '160px' : '90px'}
                height="1.25rem"
                borderRadius="6px"
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
