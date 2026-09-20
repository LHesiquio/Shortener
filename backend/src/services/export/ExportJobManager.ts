import { Collection, ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { ExportJob } from '@appTypes/exportJob';
import { ClicksExportManager } from './ClicksExportManager';
import { ExportFileStore } from './ExportFileStore';

/**
 * In-process FIFO queue for click export jobs.
 *
 * Exports are CPU/IO heavy (up to 10k records, PDF/XLSX rendering), so jobs run
 * one at a time. No external broker is required: the queue lives in the Node
 * process and the durable state lives in MongoDB, which makes a restart safe —
 * any job left in `processing` is marked as failed on boot.
 */
export class ExportJobManager {
  private static readonly queue: string[] = [];
  private static draining = false;

  private static get collection(): Collection<ExportJob> {
    return collection<ExportJob>(Collections.ExportJobs);
  }

  public static enqueue(jobId: string): void {
    ExportJobManager.queue.push(jobId);
    void ExportJobManager.drain();
  }

  /** Marks jobs abandoned by a previous process as failed. */
  public static async recoverStale(): Promise<void> {
    await ExportJobManager.collection.updateMany(
      { status: 'processing' },
      { $set: { status: 'failed', error: 'Export interrupted by a server restart', completedAt: new Date() } }
    );
  }

  private static async drain(): Promise<void> {
    if (ExportJobManager.draining) return;
    ExportJobManager.draining = true;
    while (ExportJobManager.queue.length > 0) {
      const jobId = ExportJobManager.queue.shift();
      if (jobId) {
        try {
          await ExportJobManager.run(jobId);
        } catch (error) {
          console.error('[export-jobs] Job failed unexpectedly:', error);
        }
      }
    }
    ExportJobManager.draining = false;
  }

  private static async run(jobId: string): Promise<void> {
    const job = await ExportJobManager.collection.findOne({ _id: new ObjectId(jobId) });
    if (!job || job.status !== 'queued') return;

    await ExportJobManager.setStatus(jobId, { status: 'processing', startedAt: new Date(), error: null });

    try {
      const result = await ClicksExportManager.exportClicks({
        userId: job.userId.toHexString(),
        ...job.params,
      });
      const storedName = `${jobId}.${extractExtension(result.filename)}`;
      const sizeBytes = await ExportFileStore.save(storedName, result.buffer);
      await ExportJobManager.setStatus(jobId, {
        status: 'completed',
        storedName,
        filename: result.filename,
        contentType: result.contentType,
        sizeBytes,
        recordCount: result.recordCount ?? null,
        completedAt: new Date(),
      });
    } catch (error) {
      await ExportJobManager.setStatus(jobId, {
        status: 'failed',
        error: resolveErrorMessage(error),
        completedAt: new Date(),
      });
    }
  }

  private static async setStatus(jobId: string, fields: Partial<ExportJob>): Promise<void> {
    await ExportJobManager.collection.updateOne({ _id: new ObjectId(jobId) }, { $set: fields });
  }
}

function extractExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'bin';
}

function resolveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Export failed';
}
