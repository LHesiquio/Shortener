import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import type { PublicExportJob } from '@/types/exportJob.types';
import type { ExportJobItemProps } from './NotificationCenter.types';
import {
  JOB_STATUS_META,
  buildErrorText,
  buildJobSubtitle,
  buildRetryLabel,
  canRetry,
  formatExpiry,
  isDownloadable,
} from './NotificationCenter.utils';

interface JobActionsProps {
  job: PublicExportJob;
  downloadable: boolean;
  retryable: boolean;
  onDownload: (job: PublicExportJob) => void;
  onRetry: (jobId: string) => void;
}

function JobActions({ job, downloadable, retryable, onDownload, onRetry }: JobActionsProps) {
  return (
    <div className="notification-job__actions">
      {downloadable && (
        <IconButton icon="download" title="Download" onClick={() => onDownload(job)} />
      )}
      {retryable && (
        <IconButton icon="refresh" title={buildRetryLabel(job)} onClick={() => onRetry(job.id)} />
      )}
    </div>
  );
}

export function ExportJobItem({ job, timezone, onDownload, onRetry }: ExportJobItemProps) {
  const meta = JOB_STATUS_META[job.status];
  const isPending = meta.tone === 'pending';
  const isFailed = job.status === 'failed';
  const downloadable = isDownloadable(job);
  const retryable = canRetry(job);

  return (
    <div className={`notification-job notification-job--${meta.tone}`}>
      <div className="notification-job__icon">
        <Icon name={meta.icon} size={18} className={isPending ? 'notification-job__spin' : ''} />
      </div>

      <div className="notification-job__body">
        <div className="notification-job__head">
          <span className="notification-job__title">{job.targetLabel}</span>
          <span className={`notification-job__badge notification-job__badge--${meta.tone}`}>
            {meta.label}
          </span>
        </div>
        {isFailed ? (
          <p className="notification-job__error">{buildErrorText(job)}</p>
        ) : (
          <p className="notification-job__sub">{buildJobSubtitle(job, timezone)}</p>
        )}
        {downloadable && <p className="notification-job__expiry">{formatExpiry(job.expiresAt)}</p>}
      </div>

      <JobActions
        job={job}
        downloadable={downloadable}
        retryable={retryable}
        onDownload={onDownload}
        onRetry={onRetry}
      />
    </div>
  );
}
