import { Collection, Filter, ObjectId, WithId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { env } from '@config/env';
import { ExportJob } from '@appTypes/exportJob';
import { ExportJobModel, CreateExportJobInput, PublicExportJob } from '@models/ExportJobModel';
import type { PaginationParams } from '@utils/QueryHelper';
import { ApiError } from '@utils/ApiError';
import { ExportJobManager } from './export/ExportJobManager';
import { ExportFileStore } from './export/ExportFileStore';

const RETENTION_DAYS = env.EXPORT_JOB_RETENTION_DAYS;

export interface DownloadTarget {
  absolutePath: string;
  filename: string;
  contentType: string;
}

export class ExportJobService {
  private static readonly model = new ExportJobModel();

  private static get collection(): Collection<ExportJob> {
    return collection<ExportJob>(Collections.ExportJobs);
  }

  public static async create(userId: string, input: CreateExportJobInput): Promise<PublicExportJob> {
    this.model.validate(input);

    const doc = await this.model.build(input);
    doc.userId = new ObjectId(userId);
    doc.expiresAt = addDays(new Date(), RETENTION_DAYS);

    const inserted = await this.collection.insertOne(doc);
    doc._id = inserted.insertedId;

    ExportJobManager.enqueue(inserted.insertedId.toHexString());
    return this.model.toResponse(doc as WithId<ExportJob>);
  }

  public static async list(
    userId: string,
    params: PaginationParams
  ): Promise<{ jobs: PublicExportJob[]; total: number }> {
    const filter = buildUserFilter(userId, params.exportStatus);
    const [total, docs] = await Promise.all([
      this.collection.countDocuments(filter),
      this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.pageSize)
        .toArray(),
    ]);

    return { jobs: docs.map((doc) => this.model.toResponse(doc)), total };
  }

  public static async getForUser(userId: string, jobId: string): Promise<PublicExportJob> {
    const job = await this.requireJob(userId, jobId);
    return this.model.toResponse(job);
  }

  public static async markAllRead(userId: string): Promise<void> {    await this.collection.updateMany(
      { userId: new ObjectId(userId), readAt: null },
      { $set: { readAt: new Date() } }
    );
  }

  public static async retry(userId: string, jobId: string): Promise<PublicExportJob> {
    const job = await this.requireJob(userId, jobId);
    const doc = this.model.build({
      ...job.params,
      projectName: job.params.projectName,
    });
    doc.userId = new ObjectId(userId);
    doc.targetLabel = job.targetLabel;
    doc.expiresAt = addDays(new Date(), RETENTION_DAYS);

    const inserted = await this.collection.insertOne(doc);
    doc._id = inserted.insertedId;

    ExportJobManager.enqueue(inserted.insertedId.toHexString());
    return this.model.toResponse(doc as WithId<ExportJob>);
  }

  public static async prepareDownload(userId: string, jobId: string): Promise<DownloadTarget> {
    const job = await this.requireJob(userId, jobId);
    ensureDownloadable(job);
    await this.collection.updateOne({ _id: job._id }, { $inc: { downloadCount: 1 } });

    return {
      absolutePath: ExportFileStore.resolve(job.storedName as string),
      filename: job.filename as string,
      contentType: job.contentType ?? 'application/octet-stream',
    };
  }

  public static async cleanupExpired(): Promise<number> {
    const expired = await this.collection
      .find({ expiresAt: { $lte: new Date() }, storedName: { $ne: null } })
      .toArray();

    await Promise.all(expired.map((job) => ExportFileStore.remove(job.storedName as string)));
    const result = await this.collection.deleteMany({ expiresAt: { $lte: new Date() } });
    return result.deletedCount ?? 0;
  }

  private static async requireJob(userId: string, jobId: string): Promise<WithId<ExportJob>> {
    if (!ObjectId.isValid(jobId)) {
      throw new ApiError(404, 'Export job not found', 'NOT_FOUND');
    }
    const job = await this.collection.findOne({ _id: new ObjectId(jobId), userId: new ObjectId(userId) });
    if (!job) {
      throw new ApiError(404, 'Export job not found', 'NOT_FOUND');
    }
    return job;
  }
}

function buildUserFilter(userId: string, status?: string): Filter<ExportJob> {
  const filter: Filter<ExportJob> = { userId: new ObjectId(userId) };
  if (status && isExportStatus(status)) {
    filter.status = status;
  }
  return filter;
}

function isExportStatus(value: string): value is ExportJob['status'] {
  return ['queued', 'processing', 'completed', 'failed'].includes(value);
}

function ensureDownloadable(job: WithId<ExportJob>): void {
  if (job.status !== 'completed' || !job.storedName) {
    throw new ApiError(409, 'Export is not ready yet', 'EXPORT_NOT_READY');
  }
  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(410, 'Export has expired', 'EXPORT_EXPIRED');
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Re-export for consumers that only need the model input type.
export type { CreateExportJobInput, PublicExportJob };
