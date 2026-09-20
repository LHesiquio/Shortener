import type { AppNotification } from '@/context/NotificationContext.types';
import type { PublicExportJob } from '@/types/exportJob.types';

export interface ExportJobItemProps {
  job: PublicExportJob;
  timezone: string;
  onDownload: (job: PublicExportJob) => void;
  onRetry: (jobId: string) => void;
}

export interface NotificationEventItemProps {
  notification: AppNotification;
  timezone: string;
  onDismiss: (id: string) => void;
}
