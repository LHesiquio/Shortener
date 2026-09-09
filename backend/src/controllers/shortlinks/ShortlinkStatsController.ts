import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export interface StatsBreakdownEntry { key: string; count: number; }

export interface ShortlinkStatsResponse {
  shortlinkId: string;
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  uniqueIpsLast7d: number;
  byCountry: StatsBreakdownEntry[];
  byDevice: StatsBreakdownEntry[];
  byBrowser: StatsBreakdownEntry[];
  byOs: StatsBreakdownEntry[];
  recent: Array<{
    timestamp: Date;
    country: string | null;
    city: string | null;
    deviceType: string;
    browser: string | null;
    os: string | null;
    referer: string | null;
  }>;
}

/**
 * Handles `GET /api/shortlinks/:id/stats`.
 *
 * Returns aggregate counts (totals + 24h + 7d), top breakdowns by
 * country/device/browser/OS, and the 20 most recent clicks.
 * Owner-only: 404 if the shortlink belongs to someone else (no leak).
 */
export class ShortlinkStatsController {
  public stats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const id = this.parseObjectId(req.params.id);
    await this.assertOwned(id, userId);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const clicks = collection<ShortlinkClick>(Collections.ShortlinkClicks);
    const filter = { shortlinkId: id };

    const [total, last24hCount, last7dCount, uniqueIpsLast7d, countryAgg, deviceAgg, browserAgg, osAgg, recent] = await Promise.all([
      clicks.countDocuments(filter),
      clicks.countDocuments({ ...filter, timestamp: { $gte: last24h } }),
      clicks.countDocuments({ ...filter, timestamp: { $gte: last7d } }),
      uniqueIpsLast7dCount(clicks, id, last7d),
      topField(clicks, id, 'geo.country'),
      topField(clicks, id, 'device.type'),
      topField(clicks, id, 'device.browser'),
      topField(clicks, id, 'device.os'),
      clicks.find(filter).sort({ timestamp: -1 }).limit(20).toArray(),
    ]);

    const payload: ShortlinkStatsResponse = {
      shortlinkId: id.toHexString(),
      totalClicks: total,
      clicksLast24h: last24hCount,
      clicksLast7d: last7dCount,
      uniqueIpsLast7d,
      byCountry: countryAgg,
      byDevice: deviceAgg,
      byBrowser: browserAgg,
      byOs: osAgg,
      recent: recent.map((c) => ({
        timestamp: c.timestamp,
        country: c.geo.country,
        city: c.geo.city,
        deviceType: c.device.type,
        browser: c.device.browser,
        os: c.device.os,
        referer: c.referer,
      })),
    };
    res.status(200).json({ ok: true, data: payload });
  });

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private requireUserId(req: Request): ObjectId {
    const id = req.user?.id;
    if (!id) throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    return new ObjectId(id);
  }

  private parseObjectId(raw: string | undefined): ObjectId {
    if (!raw || !ObjectId.isValid(raw)) {
      throw new ApiError(400, 'Invalid shortlink id', 'INVALID_ID');
    }
    return new ObjectId(raw);
  }

  private async assertOwned(id: ObjectId, userId: ObjectId): Promise<void> {
    const exists = await collection<Shortlink>(Collections.Shortlinks).findOne(
      { _id: id, userId },
      { projection: { _id: 1 } }
    );
    if (!exists) throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
  }
}

// ---------------------------------------------------------------------------
// Aggregation helpers (file-scope, kept below complexity threshold)
// ---------------------------------------------------------------------------

async function topField(
  coll: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkId: ObjectId,
  field: string
): Promise<StatsBreakdownEntry[]> {
  const cursor = coll.aggregate<{ _id: string | null; count: number }>([
    { $match: { shortlinkId } },
    { $group: { _id: { $ifNull: [`$${field}`, null] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const rows = await cursor.toArray();
  return rows.map((r) => ({ key: r._id ?? 'unknown', count: r.count }));
}

async function uniqueIpsLast7dCount(
  coll: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkId: ObjectId,
  since: Date
): Promise<number> {
  const result = await coll.aggregate<{ count: number }>([
    { $match: { shortlinkId, timestamp: { $gte: since }, ipHash: { $ne: null } } },
    { $group: { _id: '$ipHash' } },
    { $count: 'count' },
  ]).toArray();
  return result[0]?.count ?? 0;
}
