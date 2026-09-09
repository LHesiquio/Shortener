export interface RedirectPageProps {
  slugParamName?: string;
}

export interface UseRedirectReturn {
  slug?: string;
  targetUrl: string;
  isRedirecting: boolean;
}
