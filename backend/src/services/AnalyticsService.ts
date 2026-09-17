import { Collection, ObjectId, WithId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { User } from '@appTypes/user';
import { Project } from '@appTypes/project';
import { calculateSinceDate, resolveUserTimezone } from '@utils/analyticsDate.utils';
import {
  aggregateClickField,
  AnalyticsBreakdownEntry,
  buildClicksTimeline,
  TimelineEntry,
} from '@services/analyticsTimeline.utils';

export type { TimelineEntry, AnalyticsBreakdownEntry };

export interface ProjectBreakdownEntry {
  projectId: string;
  projectName: string;
  count: number;
}

export interface AnalyticsSummaryData {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  clicksLast30d: number;
  totalShortlinks: number;
  activeShortlinks: number;
  topLinkDoc: WithId<Shortlink> | null;
  clicksTimeline: TimelineEntry[];
  byDevice: AnalyticsBreakdownEntry[];
  byBrowser: AnalyticsBreakdownEntry[];
  byOs: AnalyticsBreakdownEntry[];
  byCountry: AnalyticsBreakdownEntry[];
  byProject: ProjectBreakdownEntry[];
}

export class AnalyticsService {
  public static async getSummary(
    userId: ObjectId,
    rangeParam: string = '30d',
    clientTz?: string
  ): Promise<AnalyticsSummaryData> {
    const userLinks = await collection<Shortlink>(Collections.Shortlinks).find({ userId }).toArray();
    const shortlinkIds = userLinks.map((l) => l._id).filter((id): id is ObjectId => Boolean(id));
    const totalShortlinks = userLinks.length;
    const activeShortlinks = userLinks.filter((l) => l.active).length;

    if (shortlinkIds.length === 0) {
      return buildEmptySummaryData(totalShortlinks, activeShortlinks);
    }

    const userDoc = await collection<User>(Collections.Users).findOne({ _id: userId }, { projection: { timezone: 1 } });
    const userTimezone = resolveUserTimezone(userDoc?.timezone, clientTz);
    const dates = calculateSinceDate(rangeParam, userTimezone);

    const aggregates = await fetchSummaryAggregates(userLinks, shortlinkIds, dates, rangeParam, userTimezone);
    return {
      ...aggregates,
      totalShortlinks,
      activeShortlinks,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DateBoundaries {
  sinceDate: Date;
  last24h: Date;
  last7d: Date;
  last30d: Date;
}

async function fetchSummaryAggregates(
  userLinks: WithId<Shortlink>[],
  shortlinkIds: ObjectId[],
  dates: DateBoundaries,
  rangeParam: string,
  userTimezone: string
) {
  const clicksColl = collection<ShortlinkClick>(Collections.ShortlinkClicks);
  const [topLinkDoc, totalClicks, clicks24h, clicks7d, clicks30d, timeline, deviceAgg, browserAgg, osAgg, countryAgg, projectBreakdown] = await Promise.all([
    findMostClickedShortlink(userLinks, shortlinkIds, clicksColl, dates.sinceDate),
    clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: dates.sinceDate } }),
    clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: dates.last24h } }),
    clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: dates.last7d } }),
    clicksColl.countDocuments({ shortlinkId: { $in: shortlinkIds }, timestamp: { $gte: dates.last30d } }),
    buildClicksTimeline(clicksColl, shortlinkIds, dates.sinceDate, rangeParam, userTimezone),
    aggregateClickField(clicksColl, shortlinkIds, 'device.type', dates.sinceDate),
    aggregateClickField(clicksColl, shortlinkIds, 'device.browser', dates.sinceDate),
    aggregateClickField(clicksColl, shortlinkIds, 'device.os', dates.sinceDate),
    aggregateClickField(clicksColl, shortlinkIds, 'geo.country', dates.sinceDate),
    buildProjectBreakdown(userLinks, clicksColl, dates.sinceDate),
  ]);

  return {
    totalClicks,
    clicksLast24h: clicks24h,
    clicksLast7d: clicks7d,
    clicksLast30d: clicks30d,
    topLinkDoc,
    clicksTimeline: timeline,
    byDevice: deviceAgg,
    byBrowser: browserAgg,
    byOs: osAgg,
    byCountry: countryAgg,
    byProject: projectBreakdown,
  };
}

function buildEmptySummaryData(totalShortlinks: number, activeShortlinks: number): AnalyticsSummaryData {
  return {
    totalClicks: 0,
    clicksLast24h: 0,
    clicksLast7d: 0,
    clicksLast30d: 0,
    totalShortlinks,
    activeShortlinks,
    topLinkDoc: null,
    clicksTimeline: [],
    byDevice: [],
    byBrowser: [],
    byOs: [],
    byCountry: [],
    byProject: [],
  };
}

async function findMostClickedShortlink(
  userLinks: WithId<Shortlink>[],
  shortlinkIds: ObjectId[],
  clicksColl: Collection<ShortlinkClick>,
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

async function buildProjectBreakdown(
  shortlinks: Shortlink[],
  clicksColl: Collection<ShortlinkClick>,
  sinceDate?: Date
): Promise<ProjectBreakdownEntry[]> {
  const projectIds = extractUniqueProjectIds(shortlinks);
  if (projectIds.length === 0) return [];

  const [projectMap, clickCountMap] = await Promise.all([
    fetchProjectNameMap(projectIds),
    fetchLinkClicksMap(shortlinks, clicksColl, sinceDate),
  ]);

  const projectClicksMap = aggregateClicksByProject(shortlinks, clickCountMap);
  return mapToProjectBreakdown(projectClicksMap, projectMap);
}

function extractUniqueProjectIds(shortlinks: Shortlink[]): ObjectId[] {
  const idSet = new Set<string>();
  for (const link of shortlinks) {
    if (link.projectId) {
      idSet.add(link.projectId.toHexString());
    }
  }
  return Array.from(idSet).map((id) => new ObjectId(id));
}

async function fetchProjectNameMap(projectIds: ObjectId[]): Promise<Map<string, string>> {
  const projects = await collection<Project>(Collections.Projects)
    .find({ _id: { $in: projectIds } })
    .toArray();
  return new Map(projects.map((p) => [p._id!.toHexString(), p.name]));
}

async function fetchLinkClicksMap(
  shortlinks: Shortlink[],
  clicksColl: Collection<ShortlinkClick>,
  sinceDate?: Date
): Promise<Map<string, number>> {
  const linkIds = shortlinks.map((l) => l._id).filter((id): id is ObjectId => Boolean(id));
  const matchFilter: Record<string, unknown> = { shortlinkId: { $in: linkIds } };
  if (sinceDate) {
    matchFilter.timestamp = { $gte: sinceDate };
  }
  const rows = await clicksColl
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: matchFilter },
      { $group: { _id: '$shortlinkId', count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((c) => [c._id.toHexString(), c.count]));
}

function aggregateClicksByProject(
  shortlinks: Shortlink[],
  clickCountMap: Map<string, number>
): Map<string, number> {
  const projectClicksMap = new Map<string, number>();
  for (const link of shortlinks) {
    const projId = link.projectId ? link.projectId.toHexString() : 'unassigned';
    const linkClicks = clickCountMap.get(link._id!.toHexString()) ?? 0;
    const current = projectClicksMap.get(projId) ?? 0;
    projectClicksMap.set(projId, current + linkClicks);
  }
  return projectClicksMap;
}

function mapToProjectBreakdown(
  projectClicksMap: Map<string, number>,
  projectMap: Map<string, string>
): ProjectBreakdownEntry[] {
  const breakdown: ProjectBreakdownEntry[] = [];
  for (const [projId, count] of projectClicksMap.entries()) {
    const projectName = projectMap.get(projId) ?? 'Default / Unassigned';
    breakdown.push({ projectId: projId, projectName, count });
  }
  return breakdown.sort((a, b) => b.count - a.count);
}
