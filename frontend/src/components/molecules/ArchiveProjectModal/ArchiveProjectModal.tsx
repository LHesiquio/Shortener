import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import type { ArchiveProjectModalProps } from './ArchiveProjectModal.types';
import './ArchiveProjectModal.css';

export function ArchiveProjectModal({
  project,
  archiving,
  onConfirm,
  onCancel,
}: ArchiveProjectModalProps) {
  return (
    <Modal isOpen={Boolean(project)} onClose={onCancel} ariaLabel="Archive project confirmation">
      <div className="archive-project-modal-icon">
        <Icon name="archive" size={28} />
      </div>
      <h2 className="archive-project-modal-title">Archive Project?</h2>
      <p className="archive-project-modal-body">
        Are you sure you want to archive project{' '}
        <span className="archive-project-modal-name">"{project?.name}"</span>?
        Its shortlinks will be deactivated and moved to archived views, but can be reactivated at any time.
      </p>
      <div className="archive-project-modal-actions">
        <Button type="button" variant="cancel" fullWidth onClick={onCancel} disabled={archiving}>
          Cancel
        </Button>
        <Button type="button" variant="primary" fullWidth onClick={onConfirm} disabled={archiving}>
          {archiving ? 'Archiving...' : 'Archive Project'}
        </Button>
      </div>
    </Modal>
  );
}
