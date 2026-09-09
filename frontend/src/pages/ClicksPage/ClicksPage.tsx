import { Icon } from '@/components/atoms/Icon/Icon';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { ExportLogsModal } from '@/components/organisms/ExportLogsModal/ExportLogsModal';
import {
  TableSection,
  TableWrapper,
  Table,
  TableHeader,
  TableHeadCell,
  TableSkeleton,
  TableEmptyState,
} from '@/components/atoms/Table';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import { useClicksPage } from './useClicksPage';
import { ClicksTableRow } from './ClicksTableRow';
import './ClicksPage.css';

const RANGES = ['24h', '7d', '30d', 'all'];

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  range: string;
  onRangeChange: (r: string) => void;
  onExport: () => void;
}

function ClicksPageHeaderSection({ userTimezone }: { userTimezone: string }) {
  return (
    <div className="clicks-page-table-header">
      <div className="clicks-page-title-group">
        <h2 className="clicks-page-title">Click Logs & Audit</h2>
        <p className="clicks-page-subtitle">
          Real-time event streams, visitor geolocations, devices, referrers and security metrics in {userTimezone}. Filter by date range or keyword, or export full audit logs.
        </p>
      </div>
    </div>
  );
}

function ClicksPageToolbar({
  search,
  onSearchChange,
  range,
  onRangeChange,
  onExport,
}: ToolbarProps) {
  return (
    <div className="clicks-page-toolbar">
      <div className="clicks-page-search-wrapper">
        <Icon name="search" className="clicks-page-search-icon" size={18} />
        <input
          type="text"
          className="clicks-page-search-input"
          placeholder="Search by slug, IP, location or device..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="clicks-page-actions">
        <div className="clicks-page-range-group">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`clicks-page-range-btn ${range === r ? 'active' : ''}`}
              onClick={() => onRangeChange(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <button type="button" className="clicks-page-export-btn" onClick={onExport}>
          <Icon name="download" size={16} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}

function ClicksPageTableHead({ userTimezone }: { userTimezone: string }) {
  return (
    <TableHeader>
      <tr>
        <TableHeadCell>Timestamp ({userTimezone})</TableHeadCell>
        <TableHeadCell>Slug</TableHeadCell>
        <TableHeadCell>Location</TableHeadCell>
        <TableHeadCell>Device & OS</TableHeadCell>
        <TableHeadCell>Referrer</TableHeadCell>
      </tr>
    </TableHeader>
  );
}

interface BodyProps {
  isLoading: boolean;
  isError: boolean;
  data: ReturnType<typeof useClicksPage>['data'];
  userTimezone: string;
  onRetry: () => void;
}

function ClicksPageBody({ isLoading, isError, data, userTimezone, onRetry }: BodyProps) {
  if (isLoading) return <TableSkeleton rows={6} columns={5} />;
  if (isError) {
    return (
      <tbody>
        <tr>
          <td colSpan={5}>
            <div className="clicks-page-state">
              <Icon name="error" size={32} />
              <p>Failed to load click logs.</p>
              <button type="button" className="clicks-page-retry-btn" onClick={onRetry}>Retry</button>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }
  return (
    <tbody>
      {data?.clicks.map((c) => (
        <ClicksTableRow key={c.id} click={c} userTimezone={userTimezone} />
      ))}
    </tbody>
  );
}

function ClicksPageTableArea({ page, showEmpty }: { page: ReturnType<typeof useClicksPage>; showEmpty: boolean }) {
  if (showEmpty) {
    return (
      <TableEmptyState
        icon="mouse"
        title="No click logs recorded"
        description="Click logs will appear here once visitors start clicking your links."
      />
    );
  }
  return (
    <TableWrapper>
      <Table>
        <ClicksPageTableHead userTimezone={page.userTimezone} />
        <ClicksPageBody
          isLoading={page.isLoading}
          isError={page.isError}
          data={page.data}
          userTimezone={page.userTimezone}
          onRetry={page.refetch}
        />
      </Table>
    </TableWrapper>
  );
}

function ClicksPagePaginationArea({ page }: { page: ReturnType<typeof useClicksPage> }) {
  if (!page.data || page.data.totalCount === 0) return null;
  return (
    <Pagination
      currentPage={page.page}
      totalPages={page.data.totalPages}
      totalItems={page.data.totalCount}
      pageSize={15}
      currentCount={page.data.clicks.length}
      itemLabel="clicks"
      onPageChange={page.setPage}
    />
  );
}

function ClicksPageContent({ page }: { page: ReturnType<typeof useClicksPage> }) {
  const showEmpty = !page.isLoading && (!page.data || page.data.clicks.length === 0) && !page.isError;

  return (
    <TableSection>
      <ClicksPageHeaderSection userTimezone={page.userTimezone} />
      <ClicksPageToolbar
        search={page.search}
        onSearchChange={page.setSearch}
        range={page.range}
        onRangeChange={page.setRange}
        onExport={page.handleOpenExportModal}
      />
      <ClicksPageTableArea page={page} showEmpty={showEmpty} />
      <ClicksPagePaginationArea page={page} />
    </TableSection>
  );
}

export function ClicksPage() {
  const page = useClicksPage();

  return (
    <div className="clicks-page-layout">
      <SidebarNav />
      <main className="clicks-page-main">
        <TopAppBar onLogout={page.handleLogout} />
        <div className="clicks-page-canvas">
          <ClicksPageContent page={page} />
        </div>
      </main>
      <MobileBottomNav />
      <ExportLogsModal
        isOpen={page.isExportModalOpen}
        onClose={page.handleCloseExportModal}
      />
    </div>
  );
}
