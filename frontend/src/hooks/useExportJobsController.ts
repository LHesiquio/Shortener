import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useExportJobWatcher } from '@/hooks/useExportJobWatcher';
import { exportJobService } from '@/services/exportJobService';
import { browserNotificationService } from '@/services/browserNotification.service';
import type { CreateExportJobPayload, PublicExportJob } from '@/types/exportJob.types';
import type { ExportJobsContextValue } from '@/context/ExportJobsContext.types';
import {
  EXPORT_JOBS_QUERY_KEY,
  countUnreadJobs,
  hasActiveJobs,
  type JobTransition,
} from '@/context/ExportJobsContext.utils';

type NotifyPush = ReturnType<typeof useNotifications>['push'];
type ToastPush = ReturnType<typeof useToast>['push'];
type RefreshFn = () => Promise<void>;

function ensureNotificationPermission(): void {
  if (browserNotificationService.getPermission() === 'default') {
    void browserNotificationService.requestPermission();
  }
}

function useExportJobsQuery() {
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const isAuthenticated = Boolean(user);

  const query = useQuery({
    queryKey: EXPORT_JOBS_QUERY_KEY,
    queryFn: ({ signal }) => exportJobService.list({ page: 1, limit: 30, signal }),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => (hasActiveJobs(q.state.data?.jobs ?? []) ? 4000 : 20000),
  });

  const jobs = useMemo(() => query.data?.jobs ?? [], [query.data]);
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: EXPORT_JOBS_QUERY_KEY });
  }, [queryClient]);

  return { jobs, isLoading: query.isLoading, isError: query.isError, refresh };
}

function useExportJobTransitions(
  jobs: PublicExportJob[],
  pushNotification: NotifyPush,
  pushToast: ToastPush
): void {
  const notifyTransition = useCallback(
    (transition: JobTransition) => {
      const { job, type } = transition;
      if (type === 'completed') {
        const body = `${job.targetLabel} is ready to download.`;
        pushNotification({ kind: 'export-completed', title: 'Export ready', body, jobId: job.id });
        browserNotificationService.notify({ title: 'Export ready', body, tag: job.id });
        pushToast(body, 'success');
        return;
      }

      const message = job.error || `Failed to export ${job.targetLabel}.`;
      pushNotification({ kind: 'export-failed', title: 'Export failed', body: message, jobId: job.id });
      browserNotificationService.notify({ title: 'Export failed', body: message, tag: job.id });
      pushToast(message, 'error');
    },
    [pushNotification, pushToast]
  );

  useExportJobWatcher(jobs, notifyTransition);
}

function useCreateExportJob(
  refresh: RefreshFn,
  pushToast: ToastPush,
  pushNotification: NotifyPush
) {
  const { mutateAsync: createExport } = useMutation({
    mutationFn: (payload: CreateExportJobPayload) => exportJobService.create(payload),
    onSuccess: (job: PublicExportJob) => {
      pushNotification({
        kind: 'export-started',
        title: 'Export started',
        body: `Preparing ${job.targetLabel}. We'll let you know when it's ready.`,
        jobId: job.id,
      });
      ensureNotificationPermission();
    },
  });

  const createJob = useCallback(
    async (payload: CreateExportJobPayload) => {
      try {
        await createExport(payload);
      } catch (error) {
        pushToast('Failed to start export. Please try again.', 'error');
        throw error;
      } finally {
        await refresh();
      }
    },
    [createExport, pushToast, refresh]
  );

  return { createJob };
}

function useExportJobMaintenance(
  refresh: RefreshFn,
  pushToast: ToastPush,
  pushNotification: NotifyPush
) {
  const { mutateAsync: retryExport } = useMutation({
    mutationFn: (jobId: string) => exportJobService.retry(jobId),
    onSuccess: (job: PublicExportJob) => {
      pushNotification({
        kind: 'export-started',
        title: 'Export re-queued',
        body: `Preparing ${job.targetLabel} again.`,
        jobId: job.id,
      });
    },
  });

  const retryJob = useCallback(
    async (jobId: string) => {
      try {
        await retryExport(jobId);
        pushToast('Export re-queued.', 'info');
      } catch {
        pushToast('Failed to retry export. Please try again.', 'error');
      } finally {
        await refresh();
      }
    },
    [retryExport, pushToast, refresh]
  );

  return { retryJob };
}

function useExportJobReadState(refresh: RefreshFn, pushToast: ToastPush) {
  const { mutateAsync: markReadRequest } = useMutation({
    mutationFn: () => exportJobService.markAllRead(),
  });

  const markAllRead = useCallback(async () => {
    try {
      await markReadRequest();
    } catch {
      pushToast('Failed to update notifications.', 'error');
    } finally {
      await refresh();
    }
  }, [markReadRequest, pushToast, refresh]);

  return { markAllRead };
}

function useExportJobDownload(pushToast: ToastPush) {
  const downloadJob = useCallback(
    async (job: PublicExportJob) => {
      try {
        await exportJobService.download(job);
      } catch {
        pushToast('Failed to download export. Please try again.', 'error');
      }
    },
    [pushToast]
  );

  return { downloadJob };
}

export function useExportJobsController(): ExportJobsContextValue {
  const { push: pushNotification } = useNotifications();
  const { push: pushToast } = useToast();
  const { jobs, isLoading, isError, refresh } = useExportJobsQuery();

  useExportJobTransitions(jobs, pushNotification, pushToast);

  const { createJob } = useCreateExportJob(refresh, pushToast, pushNotification);
  const { retryJob } = useExportJobMaintenance(refresh, pushToast, pushNotification);
  const { markAllRead } = useExportJobReadState(refresh, pushToast);
  const { downloadJob } = useExportJobDownload(pushToast);

  return useMemo(
    () => ({
      jobs,
      isLoading,
      isError,
      unreadCount: countUnreadJobs(jobs),
      hasActiveJobs: hasActiveJobs(jobs),
      refresh,
      createJob,
      retryJob,
      downloadJob,
      markAllRead,
    }),
    [jobs, isLoading, isError, refresh, createJob, retryJob, downloadJob, markAllRead]
  );
}
