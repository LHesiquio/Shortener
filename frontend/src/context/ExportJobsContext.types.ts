import type { CreateExportJobPayload, PublicExportJob } from '@/types/exportJob.types';

export interface ExportJobsContextValue {
  jobs: PublicExportJob[];
  isLoading: boolean;
  isError: boolean;
  unreadCount: number;
  hasActiveJobs: boolean;
  refresh: () => Promise<void>;
  createJob: (payload: CreateExportJobPayload) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  downloadJob: (job: PublicExportJob) => Promise<void>;
  markAllRead: () => Promise<void>;
}
