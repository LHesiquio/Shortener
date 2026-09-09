import type { PublicShortlink } from '@/types/shortlink.types';

export interface ShortlinkRowProps {
  shortlink: PublicShortlink;
  onEdit: (shortlink: PublicShortlink) => void;
  onDelete: (shortlink: PublicShortlink) => void;
  onToggleActive: (shortlink: PublicShortlink) => void;
  onViewClicks?: (shortlink: PublicShortlink) => void;
  copyToClipboard: (slug: string) => void;
  copiedSlug: string | null;
}
