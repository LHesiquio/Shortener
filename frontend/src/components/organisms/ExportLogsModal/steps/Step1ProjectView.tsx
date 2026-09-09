import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { PublicProject } from '@/types/shortlink.types';
import type { Step1Props } from '../ExportLogsModal.types';

function ProjectSearchInput({ search, onChange }: { search: string; onChange: (v: string) => void }) {
  return (
    <div className="export-modal-search-wrapper">
      <Icon name="search" className="export-modal-search-icon" />
      <input
        type="text"
        className="export-modal-search-input"
        placeholder="Search projects by name..."
        value={search}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ProjectCardItem({
  project,
  isSelected,
  onSelect,
}: {
  project: PublicProject;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`export-modal-card-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="export-modal-item-left">
        <div className="export-modal-item-icon">
          <Icon name="folder" />
        </div>
        <div className="export-modal-item-text">
          <span className="export-modal-item-title">{project.name}</span>
          <span className="export-modal-item-sub">{project.description || 'No description'}</span>
        </div>
      </div>
      <div className="export-modal-item-radio">{isSelected && <div className="export-modal-radio-dot" />}</div>
    </div>
  );
}

function ProjectListState({ isLoading, count }: { isLoading: boolean; count: number }) {
  if (isLoading) {
    return (
      <>
        <Skeleton width="100%" height="56px" borderRadius="16px" />
        <Skeleton width="100%" height="56px" borderRadius="16px" />
      </>
    );
  }
  if (count === 0) {
    return (
      <div className="export-modal-empty-state">
        <Icon name="folder_open" size={32} />
        <p>No projects found matching your search.</p>
      </div>
    );
  }
  return null;
}

export function Step1ProjectView({
  projects,
  isLoading,
  search,
  onSearchChange,
  selectedProject,
  onSelect,
}: Step1Props) {
  return (
    <>
      <ProjectSearchInput search={search} onChange={onSearchChange} />
      <div className="export-modal-list-container">
        <ProjectListState isLoading={isLoading} count={projects.length} />
        {!isLoading &&
          projects.map((p) => (
            <ProjectCardItem
              key={p.id}
              project={p}
              isSelected={selectedProject?.id === p.id}
              onSelect={() => onSelect(p)}
            />
          ))}
      </div>
    </>
  );
}
