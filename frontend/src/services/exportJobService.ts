import { apiClient, API_BASE_URL } from '@/lib/apiClient';
import { getFeatureEndpoint, getFeaturePageSize } from '@/config/featureConfig';
import { triggerDownload } from '@/utils/download.utils';
import type {
  CreateExportJobPayload,
  ExportJobsListResponse,
  ExportJobStatus,
  PublicExportJob,
} from '@/types/exportJob.types';

const EXPORT_JOBS_ENDPOINT = getFeatureEndpoint('exportJobs', '/api/analytics/clicks/export/jobs');
const DEFAULT_PAGE_SIZE = getFeaturePageSize('exportJobs', 20);

export const exportJobService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: ExportJobStatus;
    signal?: AbortSignal;
  } = {}): Promise<ExportJobsListResponse> {
    const token = localStorage.getItem('accessToken');
    const page = params.page ?? 1;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    const queryString = buildJobsQuery(page, limit, params.status);

    const res = await apiClient.getWithMeta<PublicExportJob[]>(
      `${EXPORT_JOBS_ENDPOINT}?${queryString}`,
      { accessToken: token, signal: params.signal }
    );

    const jobs = Array.isArray(res.data) ? res.data : [];
    const meta = res.meta ?? { page, page_size: limit, total: jobs.length };

    return { jobs, total: meta.total, totalPages: computeTotalPages(meta.total, meta.page_size) };
  },

  async create(payload: CreateExportJobPayload): Promise<PublicExportJob> {
    const token = localStorage.getItem('accessToken');
    return apiClient.post<PublicExportJob>(EXPORT_JOBS_ENDPOINT, payload, { accessToken: token });
  },

  async retry(jobId: string): Promise<PublicExportJob> {
    const token = localStorage.getItem('accessToken');
    return apiClient.post<PublicExportJob>(`${EXPORT_JOBS_ENDPOINT}/${jobId}/retry`, undefined, {
      accessToken: token,
    });
  },

  async markAllRead(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await apiClient.post<{ read: boolean }>(`${EXPORT_JOBS_ENDPOINT}/read-all`, undefined, {
      accessToken: token,
    });
  },

  async download(job: PublicExportJob): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}${job.downloadUrl}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to download export (${response.status})`);
    }

    const blob = await response.blob();
    const filename = job.filename || `click-logs-${job.id}.${job.format}`;
    triggerDownload(blob, filename, job.format);
  },
};

function buildJobsQuery(page: number, limit: number, status?: ExportJobStatus): string {
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('page_size', String(limit));
  if (status) query.set('status', status);
  return query.toString();
}

function computeTotalPages(total: number, pageSize: number): number {
  const pages = Math.ceil(total / pageSize);
  return pages || (total === 0 ? 0 : 1);
}
