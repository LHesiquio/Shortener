import type React from 'react';
import type { PublicProject } from '@/types/shortlink.types';

export interface ProjectCardProps {
  project: PublicProject;
  onClick: () => void;
  onArchive?: (e: React.MouseEvent) => void;
  onUnarchive?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}
