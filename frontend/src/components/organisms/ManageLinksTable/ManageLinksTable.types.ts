import type { PublicShortlink } from '@/types/shortlink.types';

export interface ManageLinksTableProps {
  items: PublicShortlink[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onEdit: (link: PublicShortlink) => void;
  onDelete: (link: PublicShortlink) => void;
  onToggleActive: (link: PublicShortlink) => void;
  onViewClicks?: (link: PublicShortlink) => void;
  onViewGlobalClicks?: () => void;
  onPageChange: (page: number) => void;
  onAddLink: (initialUrl?: string) => void;
  showQuickCreate?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
}
