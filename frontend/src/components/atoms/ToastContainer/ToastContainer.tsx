import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { Toast, ToastVariant } from '@/context/ToastContext';
import './ToastContainer.css';

const ICONS: Record<ToastVariant, string> = {
  success: 'check_circle',
  error:   'error',
  warning: 'warning',
  info:    'info',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Enter animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => dismissRef.current(toast.id), 240);
  };

  return (
    <div
      className={`toast toast--${toast.variant} ${visible ? 'toast--visible' : ''} ${leaving ? 'toast--leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <Icon name={ICONS[toast.variant]} className="toast__icon" size={20} />
      <span className="toast__message">{toast.message}</span>
      <button type="button" className="toast__close" onClick={handleDismiss} aria-label="Dismiss">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
