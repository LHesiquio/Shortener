import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ModalProps } from './Modal.types';
import './Modal.css';

/** Duration must match --modal-duration CSS variable (200 ms). */
const ANIMATION_DURATION_MS = 200;

function useModalAnimation(isOpen: boolean) {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  // Open: mount immediately, clear closing flag
  if (isOpen && (!rendered || closing)) {
    setRendered(true);
    setClosing(false);
  }

  useEffect(() => {
    if (!isOpen && rendered && !closing) {
      // Kick off exit animation, then unmount
      const startTimer = setTimeout(() => setClosing(true), 0);
      const endTimer = setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, ANIMATION_DURATION_MS + 40); // slight buffer
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
  }, [isOpen, rendered, closing]);

  return { rendered, closing };
}

function useLockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);
}

function buildModalClasses(
  closing: boolean,
  isMaximized: boolean,
  cardClassName: string,
  overlayClassName: string
) {
  const closingOverlay = closing ? ' modal-overlay--closing' : '';
  const maxOverlay = isMaximized ? ' modal-overlay--maximized' : '';
  const finalOverlay = `modal-overlay${closingOverlay}${maxOverlay} ${overlayClassName}`.trim();

  const closingCard = closing ? ' modal-card--closing' : '';
  const maxCard = isMaximized ? ' modal-card--maximized' : '';
  const finalCard = `modal-card${closingCard}${maxCard} ${cardClassName}`.trim();

  return { finalOverlay, finalCard };
}

export function Modal({
  isOpen,
  onClose,
  children,
  cardClassName = '',
  overlayClassName = '',
  ariaLabel,
  isMaximized = false,
}: ModalProps) {
  const { rendered, closing } = useModalAnimation(isOpen);
  useLockBodyScroll(isOpen);

  if (!rendered) return null;

  const { finalOverlay, finalCard } = buildModalClasses(
    closing,
    isMaximized,
    cardClassName,
    overlayClassName
  );

  const modalNode = (
    <div className={finalOverlay} role="presentation" onClick={onClose}>
      <div
        className={finalCard}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
