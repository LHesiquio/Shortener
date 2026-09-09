import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shortlinkService } from '@/services/shortlinkService';
import { useUserProfile } from '@/context/UserProfileContext';
import { useDebounce } from '@/hooks/useDebounce';
import type { ClicksLogDrawerProps } from './ClicksLogDrawer.types';

const PAGE_LIMIT = 10;

interface QueryParams {
  isOpen: boolean;
  shortlinkId?: string;
  range: string;
  search: string;
  page: number;
}

function useClicksLogQuery({ isOpen, shortlinkId, range, search, page }: QueryParams) {
  const debouncedSearch = useDebounce(search, 300);
  return useQuery({
    queryKey: ['clicks-log', shortlinkId, range, debouncedSearch, page],
    queryFn: ({ signal }) =>
      shortlinkService.getClicksLog({
        shortlinkId,
        range,
        search: debouncedSearch,
        page,
        limit: PAGE_LIMIT,
        signal,
      }),
    enabled: isOpen,
  });
}

export function useClicksLogDrawer({ isOpen, shortlinkId }: ClicksLogDrawerProps) {
  const { userTimezone } = useUserProfile();
  const [range, setRange] = useState<string>('30d');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useClicksLogQuery({
    isOpen,
    shortlinkId,
    range,
    search,
    page,
  });

  const handleExportCSV = async () => {
    try {
      await shortlinkService.downloadClicksCSV({ shortlinkId, range });
    } catch {
      // Ignore export error
    }
  };

  return {
    userTimezone,
    range,
    setRange: (val: string) => { setRange(val); setPage(1); },
    search,
    setSearch: (val: string) => { setSearch(val); setPage(1); },
    page,
    setPage,
    data,
    isLoading,
    isError,
    refetch,
    handleExportCSV,
  };
}
