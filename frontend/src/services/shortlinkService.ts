import { apiClient } from '@/lib/apiClient';
import { getFeatureEndpoint, getFeaturePageSize } from '@/config/featureConfig';
import type {
  PublicShortlink,
  ListShortlinksResponse,
  CreateShortlinkPayload,
  UpdateShortlinkPayload,
} from '@/types/shortlink.types';

const SHORTLINKS_ENDPOINT = getFeatureEndpoint('shortlinks', '/api/shortlinks');
const DEFAULT_PAGE_SIZE = getFeaturePageSize('shortlinks', 10);

export const shortlinkService = {
  async listMine(
    limit = DEFAULT_PAGE_SIZE,
    skip = 0,
    search?: string,
    projectId?: string,
    archived?: boolean,
    signal?: AbortSignal
  ): Promise<ListShortlinksResponse> {
    const token = localStorage.getItem('accessToken');
    const page = Math.floor(skip / limit) + 1;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('page_size', String(limit));
    if (search) query.set('search', search);
    if (projectId) query.set('projectId', projectId);
    if (archived !== undefined) query.set('archived', String(archived));

    const res = await apiClient.getWithMeta<PublicShortlink[]>(`${SHORTLINKS_ENDPOINT}?${query.toString()}`, {
      accessToken: token,
      signal,
    });
    const items = Array.isArray(res.data) ? res.data : [];
    const meta = res.meta ?? { page, page_size: limit, total: items.length };
    return {
      items,
      pagination: {
        total: meta.total,
        skip,
        limit: meta.page_size,
      },
    };
  },

  async create(payload: CreateShortlinkPayload): Promise<PublicShortlink> {
    const token = localStorage.getItem('accessToken');
    return apiClient.post<PublicShortlink>('/api/shortlinks', payload, {
      accessToken: token,
    });
  },

  async update(id: string, payload: UpdateShortlinkPayload): Promise<PublicShortlink> {
    const token = localStorage.getItem('accessToken');
    return apiClient.patch<PublicShortlink>(`/api/shortlinks/${id}`, payload, {
      accessToken: token,
    });
  },

  async delete(id: string): Promise<PublicShortlink> {
    const token = localStorage.getItem('accessToken');
    return apiClient.delete<PublicShortlink>(`/api/shortlinks/${id}`, {
      accessToken: token,
    });
  },

  async getClicksLog(params: {
    shortlinkId?: string;
    page?: number;
    limit?: number;
    range?: string;
    search?: string;
    signal?: AbortSignal;
  }): Promise<import('@/types/shortlink.types').ClicksLogResponse> {
    const token = localStorage.getItem('accessToken');
    const query = new URLSearchParams();
    if (params.shortlinkId) query.set('shortlinkId', params.shortlinkId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.range) query.set('range', params.range);
    if (params.search) query.set('search', params.search);

    const res = await apiClient.getWithMeta<import('@/types/shortlink.types').ClickLogEntry[]>(
      `/api/analytics/clicks?${query.toString()}`,
      { accessToken: token, signal: params.signal }
    );

    const clicks = Array.isArray(res.data) ? res.data : [];
    const meta = res.meta ?? { page: params.page || 1, page_size: params.limit || 20, total: clicks.length };
    const totalPages = Math.ceil(meta.total / meta.page_size) || (meta.total === 0 ? 0 : 1);

    return {
      clicks,
      totalCount: meta.total,
      page: meta.page,
      limit: meta.page_size,
      totalPages,
    };
  },

  async exportClicks(params: {
    slug?: string;
    shortlinkId?: string;
    projectName?: string;
    range?: string;
    timezone?: string;
    format?: 'csv' | 'pdf' | 'json' | 'xlsx';
    fields?: string[];
  }): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const queryString = buildExportQuery(params);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';

    const response = await fetch(`${baseUrl}/api/analytics/clicks/export?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to export click logs (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const filename = resolveExportFilename(disposition, params.projectName, params.slug, params.format);
    triggerDownload(blob, filename, params.format);
  },

  async downloadClicksCSV(params: { shortlinkId?: string; range?: string; slug?: string; projectName?: string }): Promise<void> {
    return shortlinkService.exportClicks({ ...params, format: 'csv' });
  },
};

const MIME_MAP: Record<string, string> = {
  csv: 'text/csv;charset=utf-8;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  json: 'application/json',
};

function buildExportQuery(params: {
  slug?: string;
  shortlinkId?: string;
  projectName?: string;
  range?: string;
  timezone?: string;
  format?: 'csv' | 'pdf' | 'json' | 'xlsx';
  fields?: string[];
}): string {
  const query = new URLSearchParams();
  const map: Record<string, string | undefined> = {
    slug: params.slug,
    shortlinkId: params.shortlinkId,
    projectName: params.projectName,
    range: params.range,
    timezone: params.timezone,
    format: params.format,
    fields: params.fields && params.fields.length > 0 ? params.fields.join(',') : undefined,
  };
  for (const [key, val] of Object.entries(map)) {
    if (val) query.set(key, val);
  }
  return query.toString();
}

function extractDispositionFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename=["']?([^"';]+)["']?/);
  return match ? match[1] : null;
}

function buildFallbackFilename(projectName?: string, slug?: string, format = 'csv'): string {
  const safeProject = (projectName || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSlug = (slug || 'report').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const prefix = safeProject ? `${safeProject}-${safeSlug}` : `click-logs-${safeSlug}`;
  return `${prefix}-${dateStr}.${format}`;
}

function resolveExportFilename(
  disposition: string | null,
  projectName?: string,
  slug?: string,
  format = 'csv'
): string {
  return extractDispositionFilename(disposition) || buildFallbackFilename(projectName, slug, format);
}

function triggerDownload(rawBlob: Blob, filename: string, format = 'csv'): void {
  const mimeType = MIME_MAP[format] || rawBlob.type || 'application/octet-stream';
  const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    window.URL.revokeObjectURL(url);
  }, 1000);
}
