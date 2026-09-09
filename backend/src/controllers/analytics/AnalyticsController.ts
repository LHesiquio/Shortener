import { Request, Response } from 'express';
import { ObjectId, WithId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { User } from '@appTypes/user';
import { Project } from '@appTypes/project';
import { asyncHandler } from '@utils/asyncHandler';
import { ShortlinkModel } from '@models/ShortlinkModel';
import { resolveIanaTimezone } from '@utils/timezone.utils';

export interface TimelineEntry {
  date: string;
  count: number;
}

export interface AnalyticsBreakdownEntry {
  key: string;
  count: number;
}

export interface ProjectBreakdownEntry {
  projectId: string;
  projectName: string;
  count: number;
}

export interface AnalyticsSummaryResponse {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  clicksLast30d: number;
  totalShortlinks: number;
  activeShortlinks: number;
  topLink: ReturnType<ShortlinkModel['toResponse']> | null;
  clicksTimeline: TimelineEntry[];
  byDevice: AnalyticsBreakdownEntry[];
  byBrowser: AnalyticsBreakdownEntry[];
  byOs: AnalyticsBreakdownEntry[];
  byCountry: AnalyticsBreakdownEntry[];
  byProject: ProjectBreakdownEntry[];
}

export class AnalyticsController {
  private readonly shortlinkModel = new ShortlinkModel();

  public getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userIdStr = (req as unknown as { user: { id: string } }).user.id;
    const userId = new ObjectId(userIdStr);

    // 1. Fetch user shortlinks
    const userLinks = await collection<Shortlink>(Collections.Shortlinks)
      .find({ userId })
      .toArray();

    const shortlinkIds = userLinks.map((l) => l._id).filter((id): id is ObjectId => Boolean(id));
    const totalShortlinks = userLinks.length;
    const activeShortlinks = userLinks.filter((l) => l.active).length;

    if (shortlinkIds.length === 0) {
      res.json({
        ok: true,
        data: this.buildEmptySummary(totalShortlinks, activeShortlinks, null),
      });
      return;
    }

    const rangeParam = (req.query.range as string) || '30d';
    const now = new Date();

    const userDoc = await collection<User>(Collections.Users).findOne({ _id: userId }, { projection: { timezone: 1 } });

    // Priority: stored DB timezone > client-detected timezone (?tz param) > 'UTC'
    // The ?tz param is sent by the frontend from Intl.DateTimeFormat().resolvedOptions().timeZone
    // and acts as a safe fallback when the user's profile has no timezone defined yet.
    const storedTz = userDoc?.timezone?.trim();
    const clientTz = (req.query.tz as string | undefined)?.trim();
    const rawTimezone = (storedTz && storedTz !== 'auto') ? storedTz : (clientTz || 'UTC');
    const userTimezone = resolveIanaTimezone(rawTimezone);

    // Compute sinceDate as the start of the relevant local calendar day in the user's timezone.
    // Using exact millisecond offsets (e.g. now - 7 * 24h) is wrong for non-UTC timezones:
    // it produces a mid-day cutoff that skips the first partial local day.
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = startOfLocalDayNDaysAgo(now, 7, userTimezone);
    const last30d = startOfLocalDayNDaysAgo(now, 30, userTimezone);

    let sinceDate = last30d;
    if (rangeParam === '24h') {
      sinceDate = last24h;
    } else if (rangeParam === '7d') {
      sinceDate = last7d;
    }

    const clicksColl = collection<ShortlinkClick>(Collections.ShortlinkClicks);

    const [topLinkDoc, totalClicks, clicks24h, clicks7d, clicks30d, timeline, deviceAgg, browserAgg, osAgg, countryAgg, projectBreakdown] = await Promise.all([
      findMostClickedShortlink(userLinks, shortlinkIds, clicksColl, sinceDate),
      clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: sinceDate } }),
      clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: last24h } }),
      clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: last7d } }),
      clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: last30d } }),
      buildClicksTimeline(clicksColl, shortlinkIds, sinceDate, rangeParam, userTimezone),
      aggregateClickField(clicksColl, shortlinkIds, 'device.type', sinceDate),
      aggregateClickField(clicksColl, shortlinkIds, 'device.browser', sinceDate),
      aggregateClickField(clicksColl, shortlinkIds, 'device.os', sinceDate),
      aggregateClickField(clicksColl, shortlinkIds, 'geo.country', sinceDate),
      buildProjectBreakdown(userLinks, clicksColl, sinceDate),
    ]);

    const topLink = topLinkDoc ? this.shortlinkModel.toResponse(topLinkDoc) : null;

    const data: AnalyticsSummaryResponse = {
      totalClicks,
      clicksLast24h: clicks24h,
      clicksLast7d: clicks7d,
      clicksLast30d: clicks30d,
      totalShortlinks,
      activeShortlinks,
      topLink,
      clicksTimeline: timeline,
      byDevice: deviceAgg,
      byBrowser: browserAgg,
      byOs: osAgg,
      byCountry: countryAgg,
      byProject: projectBreakdown,
    };

    res.json({ ok: true, data });
  });

  private buildEmptySummary(
    totalShortlinks: number,
    activeShortlinks: number,
    topLink: ReturnType<ShortlinkModel['toResponse']> | null
  ): AnalyticsSummaryResponse {
    return {
      totalClicks: 0,
      clicksLast24h: 0,
      clicksLast7d: 0,
      clicksLast30d: 0,
      totalShortlinks,
      activeShortlinks,
      topLink,
      clicksTimeline: [],
      byDevice: [],
      byBrowser: [],
      byOs: [],
      byCountry: [],
      byProject: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Helper Functions (File-scoped, complexity <= 5)
// ---------------------------------------------------------------------------

async function findMostClickedShortlink(
  userLinks: WithId<Shortlink>[],
  shortlinkIds: ObjectId[],
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  sinceDate?: Date
): Promise<WithId<Shortlink> | null> {
  const matchFilter: Record<string, unknown> = { shortlinkId: { $in: shortlinkIds } };
  if (sinceDate) {
    matchFilter.timestamp = { $gte: sinceDate };
  }

  const topClickAgg = await clicksColl
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: matchFilter },
      { $group: { _id: '$shortlinkId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])
    .toArray();

  if (topClickAgg.length > 0) {
    const topId = topClickAgg[0]._id.toHexString();
    const match = userLinks.find((l) => l._id.toHexString() === topId);
    if (match) {
      match.clicksCount = topClickAgg[0].count;
      return match;
    }
  }

  const sorted = [...userLinks].sort((a, b) => (b.clicksCount ?? 0) - (a.clicksCount ?? 0));
  return sorted[0] ?? null;
}

async function aggregateClickField(
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkIds: ObjectId[],
  fieldPath: string,
  sinceDate?: Date
): Promise<AnalyticsBreakdownEntry[]> {
  const matchFilter: Record<string, unknown> = { shortlinkId: { $in: shortlinkIds } };
  if (sinceDate) {
    matchFilter.timestamp = { $gte: sinceDate };
  }

  const rows = await clicksColl
    .aggregate<{ _id: string | null; count: number }>([
      { $match: matchFilter },
      { $group: { _id: { $ifNull: [`$${fieldPath}`, 'Unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])
    .toArray();

  return rows.map((r) => ({ key: r._id ?? 'Unknown', count: r.count }));
}

function formatDateInTimezone(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
}

/**
 * Returns a UTC Date that is a safe lower-bound for a Mongo $match filter
 * covering the last `n` complete local calendar days.
 *
 * We use `now - (n + 1) * 24h` as a conservative lower bound.
 * The timeline display already generates exactly the last `n` calendar days
 * from `todayStr` backwards, so any clicks from day n+1 are simply not
 * included in the result array — this is correct and harmless.
 *
 * This approach is deliberately simple and timezone-safe.
 */
function startOfLocalDayNDaysAgo(now: Date, n: number, _timeZone: string): Date {
  // Add an extra day of buffer so the first calendar day is fully covered
  // regardless of the user's UTC offset.
  return new Date(now.getTime() - (n + 1) * 24 * 60 * 60 * 1000);
}

async function buildClicksTimeline(
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkIds: ObjectId[],
  since: Date,
  rangeParam: string = '30d',
  userTimezone: string = 'UTC'
): Promise<TimelineEntry[]> {
  if (rangeParam === '24h') {
    return buildHourlyTimeline(clicksColl, shortlinkIds, since);
  }
  return buildDailyTimeline(clicksColl, shortlinkIds, since, rangeParam === '7d' ? 7 : 30, userTimezone);
}

async function buildHourlyTimeline(
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkIds: ObjectId[],
  since: Date
): Promise<TimelineEntry[]> {
  const rows = await clicksColl
    .aggregate<{ _id: string; count: number }>([
      { $match: { shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%dT%H:00:00.000Z', date: '$timestamp', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const timelineMap = new Map<string, number>(rows.map((r) => [r._id, r.count]));
  const result: TimelineEntry[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i -= 1) {
    const slot = new Date(now.getTime() - i * 60 * 60 * 1000);
    slot.setUTCMinutes(0, 0, 0);
    const isoKey = slot.toISOString();
    result.push({
      date: isoKey,
      count: timelineMap.get(isoKey) ?? 0,
    });
  }

  return result;
}

async function buildDailyTimeline(
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  shortlinkIds: ObjectId[],
  since: Date,
  daysCount: number,
  userTimezone: string = 'UTC'
): Promise<TimelineEntry[]> {
  let mongoTz = userTimezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: mongoTz });
  } catch {
    mongoTz = 'UTC';
  }

  const rows = await clicksColl
    .aggregate<{ _id: string; count: number }>([
      { $match: { shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: mongoTz } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const timelineMap = new Map<string, number>(rows.map((r) => [r._id, r.count]));
  const result: TimelineEntry[] = [];

  // Determine today's calendar date string in the user's timezone.
  // We must NOT use millisecond arithmetic here — doing so against a UTC "now"
  // causes days to shift when the user's UTC offset is non-zero.
  const todayStr = formatDateInTimezone(new Date(), mongoTz); // e.g. "2026-07-29"

  // Walk backwards from today, producing one entry per calendar day.
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const dateStr = shiftCalendarDay(todayStr, -i, mongoTz);
    result.push({
      date: dateStr,
      count: timelineMap.get(dateStr) ?? 0,
    });
  }

  return result;
}

/**
 * Shifts a YYYY-MM-DD calendar date string by `deltaDays` days and returns
 * the resulting local calendar date string in the given timezone.
 *
 * KEY INVARIANT: we use noon UTC (12:00Z) as the arithmetic anchor, NOT
 * midnight UTC (00:00Z).  Midnight UTC falls on the *previous* local day for
 * any timezone with a negative UTC offset (e.g. UTC-6), which would produce
 * an off-by-one error.  Noon UTC is safely within the same calendar day for
 * every timezone in the range UTC-12 to UTC+12.
 */
function shiftCalendarDay(dateStr: string, deltaDays: number, timeZone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Noon UTC — guaranteed to be the same calendar day as `dateStr` in the target timezone
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Add delta whole days in milliseconds (UTC arithmetic, DST-safe)
  const shifted = new Date(noonUtc.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return formatDateInTimezone(shifted, timeZone);
}

async function buildProjectBreakdown(
  shortlinks: Shortlink[],
  clicksColl: ReturnType<typeof collection<ShortlinkClick>>,
  sinceDate?: Date
): Promise<ProjectBreakdownEntry[]> {
  const projectIds = Array.from(
    new Set(shortlinks.map((l) => l.projectId?.toHexString()).filter(Boolean))
  ).map((id) => new ObjectId(id));

  if (projectIds.length === 0) return [];

  const projects = await collection<Project>(Collections.Projects)
    .find({ _id: { $in: projectIds } })
    .toArray();

  const projectMap = new Map<string, string>(projects.map((p) => [p._id!.toHexString(), p.name]));

  const matchFilter: Record<string, unknown> = { shortlinkId: { $in: shortlinks.map((l) => l._id).filter((id): id is ObjectId => Boolean(id)) } };
  if (sinceDate) {
    matchFilter.timestamp = { $gte: sinceDate };
  }

  const clicksByLink = await clicksColl
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: matchFilter },
      { $group: { _id: '$shortlinkId', count: { $sum: 1 } } },
    ])
    .toArray();

  const clickCountMap = new Map<string, number>(clicksByLink.map((c) => [c._id.toHexString(), c.count]));

  const projectClicksMap = new Map<string, number>();
  for (const link of shortlinks) {
    const projId = link.projectId ? link.projectId.toHexString() : 'unassigned';
    const linkClicks = clickCountMap.get(link._id!.toHexString()) ?? 0;
    projectClicksMap.set(projId, (projectClicksMap.get(projId) ?? 0) + linkClicks);
  }

  const breakdown: ProjectBreakdownEntry[] = [];
  for (const [projId, count] of projectClicksMap.entries()) {
    const projectName = projectMap.get(projId) ?? 'Default / Unassigned';
    breakdown.push({ projectId: projId, projectName, count });
  }

  return breakdown.sort((a, b) => b.count - a.count);
}
