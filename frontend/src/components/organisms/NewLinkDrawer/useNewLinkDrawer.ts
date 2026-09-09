import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewLinkDrawerProps } from './NewLinkDrawer.types';
import type { PublicProject } from '@/types/shortlink.types';
import { projectService } from '@/services/projectService';
import { deriveTitleFromUrl, normalizeUrl } from '@/utils/url.utils';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5001';
const SHORT_BASE = API_BASE_URL.replace('/api', '');

function formatDateForInput(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useNewLinkDrawer(props: NewLinkDrawerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const initUrl = props.editTarget?.url ?? props.initialUrl ?? '';
  const initTitle = props.editTarget?.title ?? deriveTitleFromUrl(initUrl);

  const [url, setUrlState] = useState(initUrl);
  const [title, setTitleState] = useState(initTitle);
  const [titleEdited, setTitleEdited] = useState(false);
  const [projectId, setProjectId] = useState(props.editTarget?.projectId ?? '');
  const [activeFrom, setActiveFrom] = useState(formatDateForInput(props.editTarget?.activeFrom));
  const [activeTo, setActiveTo] = useState(formatDateForInput(props.editTarget?.activeTo));

  const [projectSearch, setProjectSearch] = useState('');
  const debouncedProjectSearch = useDebounce(projectSearch, 300);

  const [isCreatingProjectMode, setIsCreatingProjectMode] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [prevIsOpen, setPrevIsOpen] = useState(props.isOpen);
  const [prevTarget, setPrevTarget] = useState(props.editTarget);

  // TanStack Query for projects list (server-side search enabled with 300ms debounce)
  const { data: projects = [], isFetching } = useQuery({
    queryKey: ['projects', debouncedProjectSearch],
    queryFn: () => projectService.list(debouncedProjectSearch),
    enabled: props.isOpen,
  });

  // Show loading indicator if currently typing (debounce pending) or query is fetching
  const isSearching = projectSearch !== debouncedProjectSearch || isFetching;

  // TanStack Mutation for creating new projects
  const createProjectMutation = useMutation({
    mutationFn: (name: string) => projectService.create(name),
    onSuccess: (newProject) => {
      queryClient.setQueryData<PublicProject[]>(['projects', ''], (old = []) => [newProject, ...old]);
      void queryClient.invalidateQueries({ queryKey: ['projects'] });

      setProjectId(newProject.id);
      setNewProjectName('');
      setIsCreatingProjectMode(false);

      toast.push(`Project "${newProject.name}" created successfully.`, 'success');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create project.';
      toast.push(msg, 'error');
    },
  });

  // Synchronize state on drawer open or edit target change
  if (props.isOpen && (!prevIsOpen || props.editTarget !== prevTarget)) {
    setPrevIsOpen(true);
    setPrevTarget(props.editTarget);
    setUrlState(initUrl);
    setTitleState(initTitle);
    setTitleEdited(false);
    setIsCreatingProjectMode(false);
    setNewProjectName('');
    setProjectSearch('');
    setProjectId(props.editTarget?.projectId ?? props.defaultProjectId ?? '');
    setActiveFrom(formatDateForInput(props.editTarget?.activeFrom));
    setActiveTo(formatDateForInput(props.editTarget?.activeTo));
  } else if (!props.isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const effectiveProjectId = projectId;

  const setUrl = (newUrl: string) => {
    setUrlState(newUrl);
    if (!titleEdited) {
      const derived = deriveTitleFromUrl(newUrl);
      if (derived) setTitleState(derived);
    }
  };

  const setTitle = (newTitle: string) => {
    setTitleEdited(true);
    setTitleState(newTitle);
  };

  const handleCreateProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    createProjectMutation.mutate(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    props.onSave({
      url: normalized,
      title,
      slug: '',
      projectId: effectiveProjectId,
      activeFrom: activeFrom ? new Date(activeFrom).toISOString() : undefined,
      activeTo: activeTo ? new Date(activeTo).toISOString() : undefined,
    });
  };

  return {
    url,
    setUrl,
    title,
    setTitle,
    projectId: effectiveProjectId,
    setProjectId,
    activeFrom,
    setActiveFrom,
    activeTo,
    setActiveTo,
    projects,
    loadingProjects: isSearching,
    projectSearch,
    setProjectSearch,
    isCreatingProjectMode,
    setIsCreatingProjectMode,
    newProjectName,
    setNewProjectName,
    creatingProject: createProjectMutation.isPending,
    handleCreateProject,
    defaultProjectId: props.defaultProjectId,
    handleSubmit,
    SHORT_BASE,
  };
}
