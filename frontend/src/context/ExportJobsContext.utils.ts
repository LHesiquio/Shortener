import type { ExportJobStatus, PublicExportJob } from '@/types/exportJob.types';

export const EXPORT_JOBS_QUERY_KEY = ['export-jobs'];

export interface JobTransition {
  job: PublicExportJob;
  type: 'completed' | 'failed';
}

const TERMINAL_STATUSES: ExportJobStatus[] = ['completed', 'failed'];

export function hasActiveJobs(jobs: PublicExportJob[]): boolean {
  return jobs.some((job) => job.status === 'queued' || job.status === 'processing');
}

export function countUnreadJobs(jobs: PublicExportJob[]): number {
  return jobs.filter((job) => !job.isRead && TERMINAL_STATUSES.includes(job.status)).length;
}

export function snapshotStatuses(jobs: PublicExportJob[]): Map<string, ExportJobStatus> {
  return new Map(jobs.map((job) => [job.id, job.status]));
}

export function detectTransitions(
  jobs: PublicExportJob[],
  previous: Map<string, ExportJobStatus>
): JobTransition[] {
  return jobs
    .map((job) => toTransition(job, previous.get(job.id)))
    .filter((transition): transition is JobTransition => transition !== null);
}

function toTransition(
  job: PublicExportJob,
  previousStatus: ExportJobStatus | undefined
): JobTransition | null {
  if (previousStatus === undefined || previousStatus === job.status) return null;
  if (job.status === 'completed') return { job, type: 'completed' };
  if (job.status === 'failed') return { job, type: 'failed' };
  return null;
}
