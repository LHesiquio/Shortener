import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import type { DeleteConfirmModalProps } from './DeleteConfirmModal.types';
import './DeleteConfirmModal.css';

export function DeleteConfirmModal({ shortlink, deleting, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={Boolean(shortlink)} onClose={onCancel} ariaLabel="Delete shortlink">
      <div className="modal-icon-wrapper">
        <Icon name="delete_forever" size={28} />
      </div>
      <h2 className="modal-title">Delete Shortlink</h2>
      <p className="modal-body">
        This will permanently delete{' '}
        <span className="modal-slug">/r/{shortlink?.slug}</span>
        {' '}and all its click data. This action cannot be undone.
      </p>
      <div className="modal-actions">
        <Button type="button" variant="cancel" fullWidth onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button type="button" variant="danger" fullWidth onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}
