import type { PublicProject } from '@/types/shortlink.types';

export interface DeleteProjectModalProps {
  project: PublicProject | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
