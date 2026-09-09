import { apiClient } from '@/lib/apiClient';

export interface SlugCheckResponse {
  slug: string;
  isAvailable: boolean;
  suggestion?: string;
  reason?: string;
}

export const slugService = {
  checkAvailability: async (
    type: 'project' | 'shortlink',
    slug: string,
    excludeId?: string
  ): Promise<SlugCheckResponse> => {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams({ type, slug: slug.trim() });
    if (excludeId) params.set('excludeId', excludeId);

    return apiClient.get<SlugCheckResponse>(`/api/slugs/check?${params.toString()}`, {
      accessToken: token,
    });
  },
};
