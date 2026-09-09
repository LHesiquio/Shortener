import type { PublicShortlink } from '@/types/shortlink.types';

export interface NewLinkDrawerProps {
  isOpen: boolean;
  editTarget: PublicShortlink | null;
  initialUrl?: string;
  defaultProjectId?: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (data: DrawerFormData) => void;
}

export interface DrawerFormData {
  url: string;
  title: string;
  slug: string;
  projectId: string;
  activeFrom?: string;
  activeTo?: string;
}
