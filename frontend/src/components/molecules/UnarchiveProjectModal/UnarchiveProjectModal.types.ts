import type { PublicProject } from '@/types/shortlink.types';

export interface UnarchiveProjectModalProps {
  project: PublicProject | null;
  unarchiving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
