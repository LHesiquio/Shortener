export type NotificationKind =
  | 'export-started'
  | 'export-completed'
  | 'export-failed'
  | 'info';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  jobId?: string;
  createdAt: number;
}

export type NewNotification = Omit<AppNotification, 'id' | 'createdAt'>;

export interface NotificationContextValue {
  notifications: AppNotification[];
  isOpen: boolean;
  push: (notification: NewNotification) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
