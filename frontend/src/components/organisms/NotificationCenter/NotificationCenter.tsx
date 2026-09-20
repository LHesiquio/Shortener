import { useEffect, useRef } from 'react';
import { NotificationBell } from '@/components/atoms/NotificationBell/NotificationBell';
import { useNotifications } from '@/context/NotificationContext';
import { useExportJobs } from '@/context/ExportJobsContext';
import { NotificationCenterPanel } from './NotificationCenterPanel';
import './NotificationCenter.css';

function useDismissOnOutsideClick(
  open: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLDivElement | null>
): void {
  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, ref]);
}

export function NotificationCenter() {
  const { isOpen, toggle, close } = useNotifications();
  const { unreadCount } = useExportJobs();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDismissOnOutsideClick(isOpen, close, wrapperRef);

  return (
    <div className="notification-center" ref={wrapperRef}>
      <NotificationBell unreadCount={unreadCount} isOpen={isOpen} onClick={toggle} />
      {isOpen && <NotificationCenterPanel />}
    </div>
  );
}
