import type { PublicProject } from '@/types/shortlink.types';

export interface ProjectHeaderProps {
  project: PublicProject | null;
  totalLinks: number;
  loading?: boolean;
  onBackToProjects: () => void;
  onAddShortlink: () => void;
  onArchiveProject?: () => void;
  onUnarchiveProject?: () => void;
  onDeleteProject?: () => void;
}
