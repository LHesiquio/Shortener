import { Icon } from '@/components/atoms/Icon/Icon';
import { Modal } from '@/components/atoms/Modal/Modal';
import { FormField } from '@/components/molecules/FormField/FormField';
import type { ChangePasswordModalProps } from './ChangePasswordModal.types';
import './ChangePasswordModal.css';

export function ChangePasswordModal({
  isOpen,
  changing,
  formData,
  onFormChange,
  onConfirm,
  onCancel,
}: ChangePasswordModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} ariaLabel="Change password modal">
      <div className="password-modal-icon">
        <Icon name="lock_reset" size={28} />
      </div>
      <h2 className="password-modal-title">Change Password</h2>
      <p className="password-modal-subtitle">
        Enter your current password and choose a new password for your account.
      </p>

      <div className="password-modal-fields">
        <FormField
          label="Current Password"
          type="password"
          iconName="lock"
          placeholder="Enter current password"
          value={formData.currentPassword ?? ''}
          onChange={(e) => onFormChange({ ...formData, currentPassword: e.target.value })}
        />
        <FormField
          label="New Password"
          type="password"
          iconName="key"
          placeholder="At least 8 characters"
          value={formData.newPassword ?? ''}
          onChange={(e) => onFormChange({ ...formData, newPassword: e.target.value })}
        />
        <FormField
          label="Confirm New Password"
          type="password"
          iconName="key"
          placeholder="Repeat new password"
          value={formData.confirmPassword ?? ''}
          onChange={(e) => onFormChange({ ...formData, confirmPassword: e.target.value })}
        />
      </div>

      <div className="password-modal-actions">
        <button
          type="button"
          className="password-modal-btn password-modal-btn-cancel"
          onClick={onCancel}
          disabled={changing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="password-modal-btn password-modal-btn-primary"
          onClick={onConfirm}
          disabled={changing}
        >
          {changing ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </Modal>
  );
}
