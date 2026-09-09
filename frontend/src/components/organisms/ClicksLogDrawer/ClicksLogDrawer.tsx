import { createPortal } from 'react-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import {
  TableWrapper,
  Table,
  TableHeader,
  TableHeadCell,
  TableSkeleton,
} from '@/components/atoms/Table';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import type { ClicksLogDrawerProps } from './ClicksLogDrawer.types';
import { useClicksLogDrawer } from './useClicksLogDrawer';
import { ClicksLogRow } from './ClicksLogRow';
import './ClicksLogDrawer.css';

interface HeaderProps {
  slug?: string;
  userTimezone: string;
  onClose: () => void;
}

function ClicksLogHeader({ slug, userTimezone, onClose }: HeaderProps) {
  return (
    <div className="clicks-drawer-header">
      <div className="clicks-drawer-title-group">
        <h2 className="clicks-drawer-title">
          {slug ? `Click Logs for /${slug}` : 'All Click Logs'}
        </h2>
        <span className="clicks-drawer-subtitle">
          Real-time access logs in {userTimezone}
        </span>
      </div>
      <button
        type="button"
        className="clicks-drawer-close-btn"
        onClick={onClose}
        aria-label="Close click logs drawer"
      >
        <Icon name="close" />
      </button>
    </div>
  );
}

const RANGES = ['24h', '7d', '30d', 'all'];

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  range: string;
  onRangeChange: (r: string) => void;
}

function ClicksLogToolbar({
  search,
  onSearchChange,
  range,
  onRangeChange,
}: ToolbarProps) {
  return (
    <div className="clicks-drawer-toolbar">
      <div className="clicks-drawer-search-wrapper">
        <Icon name="search" className="clicks-drawer-search-icon" size={17} />
        <input
          type="text"
          className="clicks-drawer-search-input"
          placeholder="Filter by IP, country, referrer or user agent..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="clicks-drawer-filters">
        <div className="clicks-drawer-range-group">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`clicks-drawer-range-btn ${range === r ? 'active' : ''}`}
              onClick={() => onRangeChange(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TableProps {
  data: ReturnType<typeof useClicksLogDrawer>['data'];
  slug?: string;
  userTimezone: string;
}

function ClicksLogTable({ data, slug, userTimezone }: TableProps) {
  return (
    <TableWrapper className="clicks-drawer-table-wrapper">
      <Table>
        <TableHeader>
          <tr>
            <TableHeadCell>Timestamp ({userTimezone})</TableHeadCell>
            {!slug && <TableHeadCell>Slug</TableHeadCell>}
            <TableHeadCell>Location</TableHeadCell>
            <TableHeadCell>Device & OS</TableHeadCell>
            <TableHeadCell>Referrer</TableHeadCell>
          </tr>
        </TableHeader>
        <tbody>
          {data?.clicks.map((c) => (
            <ClicksLogRow key={c.id} click={c} slug={slug} userTimezone={userTimezone} />
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
}

interface BodyProps {
  isLoading: boolean;
  isError: boolean;
  data: ReturnType<typeof useClicksLogDrawer>['data'];
  slug?: string;
  userTimezone: string;
  onRetry: () => void;
}

function ClicksLogStatusState({ isError, onRetry }: { isError: boolean; onRetry: () => void }) {
  if (isError) {
    return (
      <div className="clicks-drawer-state error">
        <Icon name="error" />
        <p>Failed to load click logs.</p>
        <button type="button" className="clicks-drawer-retry-btn" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return (
    <div className="clicks-drawer-state empty">
      <Icon name="mouse" />
      <p>No click logs recorded for this selection.</p>
    </div>
  );
}

function isClicksLogEmpty(data?: ReturnType<typeof useClicksLogDrawer>['data']): boolean {
  return !data || data.clicks.length === 0;
}

function ClicksLogBody({ isLoading, isError, data, slug, userTimezone, onRetry }: BodyProps) {
  if (isLoading) {
    return (
      <TableWrapper className="clicks-drawer-table-wrapper">
        <Table>
          <TableSkeleton rows={5} columns={slug ? 4 : 5} />
        </Table>
      </TableWrapper>
    );
  }
  if (isError || isClicksLogEmpty(data)) {
    return <ClicksLogStatusState isError={isError} onRetry={onRetry} />;
  }
  return <ClicksLogTable data={data} slug={slug} userTimezone={userTimezone} />;
}

interface PanelProps {
  props: ClicksLogDrawerProps;
  drawer: ReturnType<typeof useClicksLogDrawer>;
  closeClass: string;
}

function ClicksLogPanel({ props, drawer, closeClass }: PanelProps) {
  return (
    <div className={`clicks-drawer-panel ${closeClass}`} role="dialog" aria-modal="true">
      <ClicksLogHeader slug={props.slug} userTimezone={drawer.userTimezone} onClose={props.onClose} />
      <ClicksLogToolbar search={drawer.search} onSearchChange={drawer.setSearch} range={drawer.range} onRangeChange={drawer.setRange} />
      <div className="clicks-drawer-body">
        <ClicksLogBody
          isLoading={drawer.isLoading}
          isError={drawer.isError}
          data={drawer.data}
          slug={props.slug}
          userTimezone={drawer.userTimezone}
          onRetry={drawer.refetch}
        />
      </div>
      {drawer.data && drawer.data.totalCount > 0 && (
        <div className="clicks-drawer-footer">
          <Pagination
            currentPage={drawer.page}
            totalPages={drawer.data.totalPages}
            totalItems={drawer.data.totalCount}
            pageSize={20}
            currentCount={drawer.data.clicks.length}
            itemLabel="clicks"
            onPageChange={drawer.setPage}
          />
        </div>
      )}
    </div>
  );
}

export function ClicksLogDrawer(props: ClicksLogDrawerProps) {
  const { rendered, closing } = useDrawerAnimation(props.isOpen);
  const drawer = useClicksLogDrawer(props);

  if (!rendered) return null;
  const closeClass = closing ? 'closing' : '';

  const drawerNode = (
    <>
      <div className={`clicks-drawer-backdrop ${closeClass}`} role="presentation" onClick={props.onClose} />
      <ClicksLogPanel props={props} drawer={drawer} closeClass={closeClass} />
    </>
  );

  return createPortal(drawerNode, document.body);
}
