import type { AnalyticsSummary } from '@/services/analyticsService';

export interface AnalyticsPageState {
  summary: AnalyticsSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  selectedRange: '24h' | '7d' | '30d';
  setSelectedRange: (range: '24h' | '7d' | '30d') => void;
  handleLogout: () => void;
}
