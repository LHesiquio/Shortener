import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError } from '@utils/ApiError';
import { QueryHelper } from '@utils/QueryHelper';
import { ExportJobModel } from '@models/ExportJobModel';
import { ExportJobService } from '@services/ExportJobService';

export class ExportJobController {
  private readonly model = new ExportJobModel();

  /**
   * POST /api/analytics/clicks/export/jobs
   * Creates an async export job and starts processing it in the background.
   */
  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const input = this.model.extractFromRequest(req);
    const job = await ExportJobService.create(userId, input);
    res.status(201).json({ ok: true, data: job });
  });

  /**
   * GET /api/analytics/clicks/export/jobs
   * Lists the authenticated user's export jobs (newest first).
   */
  public list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const params = QueryHelper.parseForFeature(req, 'exportJobs');
    const { jobs, total } = await ExportJobService.list(userId, params);
    res.json({ ok: true, data: jobs, meta: QueryHelper.buildMeta(total, params) });
  });

  /**
   * GET /api/analytics/clicks/export/jobs/:id
   * Returns a single export job owned by the authenticated user.
   */
  public getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const job = await ExportJobService.getForUser(userId, req.params.id);
    res.json({ ok: true, data: job });
  });

  /**
   * POST /api/analytics/clicks/export/jobs/read-all
   * Marks every pending notification as read (cross-device).
   */
  public markAllRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    await ExportJobService.markAllRead(userId);
    res.json({ ok: true, data: { read: true } });
  });

  /**
   * POST /api/analytics/clicks/export/jobs/:id/retry
   * Replays an existing job with the same parameters.
   */
  public retry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const job = await ExportJobService.retry(userId, req.params.id);
    res.status(201).json({ ok: true, data: job });
  });

  /**
   * GET /api/analytics/clicks/export/jobs/:id/download
   * Streams the generated file once the job is completed.
   */
  public download = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const target = await ExportJobService.prepareDownload(userId, req.params.id);

    res.setHeader('Content-Type', target.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${target.filename}"`);
    res.sendFile(target.absolutePath);
  });
}

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  return userId;
}
