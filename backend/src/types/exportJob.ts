import { Document, ObjectId } from 'mongodb';
import { ExportFormat } from '@services/export/export.types';

export type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

/**
 * Normalized export parameters stored on the job so a failed or expired
 * export can be replayed without asking the client for the wizard values again.
 */
export interface ExportJobParams {
  slug?: string;
  shortlinkId?: string;
  projectName?: string;
  range?: string;
  timezone?: string;
  format: ExportFormat;
  fields: string[];
}

/** A click-log export job as stored in MongoDB. */
export interface ExportJob extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  status: ExportJobStatus;
  params: ExportJobParams;
  /** Human-readable target (e.g. "/abc123" or "All links"). */
  targetLabel: string;
  filename: string | null;
  contentType: string | null;
  /** Stored file name inside the export storage directory. */
  storedName: string | null;
  sizeBytes: number | null;
  recordCount: number | null;
  error: string | null;
  readAt: Date | null;
  downloadCount: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date;
}
