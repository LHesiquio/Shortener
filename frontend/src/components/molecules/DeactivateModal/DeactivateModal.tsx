import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Button } from '@/components/atoms/Button/Button';
import type { DeactivateModalProps } from './DeactivateModal.types';
import './DeactivateModal.css';

export function DeactivateModal({ isOpen, deactivating, onConfirm, onCancel }: DeactivateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} ariaLabel="Deactivate account confirmation">
      <div className="deactivate-modal-icon">
        <Icon name="warning" size={28} />
      </div>
      <h2 className="deactivate-modal-title">Deactivate Account?</h2>
      <p className="deactivate-modal-body">
        Your shortlinks and analytics data will remain intact, but your account will be set to inactive and you will be logged out immediately. You will not be able to log in until an administrator re-activates your account.
      </p>
      <div className="deactivate-modal-actions">
        <Button
          type="button"
          variant="cancel"
          fullWidth
          onClick={onCancel}
          disabled={deactivating}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          fullWidth
          onClick={onConfirm}
          disabled={deactivating}
        >
          {deactivating ? 'Deactivating...' : 'Yes, Deactivate Account'}
        </Button>
      </div>
    </Modal>
  );
}
