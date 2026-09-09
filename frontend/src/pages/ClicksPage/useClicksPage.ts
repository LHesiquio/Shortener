import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { shortlinkService } from '@/services/shortlinkService';
import { useUserProfile } from '@/context/UserProfileContext';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_LIMIT = 15;

function useClicksQuery(range: string, search: string, page: number) {
  const debouncedSearch = useDebounce(search, 300);
  return useQuery({
    queryKey: ['clicks-log-all', range, debouncedSearch, page],
    queryFn: ({ signal }) =>
      shortlinkService.getClicksLog({
        range,
        search: debouncedSearch,
        page,
        limit: PAGE_LIMIT,
        signal,
      }),
  });
}

function useInitialSearchParam(
  searchParams: URLSearchParams,
  setSearch: (s: string) => void,
  setPage: (p: number) => void
) {
  useEffect(() => {
    const param = searchParams.get('search') || searchParams.get('slug');
    if (param !== null && param !== undefined) {
      setSearch(param);
      setPage(1);
    }
  }, [searchParams, setSearch, setPage]);
}

export function useClicksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { userTimezone } = useUserProfile();

  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState(
    () => searchParams.get('search') || searchParams.get('slug') || ''
  );
  const [topBarSearch, setTopBarSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useInitialSearchParam(searchParams, setSearch, setPage);

  const query = useClicksQuery(range, search || topBarSearch, page);

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    navigate('/login');
  };

  return {
    userTimezone,
    range,
    setRange: (r: string) => { setRange(r); setPage(1); },
    search,
    setSearch: (s: string) => { setSearch(s); setPage(1); },
    topBarSearch,
    setTopBarSearch,
    page,
    setPage,
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isExportModalOpen,
    handleOpenExportModal: () => setIsExportModalOpen(true),
    handleCloseExportModal: () => setIsExportModalOpen(false),
    handleLogout,
  };
}
