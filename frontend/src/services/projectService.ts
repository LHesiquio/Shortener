import { apiClient } from '@/lib/apiClient';
import { getFeatureEndpoint } from '@/config/featureConfig';
import type { PublicProject } from '@/types/shortlink.types';

const PROJECTS_ENDPOINT = getFeatureEndpoint('projects', '/api/projects');

export const projectService = {
  list: async (search?: string, archived?: boolean, signal?: AbortSignal): Promise<PublicProject[]> => {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    if (search) params.set('search', search.trim());
    if (archived !== undefined) params.set('archived', String(archived));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.getWithMeta<PublicProject[]>(`${PROJECTS_ENDPOINT}${queryString}`, {
      accessToken: token,
      signal,
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  listPaginated: async (params: { page?: number; pageSize?: number; search?: string; archived?: boolean }) => {
    const token = localStorage.getItem('accessToken');
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('page_size', String(params.pageSize));
    if (params.search) query.set('search', params.search);
    if (params.archived !== undefined) query.set('archived', String(params.archived));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.getWithMeta<PublicProject[]>(`/api/projects${queryString}`, { accessToken: token });
    return {
      items: Array.isArray(res.data) ? res.data : [],
      meta: res.meta ?? { page: 1, page_size: 10, total: 0 },
    };
  },

  create: async (name: string, description?: string, slug?: string): Promise<PublicProject> => {
    const token = localStorage.getItem('accessToken');
    return apiClient.post<PublicProject>(
      '/api/projects',
      { name, description, slug },
      { accessToken: token }
    );
  },

  archive: async (id: string): Promise<PublicProject> => {
    const token = localStorage.getItem('accessToken');
    return apiClient.patch<PublicProject>(`/api/projects/${id}/archive`, {}, { accessToken: token });
  },

  unarchive: async (id: string): Promise<PublicProject> => {
    const token = localStorage.getItem('accessToken');
    return apiClient.patch<PublicProject>(`/api/projects/${id}/unarchive`, {}, { accessToken: token });
  },

  getById: async (id: string): Promise<PublicProject> => {
    const token = localStorage.getItem('accessToken');
    return apiClient.get<PublicProject>(`/api/projects/${id}`, { accessToken: token });
  },

  delete: async (id: string): Promise<PublicProject> => {
    const token = localStorage.getItem('accessToken');
    return apiClient.delete<PublicProject>(`/api/projects/${id}`, { accessToken: token });
  },
};
