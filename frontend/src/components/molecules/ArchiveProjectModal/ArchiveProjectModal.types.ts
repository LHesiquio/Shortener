import type { PublicProject } from '@/types/shortlink.types';

export interface ArchiveProjectModalProps {
  project: PublicProject | null;
  archiving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
