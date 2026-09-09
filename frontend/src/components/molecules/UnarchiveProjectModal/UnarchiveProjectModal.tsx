import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import type { UnarchiveProjectModalProps } from './UnarchiveProjectModal.types';
import './UnarchiveProjectModal.css';

export function UnarchiveProjectModal({
  project,
  unarchiving,
  onConfirm,
  onCancel,
}: UnarchiveProjectModalProps) {
  return (
    <Modal isOpen={Boolean(project)} onClose={onCancel} ariaLabel="Reactivate project confirmation">
      <div className="unarchive-project-modal-icon">
        <Icon name="unarchive" size={28} />
      </div>
      <h2 className="unarchive-project-modal-title">Reactivate Project?</h2>
      <p className="unarchive-project-modal-body">
        Are you sure you want to reactivate project{' '}
        <span className="unarchive-project-modal-name">"{project?.name}"</span>?
        It will be restored to your active projects list along with its shortlinks.
      </p>
      <div className="unarchive-project-modal-actions">
        <Button type="button" variant="cancel" fullWidth onClick={onCancel} disabled={unarchiving}>
          Cancel
        </Button>
        <Button type="button" variant="primary" fullWidth onClick={onConfirm} disabled={unarchiving}>
          {unarchiving ? 'Reactivating...' : 'Reactivate Project'}
        </Button>
      </div>
    </Modal>
  );
}
