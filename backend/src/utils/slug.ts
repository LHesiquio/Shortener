import { customAlphabet } from 'nanoid';
import { env } from '@config/env';

// Alphabet: lowercase + digits, excluding look-alikes (0/o, 1/l/i) for
// human-friendly slugs.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

const generateRaw = customAlphabet(ALPHABET, env.SHORTLINK_DEFAULT_RANDOM_LEN);

const SLUG_RE = /^[a-z0-9_-]+$/;

/** Converts a text/name into a clean URL-friendly slug */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, env.SHORTLINK_SLUG_MAX || 64);
}

/**
 * Normalises a user-supplied slug:
 *  - trims whitespace
 *  - lowercases
 *  - rejects if it contains chars outside [a-z0-9_-]
 *  - rejects if shorter than SHORTLINK_SLUG_MIN or longer than SHORTLINK_SLUG_MAX
 *  - rejects if it is in the reserved list
 */
export function normalizeSlug(raw: string): string {
  const slug = raw.trim().toLowerCase();
  if (slug.length < env.SHORTLINK_SLUG_MIN || slug.length > env.SHORTLINK_SLUG_MAX) {
    throw new SlugError(
      `Slug must be between ${env.SHORTLINK_SLUG_MIN} and ${env.SHORTLINK_SLUG_MAX} characters`
    );
  }
  if (!SLUG_RE.test(slug)) {
    throw new SlugError('Slug may only contain lowercase letters, digits, "-" and "_"');
  }
  if (env.SHORTLINK_RESERVED_SLUGS.includes(slug)) {
    throw new SlugError('This slug is reserved');
  }
  return slug;
}

/** Generates a random slug of `env.SHORTLINK_DEFAULT_RANDOM_LEN` chars. */
export function generateRandomSlug(): string {
  return generateRaw();
}

/** Checks if a slug is reserved without throwing. */
export function isReservedSlug(slug: string): boolean {
  return env.SHORTLINK_RESERVED_SLUGS.includes(slug);
}

/** Public, public-facing short URL. */
export function buildShortUrl(slug: string): string {
  const base = env.SHORTLINK_BASE_URL.replace(/\/$/, '');
  return `${base}/r/${slug}`;
}

export class SlugError extends Error {
  public readonly code = 'INVALID_SLUG';
  public constructor(message: string) {
    super(message);
    this.name = 'SlugError';
  }
}
