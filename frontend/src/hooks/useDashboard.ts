import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shortlinkService } from '@/services/shortlinkService';
import { analyticsService } from '@/services/analyticsService';
import type { PublicShortlink } from '@/types/shortlink.types';
import type { DrawerFormData } from '@/components/organisms/NewLinkDrawer/NewLinkDrawer.types';
import { ApiError } from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';

export function useDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PublicShortlink | null>(null);
  const [initialUrl, setInitialUrl] = useState('');
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublicShortlink | null>(null);

  // TanStack Query for analytics summary (aligned with AnalyticsPage 30d range for shared cache)
  const { data: analytics } = useQuery({
    queryKey: ['analytics-summary', '30d'],
    queryFn: ({ signal }) => analyticsService.getSummary('30d', signal),
  });

  const handleSetSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // TanStack Query for shortlinks list with debounce and AbortSignal
  const skip = (currentPage - 1) * pageSize;
  const { data, isLoading, error } = useQuery({
    queryKey: ['shortlinks', currentPage, pageSize, debouncedSearch],
    queryFn: ({ signal }) =>
      shortlinkService.listMine(pageSize, skip, debouncedSearch, undefined, undefined, signal),
  });

  const items = data?.items ?? [];
  const totalItems = data?.pagination.total ?? 0;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'Failed to load shortlinks.' : null;

  const topLinkSlug = analytics?.topLink ? `/${analytics.topLink.slug}` : undefined;
  const totalClicks = analytics?.totalClicks ?? 0;

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: async (formData: DrawerFormData) => {
      const title = formData.title.trim() || undefined;
      if (editTarget) {
        return shortlinkService.update(editTarget.id, {
          url: formData.url,
          title,
          projectId: formData.projectId,
          activeFrom: formData.activeFrom,
          activeTo: formData.activeTo,
        });
      }
      return shortlinkService.create({
        url: formData.url,
        title,
        slug: formData.slug.trim() || undefined,
        projectId: formData.projectId,
        activeFrom: formData.activeFrom,
        activeTo: formData.activeTo,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shortlinks'] });
      const isEditing = Boolean(editTarget);
      setEditTarget(null);
      setDrawerOpen(false);
      toast.push(
        isEditing ? 'Shortlink updated successfully.' : 'Shortlink created successfully.',
        'success'
      );
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Failed to save link.';
      setDrawerError(msg);
      toast.push(msg, 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shortlinkService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shortlinks'] });
      toast.push('Shortlink deleted successfully.', 'success');
      setDeleteTarget(null);
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete link.';
      toast.push(msg, 'error');
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return shortlinkService.update(id, { active });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['shortlinks'] });
      toast.push(
        variables.active ? 'Shortlink enabled.' : 'Shortlink disabled.',
        variables.active ? 'success' : 'info'
      );
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Failed to update link.';
      toast.push(msg, 'error');
    },
  });

  return {
    items,
    totalItems,
    topLinkSlug,
    totalClicks,
    loading: isLoading,
    error: errorMessage,
    search,
    setSearch: handleSetSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    drawerOpen,
    editTarget,
    initialUrl,
    saving: saveMutation.isPending,
    drawerError,
    deleteTarget,
    deleting: deleteMutation.isPending,
    openAddDrawer: (url?: string) => {
      setEditTarget(null);
      setDrawerError(null);
      setInitialUrl(url ?? '');
      setDrawerOpen(true);
    },
    openEditDrawer: (link: PublicShortlink) => {
      setEditTarget(link);
      setDrawerError(null);
      setDrawerOpen(true);
    },
    closeDrawer: () => setDrawerOpen(false),
    setDeleteTarget,
    handleSaveLink: (f: DrawerFormData) => saveMutation.mutate(f),
    handleDeleteConfirm: () => {
      if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
    },
    handleToggleActive: (link: PublicShortlink) => {
      toggleMutation.mutate({ id: link.id, active: !link.active });
    },
    handleLogout: () => {
      localStorage.clear();
      queryClient.clear();
      navigate('/login');
    },
  };
}
