import { Collection, Filter, ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Project } from '@appTypes/project';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { ApiError } from '@utils/ApiError';
import { ExportFormat } from './export.types';

export const ALL_EXPORT_FIELDS = [
  'timestamp',
  'slug',
  'country',
  'region',
  'city',
  'referer',
  'deviceType',
  'deviceModel',
  'deviceOs',
  'deviceBrowser',
  'userAgent',
];

const LEGACY_FIELD_MAP: Record<string, string> = {
  device: 'deviceType',
  os: 'deviceOs',
  browser: 'deviceBrowser',
};

export interface ResolvedTarget {
  ids: ObjectId[];
  slug: string;
  url: string;
  title: string;
  projectName: string;
}

export function sanitizeFormat(format?: string): ExportFormat {
  if (format === 'json' || format === 'xlsx' || format === 'pdf') {
    return format;
  }
  return 'csv';
}

export function sanitizeFields(rawFields?: string | string[]): string[] {
  if (!rawFields) return [...ALL_EXPORT_FIELDS];
  const list = Array.isArray(rawFields) ? rawFields : rawFields.split(',');
  const mapped = list.map((f) => {
    const trimmed = f.trim();
    return LEGACY_FIELD_MAP[trimmed] || trimmed;
  });
  const cleaned = mapped.filter((f) => ALL_EXPORT_FIELDS.includes(f));
  return cleaned.length > 0 ? cleaned : [...ALL_EXPORT_FIELDS];
}

export function buildFilename(slug: string, ext: string, projectName?: string): string {
  const safeProject = projectName ? projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : '';
  const safeSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  if (safeProject) {
    return `${safeProject}-${safeSlug}-${dateStr}.${ext}`;
  }
  return `click-logs-${safeSlug}-${dateStr}.${ext}`;
}

export function formatLocalizedTimestamp(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function extractClickFieldValue(c: ShortlinkClick, field: string, timezone: string): string {
  const map: Record<string, () => string> = {
    timestamp: () => formatLocalizedTimestamp(c.timestamp, timezone),
    slug: () => `/${c.slug}`,
    country: () => c.geo?.country || 'Unknown',
    region: () => c.geo?.region || 'Unknown',
    city: () => c.geo?.city || 'Unknown',
    referer: () => c.referer || 'Direct',
    deviceType: () => c.device?.type || 'unknown',
    deviceModel: () => c.device?.model || 'Unknown',
    deviceOs: () => c.device?.os || 'Unknown',
    deviceBrowser: () => c.device?.browser || 'Unknown',
    userAgent: () => c.userAgent || 'Unknown',
  };
  const resolver = map[field];
  return resolver ? resolver() : '';
}

export async function resolveTargetShortlink(
  userId: string,
  slug?: string,
  shortlinkId?: string,
  projectName?: string
): Promise<ResolvedTarget> {
  const shortlinksColl = collection<Shortlink>(Collections.Shortlinks);
  const userObjId = new ObjectId(userId);

  if (slug && slug.trim()) {
    return resolveBySlug(shortlinksColl, userObjId, slug.trim(), projectName);
  }

  if (shortlinkId && ObjectId.isValid(shortlinkId)) {
    return resolveById(shortlinksColl, userObjId, shortlinkId, projectName);
  }

  return resolveAllUserLinks(shortlinksColl, userObjId, projectName);
}

async function lookupProjectName(projectId?: ObjectId, fallback?: string): Promise<string> {
  if (fallback && fallback.trim()) return fallback.trim();
  if (!projectId) return 'Project';
  const projectsColl = collection<Project>(Collections.Projects);
  const p = await projectsColl.findOne({ _id: projectId });
  return p?.name || 'Project';
}

async function resolveBySlug(
  coll: Collection<Shortlink>,
  userObjId: ObjectId,
  slug: string,
  projectNameFallback?: string
): Promise<ResolvedTarget> {
  const link = await coll.findOne({ slug, userId: userObjId });
  if (!link) {
    throw new ApiError(404, 'SHORTLINK_NOT_FOUND', `Shortlink with slug "/${slug}" was not found.`);
  }
  const resolvedProject = await lookupProjectName(link.projectId, projectNameFallback);
  return {
    ids: [link._id!],
    slug: link.slug,
    url: link.url,
    title: link.title || link.slug,
    projectName: resolvedProject,
  };
}

async function resolveById(
  coll: Collection<Shortlink>,
  userObjId: ObjectId,
  shortlinkId: string,
  projectNameFallback?: string
): Promise<ResolvedTarget> {
  const link = await coll.findOne({ _id: new ObjectId(shortlinkId), userId: userObjId });
  if (!link) {
    throw new ApiError(404, 'SHORTLINK_NOT_FOUND', 'Shortlink was not found.');
  }
  const resolvedProject = await lookupProjectName(link.projectId, projectNameFallback);
  return {
    ids: [link._id!],
    slug: link.slug,
    url: link.url,
    title: link.title || link.slug,
    projectName: resolvedProject,
  };
}

async function resolveAllUserLinks(
  coll: Collection<Shortlink>,
  userObjId: ObjectId,
  projectNameFallback?: string
): Promise<ResolvedTarget> {
  const links = await coll
    .find({ userId: userObjId }, { projection: { _id: 1, slug: 1, url: 1, title: 1 } })
    .toArray();

  return {
    ids: links.map((l) => l._id!),
    slug: 'all-links',
    url: 'Multiple Shortlinks',
    title: 'All Shortlinks',
    projectName: projectNameFallback || 'All-Projects',
  };
}

export async function fetchClickDocuments(
  targetShortlinkIds: ObjectId[],
  sinceDate: Date | null,
  limit: number
): Promise<ShortlinkClick[]> {
  if (targetShortlinkIds.length === 0) return [];

  const clicksColl = collection<ShortlinkClick>(Collections.ShortlinkClicks);
  const matchQuery: Filter<ShortlinkClick> = {
    shortlinkId: { $in: targetShortlinkIds },
  };

  if (sinceDate) {
    matchQuery.timestamp = { $gte: sinceDate };
  }

  return clicksColl.find(matchQuery).sort({ timestamp: -1 }).limit(limit).toArray();
}
