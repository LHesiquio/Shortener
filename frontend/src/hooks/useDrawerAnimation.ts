import { useState, useEffect } from 'react';

/**
 * Hook to manage smooth enter/exit animations for drawer components.
 * Retains mounting during the exit animation before unmounting.
 */
export function useDrawerAnimation(isOpen: boolean, durationMs = 240) {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  if (isOpen && (!rendered || closing)) {
    setRendered(true);
    setClosing(false);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && rendered && !closing) {
      const startCloseTimer = setTimeout(() => setClosing(true), 0);
      const finishTimer = setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, durationMs);
      return () => {
        clearTimeout(startCloseTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isOpen, rendered, closing, durationMs]);

  return { rendered, closing };
}
