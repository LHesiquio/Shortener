import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { ProjectCard } from '@/components/molecules/ProjectCard/ProjectCard';
import { CreateProjectDrawer } from '@/components/molecules/CreateProjectDrawer/CreateProjectDrawer';
import { DeleteProjectModal } from '@/components/molecules/DeleteProjectModal/DeleteProjectModal';
import { ArchiveProjectModal } from '@/components/molecules/ArchiveProjectModal/ArchiveProjectModal';
import { UnarchiveProjectModal } from '@/components/molecules/UnarchiveProjectModal/UnarchiveProjectModal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import { useProjectsPage } from './useProjectsPage';
import './ProjectsPage.css';

type PageHook = ReturnType<typeof useProjectsPage>;

function ProjectsHeaderSection({ onOpenCreate }: { onOpenCreate: () => void }) {
  return (
    <div className="projects-page-header">
      <div className="projects-page-title-group">
        <h1>Projects</h1>
        <p>Organize and manage your shortlink collections</p>
      </div>
      <button type="button" className="projects-create-btn" onClick={onOpenCreate}>
        <Icon name="add" />
        New Project
      </button>
    </div>
  );
}

function ProjectsFilterTabs({ tab, setTab }: { tab: 'active' | 'archived'; setTab: (t: 'active' | 'archived') => void }) {
  return (
    <div className="projects-filter-tabs">
      <button type="button" className={`projects-tab-btn ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
        <Icon name="folder" />
        Active Projects
      </button>
      <button type="button" className={`projects-tab-btn ${tab === 'archived' ? 'active' : ''}`} onClick={() => setTab('archived')}>
        <Icon name="inventory_2" />
        Archived Projects
      </button>
    </div>
  );
}

function ProjectsLoadingGrid() {
  return (
    <div className="projects-grid">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height="160px" borderRadius="24px" />
      ))}
    </div>
  );
}

function ProjectsEmptyState({ isArchivedTab, onOpenCreate }: { isArchivedTab: boolean; onOpenCreate: () => void }) {
  if (isArchivedTab) {
    return (
      <div className="projects-empty-state">
        <div className="projects-empty-icon"><Icon name="inventory_2" /></div>
        <h3>No Archived Projects</h3>
        <p>You have no deactivated or archived projects.</p>
      </div>
    );
  }

  return (
    <div className="projects-empty-state">
      <div className="projects-empty-icon"><Icon name="folder_off" /></div>
      <h3>No Active Projects Found</h3>
      <p>Create your first project to start grouping and organizing your shortlinks.</p>
      <button type="button" className="projects-create-btn" onClick={onOpenCreate}>
        <Icon name="add" />
        Create Project
      </button>
    </div>
  );
}

function ProjectsPageContent({ page }: { page: PageHook }) {
  if (page.isLoading) return <ProjectsLoadingGrid />;
  if (page.projects.length === 0) {
    return <ProjectsEmptyState isArchivedTab={page.tab === 'archived'} onOpenCreate={() => page.setIsCreateModalOpen(true)} />;
  }
  return (
    <div className="projects-grid">
      {page.projects.map((proj) => (
        <ProjectCard
          key={proj.id}
          project={proj}
          onClick={() => page.handleNavigateToProject(proj.slug || proj.id)}
          onArchive={page.tab === 'active' ? () => page.setArchiveTarget(proj) : undefined}
          onUnarchive={page.tab === 'archived' ? () => page.setUnarchiveTarget(proj) : undefined}
          onDelete={page.tab === 'archived' ? () => page.setDeleteTarget(proj) : undefined}
        />
      ))}
    </div>
  );
}

function ProjectsModals({ page }: { page: PageHook }) {
  return (
    <>
      <CreateProjectDrawer
        isOpen={page.isCreateModalOpen}
        name={page.newProjectName}
        setName={page.setNewProjectName}
        desc={page.newProjectDesc}
        setDesc={page.setNewProjectDesc}
        pending={page.createPending}
        onClose={() => page.setIsCreateModalOpen(false)}
        onSubmit={page.handleCreateProject}
      />
      <ArchiveProjectModal
        project={page.archiveTarget}
        archiving={page.archivePending}
        onConfirm={page.handleConfirmArchive}
        onCancel={() => page.setArchiveTarget(null)}
      />
      <UnarchiveProjectModal
        project={page.unarchiveTarget}
        unarchiving={page.unarchivePending}
        onConfirm={page.handleConfirmUnarchive}
        onCancel={() => page.setUnarchiveTarget(null)}
      />
      <DeleteProjectModal
        project={page.deleteTarget}
        deleting={page.deletePending}
        onConfirm={page.handleConfirmDelete}
        onCancel={() => page.setDeleteTarget(null)}
      />
    </>
  );
}

export function ProjectsPage() {
  const page = useProjectsPage();

  return (
    <div className="projects-page-layout">
      <SidebarNav />
      <main className="projects-page-main">
        <TopAppBar search={page.search} onSearchChange={page.setSearch} onLogout={page.handleLogout} />
        <div className="projects-page-canvas">
          <ProjectsHeaderSection onOpenCreate={() => page.setIsCreateModalOpen(true)} />
          <ProjectsFilterTabs tab={page.tab} setTab={page.setTab} />
          <ProjectsPageContent page={page} />
        </div>
      </main>
      <MobileBottomNav />
      <ProjectsModals page={page} />
    </div>
  );
}
