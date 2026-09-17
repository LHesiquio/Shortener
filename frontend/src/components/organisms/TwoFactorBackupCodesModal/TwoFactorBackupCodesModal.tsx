import { Modal } from '@/components/atoms/Modal/Modal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Button } from '@/components/atoms/Button/Button';
import { FormField } from '@/components/molecules/FormField/FormField';
import type { TwoFactorBackupCodesModalProps } from './TwoFactorBackupCodesModal.types';
import { useTwoFactorBackupCodesModal } from './useTwoFactorBackupCodesModal';
import './TwoFactorBackupCodesModal.css';

interface PromptProps {
  password: string;
  setPassword: (v: string) => void;
  generating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function BackupCodesPrompt({ password, setPassword, generating, onConfirm, onCancel }: PromptProps) {
  return (
    <div>
      <p className="twofa-backup-modal-subtitle">
        Generating new backup codes will invalidate any existing backup codes you previously saved.
      </p>
      <div className="twofa-backup-field">
        <FormField
          label="Account Password"
          type="password"
          iconName="lock"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={generating}
        />
      </div>
      <div className="twofa-backup-modal-actions">
        <Button type="button" variant="cancel" onClick={onCancel} disabled={generating}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={onConfirm} disabled={generating || !password}>
          {generating ? 'Generating...' : 'Generate New Codes'}
        </Button>
      </div>
    </div>
  );
}

interface ResultProps {
  codes: string[];
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onDone: () => void;
}

function BackupCodesResult({ codes, copied, onCopy, onDownload, onDone }: ResultProps) {
  return (
    <div>
      <p className="twofa-backup-modal-subtitle">
        Keep these recovery codes safe. Each code can only be used once.
      </p>
      <div className="twofa-backup-grid">
        {codes.map((item, idx) => (
          <div key={idx} className="twofa-backup-item">
            <code>{item}</code>
          </div>
        ))}
      </div>
      <div className="twofa-backup-actions-row">
        <button type="button" className="twofa-btn-subtle" onClick={onCopy}>
          <Icon name={copied ? 'check' : 'copy'} size={18} />
          <span>{copied ? 'Copied All' : 'Copy All'}</span>
        </button>
        <button type="button" className="twofa-btn-subtle" onClick={onDownload}>
          <Icon name="download" size={18} />
          <span>Download (.txt)</span>
        </button>
      </div>
      <div className="twofa-backup-modal-actions">
        <Button type="button" variant="primary" fullWidth onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function TwoFactorBackupCodesModal(props: TwoFactorBackupCodesModalProps) {
  const {
    password,
    setPassword,
    backupCodes,
    copied,
    generating,
    handleRegenerate,
    handleCopyAll,
    handleDownload,
    handleClose,
  } = useTwoFactorBackupCodesModal(props);

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} ariaLabel="Manage backup recovery codes">
      <div className="twofa-backup-modal-container">
        <div className="twofa-backup-modal-icon">
          <Icon name="key" size={28} />
        </div>
        <h2 className="twofa-backup-modal-title">Backup Recovery Codes</h2>
        {backupCodes.length === 0 ? (
          <BackupCodesPrompt
            password={password}
            setPassword={setPassword}
            generating={generating}
            onConfirm={handleRegenerate}
            onCancel={handleClose}
          />
        ) : (
          <BackupCodesResult
            codes={backupCodes}
            copied={copied}
            onCopy={handleCopyAll}
            onDownload={handleDownload}
            onDone={handleClose}
          />
        )}
      </div>
    </Modal>
  );
}
