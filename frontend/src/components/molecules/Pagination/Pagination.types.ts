export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  currentCount?: number;
  itemLabel?: string;
  className?: string;
}
