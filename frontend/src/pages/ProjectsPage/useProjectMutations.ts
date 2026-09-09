import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { useToast } from '@/context/ToastContext';
import type { PublicProject } from '@/types/shortlink.types';

interface CreateMutationProps {
  name: string;
  desc: string;
  setIsOpen: (open: boolean) => void;
  setName: (name: string) => void;
  setDesc: (desc: string) => void;
}

export function useCreateProjectMutation({ name, desc, setIsOpen, setName, setDesc }: CreateMutationProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (slug?: string) => {
      if (!name.trim()) throw new Error('Project name is required');
      return projectService.create(name.trim(), desc.trim() || undefined, slug);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      toast.push('Project created successfully', 'success');
      setIsOpen(false);
      setName('');
      setDesc('');
    },
    onError: (err: unknown) => {
      toast.push(err instanceof Error ? err.message : 'Failed to create project', 'error');
    },
  });

  return {
    createPending: mutation.isPending,
    handleCreateProject: (slug?: string) => mutation.mutate(slug),
  };
}

interface ActionMutationsProps {
  archiveTarget: PublicProject | null;
  setArchiveTarget: (p: PublicProject | null) => void;
  unarchiveTarget: PublicProject | null;
  setUnarchiveTarget: (p: PublicProject | null) => void;
  deleteTarget: PublicProject | null;
  setDeleteTarget: (p: PublicProject | null) => void;
}

function invalidateProjectCaches(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
  void queryClient.invalidateQueries({ queryKey: ['project-detail'] });
  void queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] });
  void queryClient.invalidateQueries({ queryKey: ['shortlinks'] });
}

function useArchiveMutation(queryClient: ReturnType<typeof useQueryClient>, toast: ReturnType<typeof useToast>, setTarget: (p: PublicProject | null) => void) {
  return useMutation({
    mutationFn: (id: string) => projectService.archive(id),
    onSuccess: () => {
      invalidateProjectCaches(queryClient);
      toast.push('Project deactivated successfully', 'success');
      setTarget(null);
    },
    onError: (err: unknown) => {
      toast.push(err instanceof Error ? err.message : 'Failed to deactivate project', 'error');
    },
  });
}

function useUnarchiveMutation(queryClient: ReturnType<typeof useQueryClient>, toast: ReturnType<typeof useToast>, setTarget: (p: PublicProject | null) => void) {
  return useMutation({
    mutationFn: (id: string) => projectService.unarchive(id),
    onSuccess: () => {
      invalidateProjectCaches(queryClient);
      toast.push('Project reactivated successfully', 'success');
      setTarget(null);
    },
    onError: (err: unknown) => {
      toast.push(err instanceof Error ? err.message : 'Failed to reactivate project', 'error');
    },
  });
}

function useDeleteMutation(queryClient: ReturnType<typeof useQueryClient>, toast: ReturnType<typeof useToast>, setTarget: (p: PublicProject | null) => void) {
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      toast.push('Project and all associated links permanently deleted', 'success');
      setTarget(null);
    },
    onError: (err: unknown) => {
      toast.push(err instanceof Error ? err.message : 'Failed to delete project', 'error');
    },
  });
}

export function useProjectActionMutations({
  archiveTarget,
  setArchiveTarget,
  unarchiveTarget,
  setUnarchiveTarget,
  deleteTarget,
  setDeleteTarget,
}: ActionMutationsProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const archive = useArchiveMutation(queryClient, toast, setArchiveTarget);
  const unarchive = useUnarchiveMutation(queryClient, toast, setUnarchiveTarget);
  const remove = useDeleteMutation(queryClient, toast, setDeleteTarget);

  return {
    archivePending: archive.isPending,
    handleConfirmArchive: () => { if (archiveTarget) archive.mutate(archiveTarget.id); },
    unarchivePending: unarchive.isPending,
    handleConfirmUnarchive: () => { if (unarchiveTarget) unarchive.mutate(unarchiveTarget.id); },
    deletePending: remove.isPending,
    handleConfirmDelete: () => { if (deleteTarget) remove.mutate(deleteTarget.id); },
  };
}
