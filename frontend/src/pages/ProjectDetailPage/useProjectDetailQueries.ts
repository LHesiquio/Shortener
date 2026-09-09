import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { shortlinkService } from '@/services/shortlinkService';
import { useDebounce } from '@/hooks/useDebounce';

interface QueryParams {
  projectId?: string;
  currentPage: number;
  pageSize: number;
  search: string;
}

export function useProjectDetailQueries({
  projectId,
  currentPage,
  pageSize,
  search,
}: QueryParams) {
  const debouncedSearch = useDebounce(search, 300);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => projectService.getById(projectId!),
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 2,
  });

  const isProjectArchived = project?.isArchived;
  const skip = (currentPage - 1) * pageSize;

  const { data: shortlinksData, isLoading: loadingLinks, error: linksError } = useQuery({
    queryKey: ['project-shortlinks', projectId, currentPage, pageSize, debouncedSearch, isProjectArchived],
    queryFn: ({ signal }) =>
      shortlinkService.listMine(pageSize, skip, debouncedSearch, projectId, isProjectArchived, signal),
    enabled: Boolean(projectId),
  });

  const items = shortlinksData?.items ?? [];
  const totalItems = shortlinksData?.pagination.total ?? 0;

  return {
    project,
    loadingProject,
    items,
    totalItems,
    loadingLinks,
    linksError,
  };
}
