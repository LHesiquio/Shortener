import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/apiClient';
import type { UseRedirectReturn } from './RedirectPage.types';

export function useRedirect(): UseRedirectReturn {
  const { slug } = useParams<{ slug: string }>();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(true);

  const targetUrl = useMemo(() => {
    if (!slug) return '';
    const cleanSlug = encodeURIComponent(slug.trim());
    return `${API_BASE_URL}/r/${cleanSlug}`;
  }, [slug]);

  useEffect(() => {
    if (!targetUrl) {
      setIsRedirecting(false);
      return;
    }

    // Immediately replace window location to forward through backend click tracker
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return {
    slug,
    targetUrl,
    isRedirecting,
  };
}
