import { Request } from 'express';
import { WithId } from 'mongodb';
import { z } from 'zod';
import { IBaseModel } from '@models/BaseModel';
import { ExportJob } from '@appTypes/exportJob';
import { ExportFormat } from '@services/export/export.types';
import { sanitizeFields, sanitizeFormat } from '@services/export/export.utils';
import { ApiError } from '@utils/ApiError';

const createExportJobSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  shortlinkId: z.string().trim().min(1).optional(),
  projectName: z.string().trim().min(1).optional(),
  range: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']).default('csv'),
  fields: z.array(z.string()).optional(),
});

export type CreateExportJobInput = z.infer<typeof createExportJobSchema>;

export interface PublicExportJob {
  id: string;
  status: ExportJob['status'];
  targetLabel: string;
  format: ExportFormat;
  range: string | null;
  timezone: string;
  projectName: string | null;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  recordCount: number | null;
  error: string | null;
  isRead: boolean;
  downloadCount: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
  isExpired: boolean;
  downloadUrl: string;
  params: ExportJob['params'];
}

export class ExportJobModel implements IBaseModel<CreateExportJobInput, ExportJob> {
  public extractFromRequest(req: Request): CreateExportJobInput {
    const body = req.body ?? {};
    const query = req.query ?? {};

    return {
      slug: firstString(body.slug, query.slug),
      shortlinkId: firstString(body.shortlinkId, query.shortlinkId),
      projectName: firstString(body.projectName, query.projectName),
      range: firstString(body.range, query.range),
      timezone: firstString(body.timezone, query.timezone),
      format: sanitizeFormat(firstString(body.format, query.format)),
      fields: extractFields(body.fields ?? query.fields),
    };
  }

  public validate(input: CreateExportJobInput): void {
    const result = createExportJobSchema.safeParse(input);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid export job payload';
      throw new ApiError(400, message, 'VALIDATION_ERROR');
    }
  }

  public build(input: CreateExportJobInput): ExportJob {
    const format = sanitizeFormat(input.format);
    const fields = sanitizeFields(input.fields);

    return {
      userId: undefined as never,
      status: 'queued',
      params: {
        slug: input.slug,
        shortlinkId: input.shortlinkId,
        projectName: input.projectName,
        range: input.range,
        timezone: input.timezone,
        format,
        fields,
      },
      targetLabel: buildTargetLabel(input),
      filename: null,
      contentType: null,
      storedName: null,
      sizeBytes: null,
      recordCount: null,
      error: null,
      readAt: null,
      downloadCount: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      expiresAt: new Date(),
    };
  }

  public toResponse(doc: WithId<ExportJob>): PublicExportJob {
    const id = doc._id.toHexString();
    const expiresAt = toDate(doc.expiresAt);

    return {
      id,
      status: doc.status,
      targetLabel: doc.targetLabel,
      format: doc.params.format,
      range: doc.params.range ?? null,
      timezone: doc.params.timezone ?? 'UTC',
      projectName: doc.params.projectName ?? null,
      filename: doc.filename,
      contentType: doc.contentType,
      sizeBytes: doc.sizeBytes,
      recordCount: doc.recordCount,
      error: doc.error,
      isRead: Boolean(doc.readAt),
      downloadCount: doc.downloadCount,
      createdAt: toDate(doc.createdAt).toISOString(),
      completedAt: formatOptionalDate(doc.completedAt),
      expiresAt: expiresAt.toISOString(),
      isExpired: computeExpired(doc.status, expiresAt),
      downloadUrl: `/api/analytics/clicks/export/jobs/${id}/download`,
      params: doc.params,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers (Cyclomatic Complexity <= 5 each)
// ---------------------------------------------------------------------------

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatOptionalDate(value: Date | string | null): string | null {
  return value ? toDate(value).toISOString() : null;
}

function computeExpired(status: ExportJob['status'], expiresAt: Date): boolean {
  return status === 'completed' && expiresAt.getTime() <= Date.now();
}

function firstString(primary: unknown, fallback: unknown): string | undefined {
  if (typeof primary === 'string' && primary.trim()) return primary.trim();
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();
  return undefined;
}

function extractFields(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === 'string');
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((f) => f.trim()).filter(Boolean);
  }
  return undefined;
}

function buildTargetLabel(input: CreateExportJobInput): string {
  if (input.slug) return `/${input.slug}`;
  if (input.projectName) return input.projectName;
  return 'All links';
}
