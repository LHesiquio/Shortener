import { Modal } from '@/components/atoms/Modal/Modal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Button } from '@/components/atoms/Button/Button';
import { FormField } from '@/components/molecules/FormField/FormField';
import type { TwoFactorDisableModalProps } from './TwoFactorDisableModal.types';
import { useTwoFactorDisableModal } from './useTwoFactorDisableModal';
import './TwoFactorDisableModal.css';

function DisableModalHeader() {
  return (
    <>
      <div className="twofa-disable-icon">
        <Icon name="warning" size={28} />
      </div>
      <h2 className="twofa-disable-title">Disable Two-Factor Authentication</h2>
      <p className="twofa-disable-subtitle">
        Disabling 2FA will reduce the security of your account. Please enter your account password to confirm.
      </p>
    </>
  );
}

export function TwoFactorDisableModal(props: TwoFactorDisableModalProps) {
  const { password, setPassword, disabling, handleConfirm, handleCancel } = useTwoFactorDisableModal(props);

  return (
    <Modal isOpen={props.isOpen} onClose={handleCancel} ariaLabel="Disable two-factor authentication">
      <div className="twofa-disable-container">
        <DisableModalHeader />
        <div className="twofa-disable-field">
          <FormField
            label="Current Password"
            type="password"
            iconName="lock"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={disabling}
          />
        </div>
        <div className="twofa-disable-actions">
          <Button type="button" variant="cancel" onClick={handleCancel} disabled={disabling}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={disabling || !password}>
            {disabling ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
