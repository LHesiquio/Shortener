import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { QuickStatsHeader } from '@/components/organisms/QuickStatsHeader/QuickStatsHeader';
import { ManageLinksTable } from '@/components/organisms/ManageLinksTable/ManageLinksTable';
import { NewLinkDrawer } from '@/components/organisms/NewLinkDrawer/NewLinkDrawer';
import { ClicksLogDrawer } from '@/components/organisms/ClicksLogDrawer/ClicksLogDrawer';
import { DeleteConfirmModal } from '@/components/molecules/DeleteConfirmModal/DeleteConfirmModal';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { PublicShortlink } from '@/types/shortlink.types';
import './DashboardPage.css';

interface ClicksLogState {
  isOpen: boolean;
  shortlinkId?: string;
  slug?: string;
}

function DashboardCanvas({
  dash,
  onOpenClicksLog,
}: {
  dash: ReturnType<typeof useDashboard>;
  onOpenClicksLog: (shortlink?: PublicShortlink) => void;
}) {
  return (
    <div className="dashboard-canvas">
      {dash.error && <div className="dashboard-error-banner"><Icon name="error" /><span>{dash.error}</span></div>}
      <QuickStatsHeader
        items={dash.items}
        totalItems={dash.totalItems}
        topLinkSlug={dash.topLinkSlug}
        totalClicks={dash.totalClicks}
        loading={dash.loading}
      />
      <ManageLinksTable
        items={dash.items}
        loading={dash.loading}
        totalItems={dash.totalItems}
        currentPage={dash.currentPage}
        pageSize={dash.pageSize}
        onEdit={dash.openEditDrawer}
        onDelete={dash.setDeleteTarget}
        onToggleActive={dash.handleToggleActive}
        onViewClicks={(link) => onOpenClicksLog(link)}
        onPageChange={dash.setCurrentPage}
        onAddLink={dash.openAddDrawer}
      />
    </div>
  );
}

function DashboardDrawers({
  dash,
  clicksLogState,
  onCloseClicksLog,
}: {
  dash: ReturnType<typeof useDashboard>;
  clicksLogState: ClicksLogState;
  onCloseClicksLog: () => void;
}) {
  return (
    <>
      <NewLinkDrawer
        isOpen={dash.drawerOpen}
        editTarget={dash.editTarget}
        initialUrl={dash.initialUrl}
        saving={dash.saving}
        error={dash.drawerError}
        onClose={dash.closeDrawer}
        onSave={dash.handleSaveLink}
      />
      <ClicksLogDrawer
        isOpen={clicksLogState.isOpen}
        shortlinkId={clicksLogState.shortlinkId}
        slug={clicksLogState.slug}
        onClose={onCloseClicksLog}
      />
      <DeleteConfirmModal
        shortlink={dash.deleteTarget}
        deleting={dash.deleting}
        onConfirm={() => void dash.handleDeleteConfirm()}
        onCancel={() => dash.setDeleteTarget(null)}
      />
    </>
  );
}

export function DashboardPage() {
  const dash = useDashboard();
  const [clicksLogState, setClicksLogState] = useState<ClicksLogState>({ isOpen: false });

  const handleOpenClicksLog = (shortlink?: PublicShortlink) => {
    setClicksLogState({ isOpen: true, shortlinkId: shortlink?.id, slug: shortlink?.slug });
  };

  return (
    <div className="dashboard-layout">
      <SidebarNav onAddLink={() => dash.openAddDrawer()} />
      <main className="dashboard-main">
        <TopAppBar
          search={dash.search}
          onSearchChange={dash.setSearch}
          onLogout={dash.handleLogout}
          onOpenCreateLink={() => dash.openAddDrawer()}
        />
        <DashboardCanvas dash={dash} onOpenClicksLog={handleOpenClicksLog} />
      </main>
      <MobileBottomNav onAddLink={() => dash.openAddDrawer()} />
      <DashboardDrawers
        dash={dash}
        clicksLogState={clicksLogState}
        onCloseClicksLog={() => setClicksLogState((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
