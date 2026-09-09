import { createPortal } from 'react-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import { isValidUrlFormat } from '@/utils/url.utils';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { Select } from '@/components/atoms/Select/Select';
import { DatePicker } from '@/components/atoms/DatePicker/DatePicker';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { useNewLinkDrawer } from './useNewLinkDrawer';
import type { NewLinkDrawerProps } from './NewLinkDrawer.types';
import type { PublicProject } from '@/types/shortlink.types';
import './NewLinkDrawer.css';

function DrawerHeader({ isEditing, onClose }: { isEditing: boolean; onClose: () => void }) {
  return (
    <div className="drawer-header">
      <div className="drawer-title-group">
        <div className="drawer-title-icon"><Icon name={isEditing ? 'edit' : 'add_link'} /></div>
        <div>
          <p className="drawer-title">{isEditing ? 'Edit Link' : 'Create Shortlink'}</p>
          <p className="drawer-subtitle">{isEditing ? 'Update your shortlink details' : 'Create a new shortlink'}</p>
        </div>
      </div>
      <IconButton icon="close" onClick={onClose} title="Close" />
    </div>
  );
}

function UrlRequirement({ url }: { url: string }) {
  const isValid = isValidUrlFormat(url);
  return (
    <div className="drawer-requirements-list">
      <div className={`drawer-requirement-item ${isValid ? 'valid' : ''}`}>
        <Icon name="check_circle" className="drawer-req-icon" />
        <span>Valid URL (e.g. https://example.com or www.example.com)</span>
      </div>
    </div>
  );
}

interface ProjectFieldProps {
  projectId: string;
  setProjectId: (id: string) => void;
  projects: PublicProject[];
  loadingProjects: boolean;
  setProjectSearch: (search: string) => void;
  isCreatingProjectMode: boolean;
  setIsCreatingProjectMode: React.Dispatch<React.SetStateAction<boolean>>;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  creatingProject: boolean;
  onAddProject: () => void;
  isProjectPreSelected?: boolean;
}

function ProjectSelector({
  projectId,
  setProjectId,
  projects,
  loadingProjects,
  setProjectSearch,
  isCreatingProjectMode,
  setIsCreatingProjectMode,
  newProjectName,
  setNewProjectName,
  creatingProject,
  onAddProject,
  isProjectPreSelected = false,
}: ProjectFieldProps) {
  const selectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddProject();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onAddProject();
    }
  };

  return (
    <div className="drawer-field">
      <div className="drawer-field-header">
        <label className="drawer-label">Project (required)</label>
        {!isProjectPreSelected && (
          <button
            type="button"
            className="drawer-inline-action"
            onClick={() => setIsCreatingProjectMode((prev) => !prev)}
          >
            {isCreatingProjectMode ? 'Select existing' : '+ New Project'}
          </button>
        )}
      </div>

      {isCreatingProjectMode ? (
        <div className="drawer-new-project-wrapper">
          <input
            className="drawer-input"
            type="text"
            placeholder="New Project Name (e.g. Google, Personal)"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDownInput}
            autoFocus
          />
          <button
            type="button"
            className="drawer-add-proj-btn"
            onClick={handleAddClick}
            disabled={creatingProject || !newProjectName.trim()}
          >
            {creatingProject ? '...' : 'Add'}
          </button>
        </div>
      ) : (
        <Select
          options={selectOptions}
          value={projectId}
          onChange={setProjectId}
          onSearchChange={setProjectSearch}
          loading={loadingProjects}
          placeholder="Search or select a project..."
          required
          disabled={isProjectPreSelected}
        />
      )}
    </div>
  );
}

function DrawerFields(props: ReturnType<typeof useNewLinkDrawer>) {
  const isValid = isValidUrlFormat(props.url);
  const showError = props.url.length > 0 && !isValid;

  return (
    <>
      <ProjectSelector
        projectId={props.projectId}
        setProjectId={props.setProjectId}
        projects={props.projects}
        loadingProjects={props.loadingProjects}
        setProjectSearch={props.setProjectSearch}
        isCreatingProjectMode={props.isCreatingProjectMode}
        setIsCreatingProjectMode={props.setIsCreatingProjectMode}
        newProjectName={props.newProjectName}
        setNewProjectName={props.setNewProjectName}
        creatingProject={props.creatingProject}
        onAddProject={props.handleCreateProject}
        isProjectPreSelected={Boolean(props.defaultProjectId)}
      />
      <div className="drawer-field">
        <label className="drawer-label" htmlFor="drawer-url">Original URL</label>
        <input
          id="drawer-url"
          className={`drawer-input ${showError ? 'invalid' : isValid ? 'valid' : ''}`}
          type="text"
          placeholder="https://example.com/long-page"
          value={props.url}
          onChange={(e) => props.setUrl(e.target.value)}
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label" htmlFor="drawer-title">Title (optional)</label>
        <input
          id="drawer-title"
          className="drawer-input"
          type="text"
          placeholder="My Project Link"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
        />
      </div>

      <div className="drawer-section-divider">
        <span>Expiration & Scheduling (Optional)</span>
      </div>

      <div className="drawer-field-row">
        <div className="drawer-field">
          <label className="drawer-label">Active From</label>
          <DatePicker
            value={props.activeFrom}
            onChange={props.setActiveFrom}
            placeholder="Select start date & time"
          />
        </div>
        <div className="drawer-field">
          <label className="drawer-label">Active To (Expires)</label>
          <DatePicker
            value={props.activeTo}
            onChange={props.setActiveTo}
            placeholder="Select expiration date & time"
            align="right"
          />
        </div>
      </div>
    </>
  );
}

export function NewLinkDrawer(props: NewLinkDrawerProps) {
  const drawerState = useNewLinkDrawer(props);
  const { rendered, closing } = useDrawerAnimation(props.isOpen);

  if (!rendered) return null;
  const isEditing = Boolean(props.editTarget);
  const isFormValid = isValidUrlFormat(drawerState.url) && Boolean(drawerState.projectId);
  const closeClass = closing ? 'closing' : '';

  const content = (
    <>
      <div className={`drawer-backdrop ${closeClass}`} role="presentation" onClick={props.onClose} />
      <aside className={`drawer-panel ${closeClass}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <DrawerHeader isEditing={isEditing} onClose={props.onClose} />
        <form className="drawer-body" onSubmit={drawerState.handleSubmit}>
          {props.error && <div className="drawer-error">{props.error}</div>}
          <DrawerFields {...drawerState} />
          <UrlRequirement url={drawerState.url} />
          <div className="drawer-footer">
            <button type="submit" className="drawer-save-btn" disabled={props.saving || !isFormValid}>
              <Icon name={props.saving ? 'sync' : 'magic_button'} />
              {props.saving ? 'Saving…' : isEditing ? 'Update Link' : 'Create Shortlink'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );

  return createPortal(content, document.body);
}
