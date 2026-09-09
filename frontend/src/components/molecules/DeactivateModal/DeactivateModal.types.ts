export interface DeactivateModalProps {
  isOpen: boolean;
  deactivating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
