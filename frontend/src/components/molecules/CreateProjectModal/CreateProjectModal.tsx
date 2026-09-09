import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import type { CreateProjectModalProps } from './CreateProjectModal.types';
import './CreateProjectModal.css';

interface FormBodyProps {
  name: string;
  setName: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
}

function CreateProjectFormBody({ name, setName, desc, setDesc }: FormBodyProps) {
  return (
    <div className="create-project-modal-body">
      <div className="create-project-input-group">
        <label htmlFor="proj-name">Project Name *</label>
        <input
          id="proj-name"
          type="text"
          className="create-project-input"
          placeholder="e.g. Summer Marketing Campaign"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="create-project-input-group">
        <label htmlFor="proj-desc">Description (Optional)</label>
        <textarea
          id="proj-desc"
          className="create-project-textarea"
          placeholder="Short description of this project collection..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
    </div>
  );
}

interface FormFooterProps {
  pending: boolean;
  disabled: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function CreateProjectFormFooter({ pending, disabled, onClose, onSubmit }: FormFooterProps) {
  return (
    <div className="create-project-modal-footer">
      <Button type="button" variant="cancel" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button type="button" variant="primary" size="sm" disabled={disabled} onClick={onSubmit}>
        {pending ? 'Creating...' : 'Create Project'}
      </Button>
    </div>
  );
}

export function CreateProjectModal({
  isOpen,
  name,
  setName,
  desc,
  setDesc,
  pending,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const isSubmitDisabled = pending || !name.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} cardClassName="create-project-modal-card" ariaLabel="Create new project">
      <div className="create-project-modal-header">
        <h2 className="create-project-modal-title">Create New Project</h2>
        <IconButton icon="close" title="Close" onClick={onClose} />
      </div>
      <CreateProjectFormBody name={name} setName={setName} desc={desc} setDesc={setDesc} />
      <CreateProjectFormFooter
        pending={pending}
        disabled={isSubmitDisabled}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
