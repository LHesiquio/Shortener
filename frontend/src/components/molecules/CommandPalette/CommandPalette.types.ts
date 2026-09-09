import type { PublicShortlink, PublicProject } from '@/types/shortlink.types';

export type CommandCategory = 'action' | 'shortlink' | 'project';

export interface CommandItem {
  id: string;
  category: CommandCategory;
  title: string;
  subtitle?: string;
  iconName: string;
  badgeText?: string;
  action: () => void;
  shortlink?: PublicShortlink;
  project?: PublicProject;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateLink?: () => void;
}
