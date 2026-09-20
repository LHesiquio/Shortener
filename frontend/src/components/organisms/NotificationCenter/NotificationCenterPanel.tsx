import { useState } from 'react';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useNotifications } from '@/context/NotificationContext';
import { useExportJobs } from '@/context/ExportJobsContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { ExportJobItem } from './ExportJobItem';
import { NotificationEventItem } from './NotificationEventItem';
import './NotificationCenter.css';

type Tab = 'exports' | 'activity';

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="notification-center__empty">
      <Icon name={icon} size={28} />
      <p className="notification-center__empty-title">{title}</p>
      <p className="notification-center__empty-text">{text}</p>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`notification-center__tab ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}

type ListState = 'loading' | 'error' | 'empty' | 'ready';

function pickInitialState(isLoading: boolean, isError: boolean, count: number): ListState {
  if (count > 0) return 'ready';
  if (isError) return 'error';
  if (isLoading) return 'loading';
  return 'empty';
}

function ExportsList() {
  const { jobs, isLoading, isError, refresh, downloadJob, retryJob } = useExportJobs();
  const { userTimezone } = useUserProfile();
  const state = pickInitialState(isLoading, isError, jobs.length);

  if (state === 'loading') {
    return <p className="notification-center__state">Loading exports…</p>;
  }

  if (state === 'error') {
    return (
      <div className="notification-center__state">
        <p>Could not load your exports.</p>
        <button type="button" className="notification-center__link" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <EmptyState
        icon="file_text"
        title="No exports yet"
        text="Exported click logs will appear here, ready to download."
      />
    );
  }

  return (
    <>
      {jobs.map((job) => (
        <ExportJobItem
          key={job.id}
          job={job}
          timezone={userTimezone}
          onDownload={(target) => void downloadJob(target)}
          onRetry={(id) => void retryJob(id)}
        />
      ))}
    </>
  );
}

function ActivityList() {
  const { notifications, dismiss, clear } = useNotifications();
  const { userTimezone } = useUserProfile();

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="notifications"
        title="No activity"
        text="Export events will show up here as they happen."
      />
    );
  }

  return (
    <>
      <div className="notification-center__list-head">
        <button type="button" className="notification-center__link" onClick={clear}>
          Clear all
        </button>
      </div>
      {notifications.map((notification) => (
        <NotificationEventItem
          key={notification.id}
          notification={notification}
          timezone={userTimezone}
          onDismiss={dismiss}
        />
      ))}
    </>
  );
}

export function NotificationCenterPanel() {
  const [tab, setTab] = useState<Tab>('exports');
  const { unreadCount, hasActiveJobs, markAllRead } = useExportJobs();

  return (
    <div className="notification-center__panel" role="menu" aria-label="Notification center">
      <header className="notification-center__header">
        <div className="notification-center__heading">
          <h3>Notifications</h3>
          <p>{buildStatusLine(unreadCount, hasActiveJobs)}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notification-center__link"
            onClick={() => void markAllRead()}
          >
            Mark all read
          </button>
        )}
      </header>

      <div className="notification-center__tabs" role="tablist">
        <TabButton
          active={tab === 'exports'}
          icon="file_text"
          label="Exports"
          onClick={() => setTab('exports')}
        />
        <TabButton
          active={tab === 'activity'}
          icon="history"
          label="Activity"
          onClick={() => setTab('activity')}
        />
      </div>

      <div className="notification-center__body">
        {tab === 'exports' ? <ExportsList /> : <ActivityList />}
      </div>
    </div>
  );
}

function buildStatusLine(unreadCount: number, hasActiveJobs: boolean): string {
  if (hasActiveJobs) return 'An export is running…';
  if (unreadCount > 0) return `${unreadCount} ready to review`;
  return 'You are all caught up';
}
