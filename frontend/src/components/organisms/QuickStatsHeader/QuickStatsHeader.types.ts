import type { PublicShortlink } from '@/types/shortlink.types';

export interface QuickStatsHeaderProps {
  items: PublicShortlink[];
  totalItems: number;
  topLinkSlug?: string;
  totalClicks?: number;
  loading?: boolean;
}
