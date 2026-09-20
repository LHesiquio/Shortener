export type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ExportJobFormat = 'csv' | 'pdf' | 'json' | 'xlsx';

export interface ExportJobParams {
  slug?: string;
  shortlinkId?: string;
  projectName?: string;
  range?: string;
  timezone?: string;
  format: ExportJobFormat;
  fields: string[];
}

export interface PublicExportJob {
  id: string;
  status: ExportJobStatus;
  targetLabel: string;
  format: ExportJobFormat;
  range: string | null;
  timezone: string;
  projectName: string | null;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  recordCount: number | null;
  error: string | null;
  isRead: boolean;
  downloadCount: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
  isExpired: boolean;
  downloadUrl: string;
  params: ExportJobParams;
}

export interface CreateExportJobPayload {
  slug?: string;
  shortlinkId?: string;
  projectName?: string;
  range?: string;
  timezone?: string;
  format?: ExportJobFormat;
  fields?: string[];
}

export interface ExportJobsListResponse {
  jobs: PublicExportJob[];
  total: number;
  totalPages: number;
}
