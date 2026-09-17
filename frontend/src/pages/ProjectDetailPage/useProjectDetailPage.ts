import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { useNewLinkDrawer } from '@/context/NewLinkDrawerContext';
import type { PublicShortlink } from '@/types/shortlink.types';
import { useProjectDetailQueries } from './useProjectDetailQueries';
import {
  useProjectLinkMutations,
  useProjectArchiveMutations,
  useProjectDeleteMutation,
} from './useProjectDetailMutations';

function useProjectModalsState() {
  const [deleteTarget, setDeleteTarget] = useState<PublicShortlink | null>(null);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [isArchiveProjectModalOpen, setIsArchiveProjectModalOpen] = useState(false);
  const [isUnarchiveProjectModalOpen, setIsUnarchiveProjectModalOpen] = useState(false);
  return {
    deleteTarget,
    setDeleteTarget,
    isDeleteProjectModalOpen,
    setIsDeleteProjectModalOpen,
    isArchiveProjectModalOpen,
    setIsArchiveProjectModalOpen,
    isUnarchiveProjectModalOpen,
    setIsUnarchiveProjectModalOpen,
  };
}

function useProjectNavigation(projectId?: string) {
  const navigate = useNavigate();
  const { openNewLinkDrawer } = useNewLinkDrawer();
  return {
    handleBackToProjects: () => navigate('/projects'),
    openAddDrawer: (initialUrl?: unknown) =>
      openNewLinkDrawer({
        defaultProjectId: projectId,
        initialUrl: typeof initialUrl === 'string' ? initialUrl : undefined,
      }),
    openEditDrawer: (shortlink: PublicShortlink) => openNewLinkDrawer({ editTarget: shortlink }),
    handleLogout: () => {
      localStorage.removeItem('auth_token');
      navigate('/login');
    },
  };
}

function useProjectMutationsBundle(
  projectId: string | undefined,
  modals: ReturnType<typeof useProjectModalsState>,
  nav: ReturnType<typeof useProjectNavigation>
) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const linksMutations = useProjectLinkMutations({ queryClient, toast, setDeleteTarget: modals.setDeleteTarget });
  const archiveMutations = useProjectArchiveMutations({
    projectId,
    queryClient,
    toast,
    setIsArchiveProjectModalOpen: modals.setIsArchiveProjectModalOpen,
    setIsUnarchiveProjectModalOpen: modals.setIsUnarchiveProjectModalOpen,
  });
  const deleteProjectMutation = useProjectDeleteMutation({
    projectId,
    queryClient,
    toast,
    navigate: nav.handleBackToProjects,
  });

  return {
    deleting: linksMutations.deleteMutation.isPending,
    deleteProjectPending: deleteProjectMutation.isPending,
    archiveProjectPending: archiveMutations.archiveProjectMutation.isPending,
    unarchiveProjectPending: archiveMutations.unarchiveProjectMutation.isPending,
    handleDeleteConfirm: () => (modals.deleteTarget ? linksMutations.deleteMutation.mutate(modals.deleteTarget.id) : undefined),
    handleArchiveProject: () => archiveMutations.archiveProjectMutation.mutate(),
    handleUnarchiveProject: () => archiveMutations.unarchiveProjectMutation.mutate(),
    handleDeleteProjectConfirm: () => deleteProjectMutation.mutate(),
    handleToggleActive: (sl: PublicShortlink) => linksMutations.toggleMutation.mutate({ id: sl.id, active: !sl.active }),
  };
}

export function useProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const modals = useProjectModalsState();
  const queries = useProjectDetailQueries({ projectId, currentPage, pageSize: 10, search });
  const nav = useProjectNavigation(queries.project?.id ?? projectId);
  const muts = useProjectMutationsBundle(queries.project?.id ?? projectId, modals, nav);

  return {
    projectId,
    project: queries.project ?? null,
    loadingProject: queries.loadingProject,
    items: queries.items,
    totalItems: queries.totalItems,
    loadingLinks: queries.loadingLinks,
    error: queries.linksError ? 'Failed to load project links.' : null,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize: 10,
    ...modals,
    ...nav,
    ...muts,
  };
}
