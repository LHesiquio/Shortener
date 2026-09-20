import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  AppNotification,
  NewNotification,
  NotificationContextValue,
} from '@/context/NotificationContext.types';

const MAX_NOTIFICATIONS = 30;

const NotificationContext = createContext<NotificationContextValue | null>(null);

function createNotificationId(): string {
  return `n-${Date.now()}-${Math.random()}`;
}

function prependNotification(list: AppNotification[], item: AppNotification): AppNotification[] {
  return [item, ...list].slice(0, MAX_NOTIFICATIONS);
}

function removeNotification(list: AppNotification[], id: string): AppNotification[] {
  return list.filter((item) => item.id !== id);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const push = useCallback((notification: NewNotification) => {
    const item: AppNotification = {
      ...notification,
      id: createNotificationId(),
      createdAt: Date.now(),
    };
    setNotifications((prev) => prependNotification(prev, item));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => removeNotification(prev, id));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  const value = useMemo(
    () => ({ notifications, isOpen, push, dismiss, clear, open, close, toggle }),
    [notifications, isOpen, push, dismiss, clear, open, close, toggle]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
