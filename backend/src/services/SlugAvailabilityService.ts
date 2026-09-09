import { ObjectId, Filter } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Project } from '@appTypes/project';
import { Shortlink } from '@appTypes/shortlink';
import { isReservedSlug, slugify } from '@utils/slug';

export type SlugFeatureType = 'project' | 'shortlink';

export interface SlugCheckResult {
  slug: string;
  isAvailable: boolean;
  suggestion?: string;
  reason?: string;
}

const SLUG_RE = /^[a-z0-9_-]+$/;

function checkSlugLength(slug: string): string | null {
  if (!slug || slug.trim().length === 0) return 'Slug is required';
  const len = slug.trim().length;
  if (len < 2 || len > 64) {
    return 'Slug must be between 2 and 64 characters';
  }
  return null;
}

function checkSlugPattern(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'Slug may only contain lowercase letters, numbers, "-" and "_"';
  }
  if (isReservedSlug(slug)) {
    return 'This slug is reserved by the system';
  }
  return null;
}

function validateSlugFormat(slug: string): string | null {
  const lenErr = checkSlugLength(slug);
  if (lenErr) return lenErr;
  return checkSlugPattern(slug.trim().toLowerCase());
}

async function findProjectCollision(
  slug: string,
  userId: ObjectId,
  excludeId?: ObjectId
): Promise<boolean> {
  const filter: Filter<Project> = { userId, slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await collection<Project>(Collections.Projects).findOne(filter);
  return Boolean(doc);
}

async function findShortlinkCollision(
  slug: string,
  excludeId?: ObjectId
): Promise<boolean> {
  const filter: Filter<Shortlink> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await collection<Shortlink>(Collections.Shortlinks).findOne(filter);
  return Boolean(doc);
}

async function suggestAlternative(
  type: SlugFeatureType,
  baseSlug: string,
  userId: ObjectId
): Promise<string> {
  let count = 1;
  while (count < 100) {
    const candidate = `${baseSlug}-${count}`;
    const collision =
      type === 'project'
        ? await findProjectCollision(candidate, userId)
        : await findShortlinkCollision(candidate);
    if (!collision) return candidate;
    count += 1;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export class SlugAvailabilityService {
  public static async check(
    type: SlugFeatureType,
    rawSlug: string,
    userId: ObjectId,
    excludeId?: ObjectId
  ): Promise<SlugCheckResult> {
    const normalized = slugify(rawSlug || '');
    const formatError = validateSlugFormat(normalized);

    if (formatError) {
      return { slug: normalized, isAvailable: false, reason: formatError };
    }

    const isCollision =
      type === 'project'
        ? await findProjectCollision(normalized, userId, excludeId)
        : await findShortlinkCollision(normalized, excludeId);

    if (isCollision) {
      const suggestion = await suggestAlternative(type, normalized, userId);
      return {
        slug: normalized,
        isAvailable: false,
        suggestion,
        reason: 'Slug is already in use',
      };
    }

    return { slug: normalized, isAvailable: true };
  }
}
