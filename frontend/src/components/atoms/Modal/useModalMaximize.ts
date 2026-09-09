import { useState, useCallback } from 'react';
import type { UseModalMaximizeOptions } from './Modal.types';

const DEFAULT_STORAGE_KEY = 'modal-maximized';

function getInitialMaximizedState(
  allowMaximize: boolean,
  defaultMaximized: boolean,
  persistMaximized: boolean,
  storageKey: string
): boolean {
  if (!allowMaximize) return false;
  if (!persistMaximized) return defaultMaximized;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) return saved === 'true';
  } catch {
    // Ignore localStorage read errors
  }
  return defaultMaximized;
}

export function useModalMaximize({
  allowMaximize = true,
  defaultMaximized = false,
  persistMaximized = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: UseModalMaximizeOptions = {}) {
  const [isMaximized, setIsMaximized] = useState<boolean>(() =>
    getInitialMaximizedState(allowMaximize, defaultMaximized, persistMaximized, storageKey)
  );

  const toggleMaximize = useCallback(() => {
    if (!allowMaximize) return;
    setIsMaximized((prev) => {
      const next = !prev;
      if (persistMaximized) {
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {
          // Ignore localStorage write errors
        }
      }
      return next;
    });
  }, [allowMaximize, persistMaximized, storageKey]);

  return {
    isMaximized: allowMaximize && isMaximized,
    allowMaximize,
    toggleMaximize,
  };
}
