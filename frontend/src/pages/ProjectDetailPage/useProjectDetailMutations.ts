import { useMutation, type QueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { shortlinkService } from '@/services/shortlinkService';
import type { ToastContextValue } from '@/context/ToastContext';
import { ApiError } from '@/lib/apiClient';

interface LinkMutationParams {
  queryClient: QueryClient;
  toast: ToastContextValue;
  setDeleteTarget: (val: null) => void;
}

export function useProjectLinkMutations({
  queryClient,
  toast,
  setDeleteTarget,
}: LinkMutationParams) {
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shortlinkService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] });
      toast.push('Shortlink deleted successfully.', 'success');
      setDeleteTarget(null);
    },
    onError: (e: unknown) => {
      toast.push(e instanceof ApiError ? e.message : 'Failed to delete link.', 'error');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return shortlinkService.update(id, { active });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] });
      toast.push(variables.active ? 'Shortlink enabled.' : 'Shortlink disabled.', 'info');
    },
  });

  return { deleteMutation, toggleMutation };
}

interface ArchiveParams {
  projectId?: string;
  queryClient: QueryClient;
  toast: ToastContextValue;
  setIsArchiveProjectModalOpen: (val: boolean) => void;
  setIsUnarchiveProjectModalOpen: (val: boolean) => void;
}

export function useProjectArchiveMutations({
  projectId,
  queryClient,
  toast,
  setIsArchiveProjectModalOpen,
  setIsUnarchiveProjectModalOpen,
}: ArchiveParams) {
  const archiveProjectMutation = useMutation({
    mutationFn: () => projectService.archive(projectId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      void queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] });
      toast.push('Project deactivated successfully.', 'success');
      setIsArchiveProjectModalOpen(false);
    },
    onError: (e: unknown) => {
      toast.push(e instanceof ApiError ? e.message : 'Failed to deactivate project.', 'error');
    },
  });

  const unarchiveProjectMutation = useMutation({
    mutationFn: () => projectService.unarchive(projectId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      void queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] });
      toast.push('Project reactivated successfully.', 'success');
      setIsUnarchiveProjectModalOpen(false);
    },
    onError: (e: unknown) => {
      toast.push(e instanceof ApiError ? e.message : 'Failed to reactivate project.', 'error');
    },
  });

  return { archiveProjectMutation, unarchiveProjectMutation };
}

export function useProjectDeleteMutation({
  projectId,
  queryClient,
  toast,
  navigate,
}: {
  projectId?: string;
  queryClient: QueryClient;
  toast: ToastContextValue;
  navigate: (path: string) => void;
}) {
  return useMutation({
    mutationFn: () => projectService.delete(projectId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      toast.push('Project permanently deleted.', 'success');
      navigate('/projects');
    },
    onError: (e: unknown) => {
      toast.push(e instanceof ApiError ? e.message : 'Failed to delete project.', 'error');
    },
  });
}
