import { Request, Response } from 'express';
import { Collection, ObjectId } from 'mongodb';
import { GeneralController } from '@controllers/GeneralController';
import { CreateShortlinkClickInput, ShortlinkClickModel } from '@models/ShortlinkClickModel';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { asyncHandler } from '@utils/asyncHandler';
import { QueryHelper } from '@utils/QueryHelper';
import { ClicksExportManager, ExportFormat } from '@services/ClicksExportManager';

export class ClicksLogController extends GeneralController<CreateShortlinkClickInput, ShortlinkClick> {
  protected readonly model = new ShortlinkClickModel();

  protected get collection(): Collection<ShortlinkClick> {
    return collection<ShortlinkClick>(Collections.ShortlinkClicks);
  }

  /**
   * GET /api/analytics/clicks
   * Returns paginated click logs for a user's shortlinks.
   */
  public getClicksLog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const params = QueryHelper.parse(req);
    const shortlinkIdParam = req.query.shortlinkId as string | undefined;
    const search = params.search;

    const userObjId = new ObjectId(userId);
    const shortlinksColl = collection<Shortlink>(Collections.Shortlinks);

    // 1. Fetch user's shortlink IDs
    let targetShortlinkIds: ObjectId[] = [];

    if (shortlinkIdParam && ObjectId.isValid(shortlinkIdParam)) {
      const singleLink = await shortlinksColl.findOne({
        _id: new ObjectId(shortlinkIdParam),
        userId: userObjId,
      });
      if (!singleLink) {
        res.status(404).json({ error: 'Shortlink not found' });
        return;
      }
      targetShortlinkIds = [singleLink._id!];
    } else {
      const userLinks = await shortlinksColl
        .find({ userId: userObjId }, { projection: { _id: 1 } })
        .toArray();
      targetShortlinkIds = userLinks.map((l) => l._id!);
    }

    if (targetShortlinkIds.length === 0) {
      res.json({
        ok: true,
        data: [],
        meta: QueryHelper.buildMeta(0, params),
      });
      return;
    }

    // 2. Build MongoDB match query
    const matchQuery: Record<string, any> = {
      shortlinkId: { $in: targetShortlinkIds },
    };

    if (params.sinceDate) {
      matchQuery.timestamp = { $gte: params.sinceDate };
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

    // 3. Fetch count and paginated items
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
    const meta = QueryHelper.buildMeta(totalCount, params);

    res.json({
      ok: true,
      data: formattedClicks,
      meta,
    });
  });

  /**
   * GET /api/analytics/clicks/export
   * Exports matching click records in CSV, PDF, JSON, or XLSX format.
   */
  public exportClicks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const format = (req.query.format as ExportFormat) || 'csv';
    const slug = req.query.slug as string | undefined;
    const shortlinkId = req.query.shortlinkId as string | undefined;
    const projectName = req.query.projectName as string | undefined;
    const timezone = req.query.timezone as string | undefined;
    const range = req.query.range as string | undefined;
    const fieldsParam = req.query.fields as string | string[] | undefined;
    const fields = Array.isArray(fieldsParam)
      ? fieldsParam
      : fieldsParam?.split(',').map((s) => s.trim()).filter(Boolean);

    const result = await ClicksExportManager.exportClicks({
      userId,
      slug,
      shortlinkId,
      projectName,
      timezone,
      range,
      format,
      fields,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.buffer);
  });

  /**
   * Backward-compatible alias for exportClicks
   */
  public exportClicksCSV = this.exportClicks;
}
