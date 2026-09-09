import type { ChangePasswordPayload } from '@/services/authService';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  changing: boolean;
  formData: ChangePasswordPayload;
  onFormChange: (data: ChangePasswordPayload) => void;
  onConfirm: () => void;
  onCancel: () => void;
}
