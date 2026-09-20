import { useEffect, useRef } from 'react';
import type { ExportJobStatus, PublicExportJob } from '@/types/exportJob.types';
import {
  detectTransitions,
  snapshotStatuses,
  type JobTransition,
} from '@/context/ExportJobsContext.utils';

/**
 * Emits a transition (completed / failed) only when a job's status actually
 * changes while the app is open. The first snapshot is recorded silently so
 * historical jobs never re-trigger notifications on reload.
 */
export function useExportJobWatcher(
  jobs: PublicExportJob[],
  onTransition: (transition: JobTransition) => void
): void {
  const previous = useRef<Map<string, ExportJobStatus>>(new Map());

  useEffect(() => {
    for (const transition of detectTransitions(jobs, previous.current)) {
      onTransition(transition);
    }
    previous.current = snapshotStatuses(jobs);
  }, [jobs, onTransition]);
}
