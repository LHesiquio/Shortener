import { Modal } from '@/components/atoms/Modal/Modal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { Button } from '@/components/atoms/Button/Button';
import { OtpInput } from '@/components/molecules/OtpInput/OtpInput';
import type { TwoFactorSetupModalProps } from './TwoFactorSetupModal.types';
import { useTwoFactorSetupModal } from './useTwoFactorSetupModal';
import './TwoFactorSetupModal.css';

interface QrProps {
  setupData: { secret: string; qrCodeDataUrl: string } | null;
  copied: boolean;
  onCopy: () => void;
}

function TwoFactorQrDisplay({ setupData, copied, onCopy }: QrProps) {
  if (!setupData) return null;
  return (
    <div className="twofa-qr-wrapper">
      <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="twofa-qr-image" />
      <div className="twofa-secret-box">
        <span className="twofa-secret-label">Manual key:</span>
        <div className="twofa-secret-row">
          <code className="twofa-secret-text">{setupData.secret}</code>
          <IconButton icon={copied ? 'check' : 'copy'} title={copied ? 'Copied' : 'Copy'} onClick={onCopy} />
        </div>
      </div>
    </div>
  );
}

interface ScanStepProps {
  setupData: { secret: string; qrCodeDataUrl: string } | null;
  loading: boolean;
  copied: boolean;
  onCopy: () => void;
  onCancel: () => void;
  onNext: () => void;
}

function TwoFactorScanStep({ setupData, loading, copied, onCopy, onCancel, onNext }: ScanStepProps) {
  return (
    <div className="twofa-step-content">
      <div className="twofa-modal-icon"><Icon name="shield" size={28} /></div>
      <h2 className="twofa-modal-title">Enable Two-Factor Authentication</h2>
      <p className="twofa-modal-subtitle">Scan this QR code using your authenticator app.</p>
      {loading ? (
        <div className="twofa-qr-skeleton"><Icon name="refresh" size={32} className="twofa-spinner" /><p>Generating credentials...</p></div>
      ) : (
        <TwoFactorQrDisplay setupData={setupData} copied={copied} onCopy={onCopy} />
      )}
      <div className="twofa-modal-actions">
        <Button type="button" variant="cancel" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="primary" onClick={onNext} disabled={loading || !setupData}>Next Step</Button>
      </div>
    </div>
  );
}

interface VerifyStepProps {
  code: string;
  setCode: (v: string) => void;
  confirming: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function TwoFactorVerifyStep({ code, setCode, confirming, onBack, onConfirm }: VerifyStepProps) {
  return (
    <div className="twofa-step-content">
      <div className="twofa-modal-icon"><Icon name="key" size={28} /></div>
      <h2 className="twofa-modal-title">Enter Verification Code</h2>
      <p className="twofa-modal-subtitle">Enter the 6-digit code shown in your authenticator app.</p>
      <OtpInput value={code} onChange={setCode} length={6} autoFocus disabled={confirming} />
      <div className="twofa-modal-actions">
        <Button type="button" variant="cancel" onClick={onBack} disabled={confirming}>Back</Button>
        <Button type="button" variant="primary" onClick={onConfirm} disabled={confirming || code.length < 6}>
          {confirming ? 'Verifying...' : 'Verify & Activate'}
        </Button>
      </div>
    </div>
  );
}

interface BackupStepProps {
  codes: string[];
  copied: boolean;
  onCopyAll: () => void;
  onDownload: () => void;
  onDone: () => void;
}

function TwoFactorBackupStep({ codes, copied, onCopyAll, onDownload, onDone }: BackupStepProps) {
  return (
    <div className="twofa-step-content">
      <div className="twofa-modal-icon success"><Icon name="verified_user" size={28} /></div>
      <h2 className="twofa-modal-title">Save Your Backup Codes</h2>
      <p className="twofa-modal-subtitle">Keep these recovery codes safe. Each can be used once if you lose device access.</p>
      <div className="twofa-backup-grid">
        {codes.map((item, idx) => (
          <div key={idx} className="twofa-backup-item"><code>{item}</code></div>
        ))}
      </div>
      <div className="twofa-backup-actions-row">
        <button type="button" className="twofa-btn-subtle" onClick={onCopyAll}>
          <Icon name={copied ? 'check' : 'copy'} size={18} /><span>{copied ? 'Copied All' : 'Copy All'}</span>
        </button>
        <button type="button" className="twofa-btn-subtle" onClick={onDownload}>
          <Icon name="download" size={18} /><span>Download (.txt)</span>
        </button>
      </div>
      <div className="twofa-modal-actions">
        <Button type="button" variant="primary" fullWidth onClick={onDone}>I have saved these codes</Button>
      </div>
    </div>
  );
}

export function TwoFactorSetupModal(props: TwoFactorSetupModalProps) {
  const modal = useTwoFactorSetupModal(props);
  const handleClose = () => { modal.handleReset(); props.onClose(); };

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} ariaLabel="Set up two-factor authentication">
      <div className="twofa-modal-container">
        {modal.step === 'scan' && (
          <TwoFactorScanStep
            setupData={modal.setupData}
            loading={modal.loadingSetup}
            copied={modal.copiedSecret}
            onCopy={modal.handleCopySecret}
            onCancel={handleClose}
            onNext={() => modal.setStep('verify')}
          />
        )}
        {modal.step === 'verify' && (
          <TwoFactorVerifyStep
            code={modal.code}
            setCode={modal.setCode}
            confirming={modal.confirming}
            onBack={() => modal.setStep('scan')}
            onConfirm={modal.handleConfirmCode}
          />
        )}
        {modal.step === 'backup' && (
          <TwoFactorBackupStep
            codes={modal.backupCodes}
            copied={modal.copiedCodes}
            onCopyAll={modal.handleCopyAllCodes}
            onDownload={modal.handleDownloadCodes}
            onDone={handleClose}
          />
        )}
      </div>
    </Modal>
  );
}
