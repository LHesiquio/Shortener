import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra class applied to the inner card (for size variants etc.) */
  cardClassName?: string;
  /** Extra class applied to the outer overlay */
  overlayClassName?: string;
  /** aria-label for the dialog */
  ariaLabel?: string;
  /** Whether the modal is currently in full-screen maximized mode */
  isMaximized?: boolean;
}

export interface UseModalMaximizeOptions {
  allowMaximize?: boolean;
  defaultMaximized?: boolean;
  persistMaximized?: boolean;
  storageKey?: string;
}
