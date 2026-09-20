import { ExportJobManager } from './ExportJobManager';
import { ExportJobService } from '@services/ExportJobService';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let timer: ReturnType<typeof setInterval> | null = null;

function logError(context: string, error: unknown): void {
  console.error(`[export-jobs] ${context} failed:`, error);
}

/**
 * Runs housekeeping for export jobs: recovers jobs abandoned by a previous
 * process and periodically deletes files whose retention window elapsed.
 */
export function startExportJobMaintenance(): void {
  void ExportJobManager.recoverStale().catch((error) => logError('recoverStale', error));
  void ExportJobService.cleanupExpired().catch((error) => logError('cleanupExpired', error));

  timer = setInterval(() => {
    void ExportJobService.cleanupExpired().catch((error) => logError('cleanupExpired', error));
  }, CLEANUP_INTERVAL_MS);
  timer.unref?.();
}

export function stopExportJobMaintenance(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
