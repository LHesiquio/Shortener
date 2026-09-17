import { Collection, ObjectId } from 'mongodb';
import { ShortlinkClick } from '@appTypes/shortlink';
import { formatDateInTimezone, shiftCalendarDay } from '@utils/analyticsDate.utils';

export interface TimelineEntry {
  date: string;
  count: number;
}

export interface AnalyticsBreakdownEntry {
  key: string;
  count: number;
}

export async function aggregateClickField(
  clicksColl: Collection<ShortlinkClick>,
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

export async function buildClicksTimeline(
  clicksColl: Collection<ShortlinkClick>,
  shortlinkIds: ObjectId[],
  since: Date,
  rangeParam: string = '30d',
  userTimezone: string = 'UTC'
): Promise<TimelineEntry[]> {
  if (rangeParam === '24h') {
    return buildHourlyTimeline(clicksColl, shortlinkIds, since);
  }
  const daysCount = rangeParam === '7d' ? 7 : 30;
  return buildDailyTimeline(clicksColl, shortlinkIds, since, daysCount, userTimezone);
}

async function buildHourlyTimeline(
  clicksColl: Collection<ShortlinkClick>,
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
  return generateHourlySlots(timelineMap);
}

function generateHourlySlots(timelineMap: Map<string, number>): TimelineEntry[] {
  const result: TimelineEntry[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i -= 1) {
    const slot = new Date(now.getTime() - i * 60 * 60 * 1000);
    slot.setUTCMinutes(0, 0, 0);
    const isoKey = slot.toISOString();
    result.push({ date: isoKey, count: timelineMap.get(isoKey) ?? 0 });
  }
  return result;
}

async function buildDailyTimeline(
  clicksColl: Collection<ShortlinkClick>,
  shortlinkIds: ObjectId[],
  since: Date,
  daysCount: number,
  userTimezone: string = 'UTC'
): Promise<TimelineEntry[]> {
  const mongoTz = sanitizeTimezone(userTimezone);
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
  return generateDailySlots(timelineMap, daysCount, mongoTz);
}

function sanitizeTimezone(tz: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

function generateDailySlots(
  timelineMap: Map<string, number>,
  daysCount: number,
  mongoTz: string
): TimelineEntry[] {
  const result: TimelineEntry[] = [];
  const todayStr = formatDateInTimezone(new Date(), mongoTz);
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const dateStr = shiftCalendarDay(todayStr, -i, mongoTz);
    result.push({ date: dateStr, count: timelineMap.get(dateStr) ?? 0 });
  }
  return result;
}
