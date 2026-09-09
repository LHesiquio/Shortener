import { useState } from 'react';
import { Icon } from '@/components/atoms/Icon/Icon';
import {
  TableSection,
  TableWrapper,
  Table,
  TableSkeleton,
  TableEmptyState,
} from '@/components/atoms/Table';
import { Pagination } from '@/components/molecules/Pagination/Pagination';
import type { PublicShortlink } from '@/types/shortlink.types';
import type { ManageLinksTableProps } from './ManageLinksTable.types';
import { TableHead } from './TableHead';
import { ShortlinkRow } from './ShortlinkRow';
import { TableQuickCreateBar, TableSearchToolbar } from './TableToolbars';
import './ManageLinksTable.css';

function useCopySlug() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return { copiedSlug, copyToClipboard };
}

function TableSectionHeader({
  onViewGlobalClicks,
  hasBottomBorder,
}: {
  onViewGlobalClicks?: () => void;
  hasBottomBorder?: boolean;
}) {
  const borderClass = hasBottomBorder ? 'table-section-header--bordered' : '';
  return (
    <div className={`table-section-header ${borderClass}`.trim()}>
      <div className="table-section-title-group">
        <h2 className="table-section-title">Manage Links</h2>
        <p className="table-section-subtitle">
          Overview and controls for all your shortlinks. Click on any shortlink to copy, toggle status, click the clicks badge to view event logs, or use the action buttons to edit or delete.
        </p>
      </div>
      {onViewGlobalClicks && (
        <button
          type="button"
          className="table-clicks-log-btn"
          onClick={onViewGlobalClicks}
        >
          <Icon name="ads_click" /> View Clicks Log
        </button>
      )}
    </div>
  );
}

function TableRowsContent({
  loading,
  items,
  props,
  copyToClipboard,
  copiedSlug,
}: {
  loading: boolean;
  items: PublicShortlink[];
  props: ManageLinksTableProps;
  copyToClipboard: (slug: string) => void;
  copiedSlug: string | null;
}) {
  if (loading) return <TableSkeleton rows={5} columns={7} />;
  return (
    <tbody>
      {items.map((link) => (
        <ShortlinkRow
          key={link.id}
          shortlink={link}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onToggleActive={props.onToggleActive}
          onViewClicks={props.onViewClicks}
          copyToClipboard={copyToClipboard}
          copiedSlug={copiedSlug}
        />
      ))}
    </tbody>
  );
}

function ManageLinksPagination({
  hasItems,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  currentCount,
  onPageChange,
}: {
  hasItems: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  currentCount: number;
  onPageChange: (page: number) => void;
}) {
  if (!hasItems) return null;
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      currentCount={currentCount}
      itemLabel="shortlinks"
      onPageChange={onPageChange}
    />
  );
}

interface TableBodyProps {
  showEmpty: boolean;
  loading: boolean;
  items: PublicShortlink[];
  props: ManageLinksTableProps;
  copyToClipboard: (slug: string) => void;
  copiedSlug: string | null;
}

function ManageLinksTableBody({
  showEmpty,
  loading,
  items,
  props,
  copyToClipboard,
  copiedSlug,
}: TableBodyProps) {
  if (showEmpty) {
    return (
      <TableEmptyState
        icon="link_off"
        title="No shortlinks found"
        description="Get started by creating your first shortlink using the quick bar above or the drawer."
        actionLabel="Create Shortlink"
        onAction={props.onAddLink}
      />
    );
  }

  return (
    <TableWrapper>
      <Table>
        <TableHead />
        <TableRowsContent
          loading={loading}
          items={items}
          props={props}
          copyToClipboard={copyToClipboard}
          copiedSlug={copiedSlug}
        />
      </Table>
    </TableWrapper>
  );
}

function TableToolbarArea({
  showCreate,
  showSearch,
  onAddLink,
  search,
  onSearchChange,
}: {
  showCreate: boolean;
  showSearch: boolean;
  onAddLink: (url?: string) => void;
  search?: string;
  onSearchChange?: (v: string) => void;
}) {
  if (showCreate) {
    return <TableQuickCreateBar onAdd={onAddLink} />;
  }
  if (showSearch && onSearchChange) {
    return <TableSearchToolbar search={search} onSearchChange={onSearchChange} />;
  }
  return null;
}

export function ManageLinksTable(props: ManageLinksTableProps) {
  const { copiedSlug, copyToClipboard } = useCopySlug();
  const totalPages = Math.max(1, Math.ceil(props.totalItems / props.pageSize));
  const hasItems = !props.loading && props.items.length > 0;
  const showEmpty = !props.loading && props.items.length === 0;
  const showCreate = props.showQuickCreate !== false;
  const showSearch = !showCreate && Boolean(props.onSearchChange);

  return (
    <TableSection>
      <TableSectionHeader onViewGlobalClicks={props.onViewGlobalClicks} hasBottomBorder={!showCreate && !showSearch} />
      <TableToolbarArea
        showCreate={showCreate}
        showSearch={showSearch}
        onAddLink={props.onAddLink}
        search={props.search}
        onSearchChange={props.onSearchChange}
      />
      <ManageLinksTableBody
        showEmpty={showEmpty}
        loading={props.loading}
        items={props.items}
        props={props}
        copyToClipboard={copyToClipboard}
        copiedSlug={copiedSlug}
      />
      <ManageLinksPagination
        hasItems={hasItems}
        currentPage={props.currentPage}
        totalPages={totalPages}
        totalItems={props.totalItems}
        pageSize={props.pageSize}
        currentCount={props.items.length}
        onPageChange={props.onPageChange}
      />
    </TableSection>
  );
}
