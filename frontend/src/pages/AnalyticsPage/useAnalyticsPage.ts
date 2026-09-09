import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import { ApiError } from '@/lib/apiClient';
import type { AnalyticsPageState } from './AnalyticsPage.types';

export function useAnalyticsPage(): AnalyticsPageState {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>('30d');

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['analytics-summary', selectedRange],
    queryFn: ({ signal }) => analyticsService.getSummary(selectedRange, signal),
  });

  const errorMessage = error instanceof ApiError
    ? error.message
    : error
    ? 'Failed to load analytics data.'
    : null;

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    navigate('/login');
  };

  return {
    summary,
    isLoading,
    isError: Boolean(error),
    errorMessage,
    selectedRange,
    setSelectedRange,
    handleLogout,
  };
}
