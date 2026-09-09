import type { ReactNode, CSSProperties } from 'react';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableSectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface TableWrapperProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface TableProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface TableHeadCellProps {
  children?: ReactNode;
  align?: TableAlign;
  className?: string;
  style?: CSSProperties;
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export interface TableCellProps {
  children?: ReactNode;
  align?: TableAlign;
  className?: string;
  style?: CSSProperties;
  colSpan?: number;
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export interface TableEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
