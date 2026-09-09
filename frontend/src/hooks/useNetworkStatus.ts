import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
}

async function pingConnectivity(url = '/api/health'): Promise<boolean> {
  if (!navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok || res.status < 500;
  } catch {
    return navigator.onLine;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    const reachable = await pingConnectivity();
    if (isMountedRef.current) {
      setIsOnline(reachable);
      setIsChecking(false);
    }
    return reachable;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return useMemo(
    () => ({ isOnline, isChecking, checkConnection }),
    [isOnline, isChecking, checkConnection]
  );
}
