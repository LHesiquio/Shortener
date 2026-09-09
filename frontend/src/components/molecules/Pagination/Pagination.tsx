import { Icon } from '@/components/atoms/Icon/Icon';
import type { PaginationProps } from './Pagination.types';
import './Pagination.css';

function buildPageNumbers(current: number, total: number): number[] {
  const start = Math.max(1, current - 1);
  const end = Math.min(total, start + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

interface PaginationInfoProps {
  totalItems: number;
  currentPage: number;
  pageSize?: number;
  currentCount?: number;
  totalPages: number;
  itemLabel?: string;
}

function PaginationInfo({
  totalItems,
  currentPage,
  pageSize = 10,
  currentCount,
  totalPages,
  itemLabel = 'items',
}: PaginationInfoProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const count = currentCount !== undefined ? currentCount : pageSize;
  const end = Math.min(totalItems, (currentPage - 1) * pageSize + count);

  return (
    <div className="pagination-info-group">
      <span className="pagination-page-badge">
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>
      <span className="pagination-range-text">
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong> {itemLabel}
      </span>
    </div>
  );
}

interface ControlsProps {
  currentPage: number;
  totalPages: number;
  pages: number[];
  onPageChange: (page: number) => void;
}

function PaginationControls({ currentPage, totalPages, pages, onPageChange }: ControlsProps) {
  return (
    <nav className="pagination-nav" aria-label="Pagination Navigation">
      <button
        type="button"
        className="page-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <Icon name="chevron_left" size={18} />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`page-btn ${p === currentPage ? 'page-btn-active' : ''}`}
          onClick={() => onPageChange(p)}
          aria-label={`Page ${p}`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className="page-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <Icon name="chevron_right" size={18} />
      </button>
    </nav>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  currentCount,
  itemLabel,
  className = '',
}: PaginationProps) {
  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <div className={`pagination-container ${className}`.trim()}>
      {totalItems !== undefined ? (
        <PaginationInfo
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          currentCount={currentCount}
          totalPages={totalPages}
          itemLabel={itemLabel}
        />
      ) : <div />}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pages={pages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
