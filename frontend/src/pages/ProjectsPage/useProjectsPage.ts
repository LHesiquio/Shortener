import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { useDebounce } from '@/hooks/useDebounce';
import { useCreateProjectMutation, useProjectActionMutations } from './useProjectMutations';
import type { PublicProject } from '@/types/shortlink.types';

function useProjectsState() {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PublicProject | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PublicProject | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] = useState<PublicProject | null>(null);

  return {
    tab, setTab, search, setSearch,
    isCreateModalOpen, setIsCreateModalOpen,
    newProjectName, setNewProjectName,
    newProjectDesc, setNewProjectDesc,
    deleteTarget, setDeleteTarget,
    archiveTarget, setArchiveTarget,
    unarchiveTarget, setUnarchiveTarget,
  };
}

export function useProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = useProjectsState();
  const debouncedSearch = useDebounce(state.search, 300);

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects-list', debouncedSearch, state.tab],
    queryFn: ({ signal }) => projectService.list(debouncedSearch.trim(), state.tab === 'archived', signal),
    staleTime: 1000 * 60 * 2,
  });

  const create = useCreateProjectMutation({
    name: state.newProjectName,
    desc: state.newProjectDesc,
    setIsOpen: state.setIsCreateModalOpen,
    setName: state.setNewProjectName,
    setDesc: state.setNewProjectDesc,
  });

  const actions = useProjectActionMutations({
    archiveTarget: state.archiveTarget,
    setArchiveTarget: state.setArchiveTarget,
    unarchiveTarget: state.unarchiveTarget,
    setUnarchiveTarget: state.setUnarchiveTarget,
    deleteTarget: state.deleteTarget,
    setDeleteTarget: state.setDeleteTarget,
  });

  return {
    ...state,
    projects,
    isLoading,
    error: error ? 'Failed to load projects.' : null,
    ...create,
    ...actions,
    handleNavigateToProject: (id: string) => navigate(`/projects/${id}`),
    handleLogout: () => { localStorage.clear(); queryClient.clear(); navigate('/login'); },
  };
}
