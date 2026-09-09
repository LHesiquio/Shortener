import { apiClient } from '@/lib/apiClient';
import type { PublicShortlink } from '@/types/shortlink.types';

export interface TimelineEntry {
  date: string;
  count: number;
}

export interface AnalyticsBreakdownEntry {
  key: string;
  count: number;
}

export interface ProjectBreakdownEntry {
  projectId: string;
  projectName: string;
  count: number;
}

export interface AnalyticsSummary {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  clicksLast30d: number;
  totalShortlinks: number;
  activeShortlinks: number;
  topLink: PublicShortlink | null;
  clicksTimeline: TimelineEntry[];
  byDevice: AnalyticsBreakdownEntry[];
  byBrowser: AnalyticsBreakdownEntry[];
  byOs: AnalyticsBreakdownEntry[];
  byCountry: AnalyticsBreakdownEntry[];
  byProject: ProjectBreakdownEntry[];
}

export const analyticsService = {
  getSummary: async (range: '24h' | '7d' | '30d' = '30d', signal?: AbortSignal): Promise<AnalyticsSummary> => {
    // Always send the browser-detected timezone so the backend can use it as a
    // fallback when the user's profile has no stored timezone field.
    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return apiClient.get<AnalyticsSummary>(
      `/api/analytics/summary?range=${range}&tz=${encodeURIComponent(clientTz)}`,
      { signal }
    );
  },
};
