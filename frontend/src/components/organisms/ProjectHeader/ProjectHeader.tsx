import { Icon } from '@/components/atoms/Icon/Icon';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { ProjectHeaderProps } from './ProjectHeader.types';
import type { PublicProject } from '@/types/shortlink.types';
import './ProjectHeader.css';

function ProjectHeaderSkeleton() {
  return (
    <div className="project-header-root">
      <Skeleton width="120px" height="32px" borderRadius="9999px" />
      <div style={{ display: 'flex', gap: '16px' }}>
        <Skeleton width="56px" height="56px" borderRadius="18px" />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height="28px" style={{ marginBottom: '8px' }} />
          <Skeleton width="70%" height="16px" />
        </div>
      </div>
    </div>
  );
}

function ActiveProjectNavButtons({ onArchive }: { onArchive?: () => void }) {
  if (!onArchive) return null;
  return (
    <button type="button" className="project-header-back-btn" onClick={onArchive}>
      <Icon name="inventory_2" /> Deactivate Project
    </button>
  );
}

function ArchivedProjectNavButtons({
  onUnarchive,
  onDelete,
}: {
  onUnarchive?: () => void;
  onDelete?: () => void;
}) {
  return (
    <>
      {onUnarchive && (
        <button type="button" className="project-header-back-btn" onClick={onUnarchive}>
          <Icon name="unarchive" /> Reactivate Project
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="project-header-back-btn"
          style={{ color: 'var(--md-sys-color-error, #ba1a1a)', borderColor: 'var(--md-sys-color-error-container, #ffdad6)' }}
          onClick={onDelete}
        >
          <Icon name="delete_forever" /> Delete Project
        </button>
      )}
    </>
  );
}

function ProjectHeaderActionsNav({
  project,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  project: PublicProject;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {project.isArchived ? (
        <ArchivedProjectNavButtons onUnarchive={onUnarchive} onDelete={onDelete} />
      ) : (
        <ActiveProjectNavButtons onArchive={onArchive} />
      )}
    </div>
  );
}

function ProjectHeaderTitleRow({ project }: { project: PublicProject }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
      <h1 className="project-header-title">{project.name}</h1>
      {project.slug && <span className="project-card-slug-badge">/{project.slug}</span>}
      {project.isArchived && <Badge variant="neutral">Archived</Badge>}
    </div>
  );
}

function ProjectHeaderBody({
  project,
  onAddShortlink,
}: {
  project: PublicProject;
  onAddShortlink: () => void;
}) {
  const iconName = project.isArchived ? 'inventory_2' : 'folder';
  const iconClass = project.isArchived ? 'archived' : '';

  return (
    <div className="project-header-content">
      <div className="project-header-info">
        <div className={`project-header-icon-box ${iconClass}`.trim()}>
          <Icon name={iconName} />
        </div>
        <div>
          <ProjectHeaderTitleRow project={project} />
          <p className="project-header-desc">{project.description || 'Project collection for organizing shortlinks.'}</p>
        </div>
      </div>
      <div className="project-header-actions">
        <button type="button" className="project-header-add-btn" onClick={onAddShortlink}>
          <Icon name="add" /> Create Shortlink in Project
        </button>
      </div>
    </div>
  );
}

export function ProjectHeader(props: ProjectHeaderProps) {
  const { project, totalLinks, loading, onBackToProjects, onAddShortlink, onArchiveProject, onUnarchiveProject, onDeleteProject } = props;

  if (loading || !project) return <ProjectHeaderSkeleton />;

  return (
    <div className="project-header-root">
      <div className="project-header-top-nav">
        <button type="button" className="project-header-back-btn" onClick={onBackToProjects}>
          <Icon name="arrow_back" /> Back to Projects
        </button>
        <ProjectHeaderActionsNav
          project={project}
          onArchive={onArchiveProject}
          onUnarchive={onUnarchiveProject}
          onDelete={onDeleteProject}
        />
      </div>
      <ProjectHeaderBody project={project} onAddShortlink={onAddShortlink} />
      <div className="project-header-stats-row">
        <div className="project-header-stat-pill">
          <Icon name="link" />
          <span>Total Links: <strong>{totalLinks}</strong></span>
        </div>
      </div>
    </div>
  );
}
