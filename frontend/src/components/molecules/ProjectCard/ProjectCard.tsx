import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { Badge } from '@/components/atoms/Badge/Badge';
import { useUserProfile } from '@/context/UserProfileContext';
import { formatLocalizedDate } from '@/utils/date.utils';
import type { PublicProject } from '@/types/shortlink.types';
import type { ProjectCardProps } from './ProjectCard.types';
import './ProjectCard.css';

function ProjectCardTitleRow({ project }: { project: PublicProject }) {
  return (
    <div className="project-card-title-row">
      <h3 className="project-card-title">{project.name}</h3>
      {project.slug && <span className="project-card-slug-badge">/{project.slug}</span>}
      {project.isArchived && <Badge variant="neutral">Archived</Badge>}
    </div>
  );
}

function ProjectCardHeader({ project }: { project: PublicProject }) {
  const iconName = project.isArchived ? 'inventory_2' : 'folder';
  const archivedClass = project.isArchived ? 'archived' : '';

  return (
    <div className="project-card-header">
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
        <div className={`project-card-icon-wrapper ${archivedClass}`.trim()}>
          <Icon name={iconName} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProjectCardTitleRow project={project} />
          <p className="project-card-description">
            {project.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ActionsProps {
  project: PublicProject;
  onArchive?: (e: React.MouseEvent) => void;
  onUnarchive?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function ActiveCardActions({ onArchive }: { onArchive?: (e: React.MouseEvent) => void }) {
  if (!onArchive) return null;
  return (
    <IconButton
      icon="inventory_2"
      variant="primary"
      title="Deactivate Project"
      onClick={(e) => { e.stopPropagation(); onArchive(e); }}
    />
  );
}

function ArchivedCardActions({
  onUnarchive,
  onDelete,
}: {
  onUnarchive?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      {onUnarchive && (
        <IconButton
          icon="unarchive"
          variant="success"
          title="Reactivate Project"
          onClick={(e) => { e.stopPropagation(); onUnarchive(e); }}
        />
      )}
      {onDelete && (
        <IconButton
          icon="delete_forever"
          variant="danger"
          title="Permanently Delete Project"
          onClick={(e) => { e.stopPropagation(); onDelete(e); }}
        />
      )}
    </>
  );
}

function ProjectCardActions({ project, onArchive, onUnarchive, onDelete }: ActionsProps) {
  return (
    <div className="project-card-actions">
      {project.isArchived ? (
        <ArchivedCardActions onUnarchive={onUnarchive} onDelete={onDelete} />
      ) : (
        <ActiveCardActions onArchive={onArchive} />
      )}
    </div>
  );
}

export function ProjectCard({ project, onClick, onArchive, onUnarchive, onDelete }: ProjectCardProps) {
  const { user } = useUserProfile();
  const formattedDate = formatLocalizedDate(project.createdAt, user?.timezone);

  return (
    <div
      className={`project-card-root ${project.isArchived ? 'project-card-archived' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <ProjectCardHeader project={project} />
      <div className="project-card-footer">
        <span className="project-card-date">Created {formattedDate}</span>
        <ProjectCardActions
          project={project}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
