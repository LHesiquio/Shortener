import { Request, Response } from 'express';
import { Collection, Filter, ObjectId } from 'mongodb';
import { ShortlinkClickModel } from '@models/ShortlinkClickModel';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { asyncHandler } from '@utils/asyncHandler';
import { QueryHelper } from '@utils/QueryHelper';
import { ClicksExportManager, ExportFormat } from '@services/ClicksExportManager';
import { ApiError } from '@utils/ApiError';

export class ClicksLogController {
  private readonly model = new ShortlinkClickModel();

  private get collection(): Collection<ShortlinkClick> {
    return collection<ShortlinkClick>(Collections.ShortlinkClicks);
  }

  /**
   * GET /api/analytics/clicks
   * Returns paginated click logs for a user's shortlinks.
   */
  public getClicksLog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const params = QueryHelper.parse(req);
    const shortlinkIdParam = req.query.shortlinkId as string | undefined;
    const targetShortlinkIds = await resolveTargetShortlinkIds(new ObjectId(userId), shortlinkIdParam);

    if (targetShortlinkIds.length === 0) {
      res.json({ ok: true, data: [], meta: QueryHelper.buildMeta(0, params) });
      return;
    }

    const matchQuery = buildClickMatchQuery(targetShortlinkIds, params.sinceDate, params.search);
    const [totalCount, clickDocs] = await Promise.all([
      this.collection.countDocuments(matchQuery),
      this.collection
        .find(matchQuery)
        .sort({ timestamp: -1 })
        .skip(params.skip)
        .limit(params.pageSize)
        .toArray(),
    ]);

    const formattedClicks = clickDocs.map((c) => this.model.toResponse(c));
    res.json({
      ok: true,
      data: formattedClicks,
      meta: QueryHelper.buildMeta(totalCount, params),
    });
  });

  /**
   * GET /api/analytics/clicks/export
   * Exports matching click records in CSV, PDF, JSON, or XLSX format.
   */
  public exportClicks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const exportOptions = parseExportOptions(req, userId);
    const result = await ClicksExportManager.exportClicks(exportOptions);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.buffer);
  });

  /**
   * Backward-compatible alias for exportClicks
   */
  public exportClicksCSV = this.exportClicks;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveTargetShortlinkIds(
  userId: ObjectId,
  shortlinkIdParam?: string
): Promise<ObjectId[]> {
  const shortlinksColl = collection<Shortlink>(Collections.Shortlinks);

  if (shortlinkIdParam && ObjectId.isValid(shortlinkIdParam)) {
    const singleLink = await shortlinksColl.findOne({
      _id: new ObjectId(shortlinkIdParam),
      userId,
    });
    if (!singleLink) {
      throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
    }
    return [singleLink._id!];
  }

  const userLinks = await shortlinksColl
    .find({ userId }, { projection: { _id: 1 } })
    .toArray();
  return userLinks.map((l) => l._id!);
}

function buildClickMatchQuery(
  targetShortlinkIds: ObjectId[],
  sinceDate?: Date | null,
  search?: string
): Filter<ShortlinkClick> {
  const matchQuery: Filter<ShortlinkClick> = {
    shortlinkId: { $in: targetShortlinkIds },
  };

  if (sinceDate) {
    matchQuery.timestamp = { $gte: sinceDate };
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    matchQuery.$or = [
      { slug: regex },
      { referer: regex },
      { 'geo.country': regex },
      { 'geo.city': regex },
      { 'geo.region': regex },
      { 'device.browser': regex },
      { 'device.os': regex },
      { 'device.type': regex },
    ];
  }

  return matchQuery;
}

function parseExportOptions(
  req: Request,
  userId: string
): Parameters<typeof ClicksExportManager.exportClicks>[0] {
  const fieldsParam = req.query.fields as string | string[] | undefined;
  const fields = Array.isArray(fieldsParam)
    ? fieldsParam
    : fieldsParam?.split(',').map((s) => s.trim()).filter(Boolean);

  return {
    userId,
    slug: req.query.slug as string | undefined,
    shortlinkId: req.query.shortlinkId as string | undefined,
    projectName: req.query.projectName as string | undefined,
    timezone: req.query.timezone as string | undefined,
    range: req.query.range as string | undefined,
    format: (req.query.format as ExportFormat) || 'csv',
    fields,
  };
}
