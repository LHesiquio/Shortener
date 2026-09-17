export type TwoFactorSetupStep = 'scan' | 'verify' | 'backup';

export interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
