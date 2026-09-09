import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { slugService, type SlugCheckResponse } from '@/services/slugService';
import { slugify } from '@/utils/slug.utils';

interface UseSlugOptions {
  type: 'project' | 'shortlink';
  initialSlug?: string;
  excludeId?: string;
}

function useDebouncedSlug(slug: string, delay: number) {
  const [debounced, setDebounced] = useState(slug);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(slug.trim().toLowerCase()), delay);
    return () => clearTimeout(handler);
  }, [slug, delay]);
  return debounced;
}

export function useSlugAvailability({ type, initialSlug = '', excludeId }: UseSlugOptions) {
  const [slug, setSlugState] = useState(initialSlug);
  const [isCustom, setIsCustom] = useState(Boolean(initialSlug));
  const debouncedSlug = useDebouncedSlug(slug, 300);

  const { data, isLoading, isFetching } = useQuery<SlugCheckResponse>({
    queryKey: ['slug-check', type, debouncedSlug, excludeId],
    queryFn: () => slugService.checkAvailability(type, debouncedSlug, excludeId),
    enabled: debouncedSlug.length >= 2,
    staleTime: 1000 * 60,
  });

  return {
    slug,
    setSlug: (val: string) => { setIsCustom(true); setSlugState(val.toLowerCase().replace(/\s+/g, '-')); },
    autoSuggestFromName: (name: string) => { if (!isCustom) setSlugState(slugify(name)); },
    resetSlug: () => { setIsCustom(false); setSlugState(''); },
    applySuggestion: () => { if (data?.suggestion) { setSlugState(data.suggestion); setIsCustom(true); } },
    isCustom,
    isChecking: isLoading || isFetching,
    isAvailable: debouncedSlug.length >= 2 ? Boolean(data?.isAvailable) : false,
    suggestion: data?.suggestion,
    reason: data?.reason,
  };
}
