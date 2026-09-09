import type {
  TableSectionProps,
  TableWrapperProps,
  TableProps,
  TableHeaderProps,
  TableHeadCellProps,
  TableRowProps,
  TableCellProps,
} from './Table.types';
import './Table.css';

export function TableSection({ children, className = '', style }: TableSectionProps) {
  return (
    <section className={`app-table-section ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

export function TableWrapper({ children, className = '', style }: TableWrapperProps) {
  return (
    <div className={`app-table-wrapper ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function Table({ children, className = '', style }: TableProps) {
  return (
    <table className={`app-table ${className}`.trim()} style={style}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return <thead className={`app-table-head ${className}`.trim()}>{children}</thead>;
}

export function TableHeadCell({ children, align = 'left', className = '', style }: TableHeadCellProps) {
  const alignClass = `app-table-align-${align}`;
  return (
    <th className={`app-table-th ${alignClass} ${className}`.trim()} style={style}>
      {children}
    </th>
  );
}

export function TableRow({ children, className = '', onClick, hoverable = true }: TableRowProps) {
  const hoverClass = hoverable ? 'app-table-row--hoverable' : '';
  return (
    <tr className={`app-table-row ${hoverClass} ${className}`.trim()} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TableCell({ children, align = 'left', className = '', style, colSpan }: TableCellProps) {
  const alignClass = `app-table-align-${align}`;
  return (
    <td className={`app-table-td ${alignClass} ${className}`.trim()} style={style} colSpan={colSpan}>
      {children}
    </td>
  );
}
