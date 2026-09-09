import type { PublicShortlink } from '@/types/shortlink.types';

export interface DeleteConfirmModalProps {
  shortlink: PublicShortlink | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
