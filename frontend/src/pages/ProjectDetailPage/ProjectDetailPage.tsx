import { useState } from 'react';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { ProjectHeader } from '@/components/organisms/ProjectHeader/ProjectHeader';
import { ManageLinksTable } from '@/components/organisms/ManageLinksTable/ManageLinksTable';
import { ClicksLogDrawer } from '@/components/organisms/ClicksLogDrawer/ClicksLogDrawer';
import { DeleteConfirmModal } from '@/components/molecules/DeleteConfirmModal/DeleteConfirmModal';
import { DeleteProjectModal } from '@/components/molecules/DeleteProjectModal/DeleteProjectModal';
import { ArchiveProjectModal } from '@/components/molecules/ArchiveProjectModal/ArchiveProjectModal';
import { UnarchiveProjectModal } from '@/components/molecules/UnarchiveProjectModal/UnarchiveProjectModal';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { PublicShortlink } from '@/types/shortlink.types';
import { useProjectDetailPage } from './useProjectDetailPage';
import './ProjectDetailPage.css';

interface ClicksLogState {
  isOpen: boolean;
  shortlinkId?: string;
  slug?: string;
}

interface CanvasProps {
  page: ReturnType<typeof useProjectDetailPage>;
  onOpenClicksLog: (shortlink?: PublicShortlink) => void;
}

function ProjectDetailCanvas({ page, onOpenClicksLog }: CanvasProps) {
  return (
    <div className="project-detail-canvas">
      {page.error && (
        <div className="dashboard-error-banner">
          <Icon name="error" />
          <span>{page.error}</span>
        </div>
      )}
      <ProjectHeader
        project={page.project}
        totalLinks={page.totalItems}
        loading={page.loadingProject}
        onBackToProjects={page.handleBackToProjects}
        onAddShortlink={page.openAddDrawer}
        onArchiveProject={() => page.setIsArchiveProjectModalOpen(true)}
        onUnarchiveProject={() => page.setIsUnarchiveProjectModalOpen(true)}
        onDeleteProject={() => page.setIsDeleteProjectModalOpen(true)}
      />
      <ManageLinksTable
        items={page.items}
        loading={page.loadingLinks}
        totalItems={page.totalItems}
        currentPage={page.currentPage}
        pageSize={page.pageSize}
        onEdit={page.openEditDrawer}
        onDelete={page.setDeleteTarget}
        onToggleActive={page.handleToggleActive}
        onViewClicks={(link) => onOpenClicksLog(link)}
        onPageChange={page.setCurrentPage}
        onAddLink={page.openAddDrawer}
        showQuickCreate={false}
        search={page.search}
        onSearchChange={page.setSearch}
      />
    </div>
  );
}

interface ModalsProps {
  page: ReturnType<typeof useProjectDetailPage>;
  clicksLogState: ClicksLogState;
  onCloseClicksLog: () => void;
}

function ProjectDetailModals({ page, clicksLogState, onCloseClicksLog }: ModalsProps) {
  return (
    <>
      <ClicksLogDrawer
        isOpen={clicksLogState.isOpen}
        shortlinkId={clicksLogState.shortlinkId}
        slug={clicksLogState.slug}
        onClose={onCloseClicksLog}
      />
      <ArchiveProjectModal
        project={page.isArchiveProjectModalOpen ? page.project : null}
        archiving={page.archiveProjectPending}
        onConfirm={page.handleArchiveProject}
        onCancel={() => page.setIsArchiveProjectModalOpen(false)}
      />
      <UnarchiveProjectModal
        project={page.isUnarchiveProjectModalOpen ? page.project : null}
        unarchiving={page.unarchiveProjectPending}
        onConfirm={page.handleUnarchiveProject}
        onCancel={() => page.setIsUnarchiveProjectModalOpen(false)}
      />
      <DeleteConfirmModal
        shortlink={page.deleteTarget}
        deleting={page.deleting}
        onConfirm={page.handleDeleteConfirm}
        onCancel={() => page.setDeleteTarget(null)}
      />
      <DeleteProjectModal
        project={page.isDeleteProjectModalOpen ? page.project : null}
        deleting={page.deleteProjectPending}
        onConfirm={page.handleDeleteProjectConfirm}
        onCancel={() => page.setIsDeleteProjectModalOpen(false)}
      />
    </>
  );
}

export function ProjectDetailPage() {
  const page = useProjectDetailPage();
  const [clicksLogState, setClicksLogState] = useState<ClicksLogState>({ isOpen: false });

  const handleOpenClicksLog = (shortlink?: PublicShortlink) => {
    setClicksLogState({ isOpen: true, shortlinkId: shortlink?.id, slug: shortlink?.slug });
  };

  return (
    <div className="project-detail-layout">
      <SidebarNav />
      <main className="project-detail-main">
        <TopAppBar
          search={page.search}
          onSearchChange={page.setSearch}
          onLogout={page.handleLogout}
        />
        <ProjectDetailCanvas page={page} onOpenClicksLog={handleOpenClicksLog} />
      </main>
      <MobileBottomNav onAddLink={page.openAddDrawer} />
      <ProjectDetailModals
        page={page}
        clicksLogState={clicksLogState}
        onCloseClicksLog={() => setClicksLogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
