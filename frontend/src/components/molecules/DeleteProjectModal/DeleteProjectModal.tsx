import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import type { DeleteProjectModalProps } from './DeleteProjectModal.types';
import './DeleteProjectModal.css';

export function DeleteProjectModal({ project, deleting, onConfirm, onCancel }: DeleteProjectModalProps) {
  return (
    <Modal isOpen={Boolean(project)} onClose={onCancel} ariaLabel="Delete project confirmation">
      <div className="delete-project-modal-icon">
        <Icon name="delete_forever" size={28} />
      </div>
      <h2 className="delete-project-modal-title">Delete Project Permanently?</h2>
      <p className="delete-project-modal-body">
        This will permanently delete project{' '}
        <span className="delete-project-modal-name">"{project?.name}"</span>
        , including all associated shortlinks and all click analytics recorded for those shortlinks. This action cannot be undone.
      </p>
      <div className="delete-project-modal-actions">
        <Button type="button" variant="cancel" fullWidth onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button type="button" variant="danger" fullWidth onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Project'}
        </Button>
      </div>
    </Modal>
  );
}
