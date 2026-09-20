import type { ExportJobStatus, PublicExportJob } from '@/types/exportJob.types';
import { formatLocalizedTooltip } from '@/utils/date.utils';

export interface JobStatusMeta {
  icon: string;
  label: string;
  tone: 'pending' | 'success' | 'error';
}

export const JOB_STATUS_META: Record<ExportJobStatus, JobStatusMeta> = {
  queued: { icon: 'schedule', label: 'Queued', tone: 'pending' },
  processing: { icon: 'progress_activity', label: 'Processing', tone: 'pending' },
  completed: { icon: 'check_circle', label: 'Ready', tone: 'success' },
  failed: { icon: 'error', label: 'Failed', tone: 'error' },
};

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${formatByteValue(value, unitIndex)} ${BYTE_UNITS[unitIndex]}`;
}

function formatByteValue(value: number, unitIndex: number): string {
  const decimals = unitIndex > 0 && value < 10 ? 1 : 0;
  return value.toFixed(decimals);
}

export function formatExpiry(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  const days = Math.floor(remaining / 86_400_000);
  if (days >= 1) return `Expires in ${days}d`;
  const hours = Math.max(1, Math.floor(remaining / 3_600_000));
  return `Expires in ${hours}h`;
}

export function buildJobSubtitle(job: PublicExportJob, timezone: string): string {
  const parts = [job.format.toUpperCase()];
  if (job.recordCount !== null) parts.push(`${job.recordCount.toLocaleString('en-US')} records`);
  if (job.sizeBytes !== null) parts.push(formatBytes(job.sizeBytes));
  parts.push(formatLocalizedTooltip(job.createdAt, timezone));
  return parts.join(' · ');
}

export function isDownloadable(job: PublicExportJob): boolean {
  return job.status === 'completed' && !job.isExpired;
}

export function canRetry(job: PublicExportJob): boolean {
  return job.status === 'failed' || (job.status === 'completed' && job.isExpired);
}

export function buildRetryLabel(job: PublicExportJob): string {
  return job.status === 'failed' ? 'Retry export' : 'Export again';
}

export function buildErrorText(job: PublicExportJob): string {
  return job.error || 'Export failed';
}
