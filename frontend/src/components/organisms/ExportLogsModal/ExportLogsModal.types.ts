import type { PublicProject, PublicShortlink } from '@/types/shortlink.types';

export type ExportFormat = 'csv' | 'pdf' | 'json' | 'xlsx';

export interface ExportLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShortlinkId?: string;
  initialSlug?: string;
  /** Whether the user is allowed to maximize the modal. Defaults to true. */
  allowMaximize?: boolean;
  /** Default maximization state on first render. Defaults to false. */
  defaultMaximized?: boolean;
  /** Whether to persist the maximized state across browser sessions. Defaults to false. */
  persistMaximized?: boolean;
  /** Custom localStorage key when persistMaximized is true. Defaults to 'export-modal-maximized'. */
  storageKey?: string;
}

export interface TimezoneOption {
  id: string;
  label: string;
  city: string;
  offset: string;
}

export interface FormatOption {
  format: ExportFormat;
  title: string;
  ext: string;
  description: string;
  icon: string;
  badge: string;
}

export interface ExportFieldOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface Step1Props {
  projects: PublicProject[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  selectedProject: PublicProject | null;
  onSelect: (project: PublicProject) => void;
}

export interface Step2Props {
  shortlinks: PublicShortlink[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  selectedShortlink: PublicShortlink | null;
  onSelect: (shortlink: PublicShortlink) => void;
}

export interface Step3Props {
  timezones: TimezoneOption[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedTimezone: string;
  onSelect: (tz: string) => void;
  previewText: string;
}

export interface Step4FieldsProps {
  selectedFields: string[];
  onToggleField: (f: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export interface Step5Props {
  selectedFormat: ExportFormat;
  onSelectFormat: (fmt: ExportFormat) => void;
  projectName: string;
  slug: string;
  shortlinkTitle: string;
  destinationUrl: string;
  timezone: string;
  selectedFieldsCount: number;
}
