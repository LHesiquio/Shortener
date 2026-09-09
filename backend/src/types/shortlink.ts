import { Document, ObjectId } from 'mongodb';

/**
 * A shortlink document as stored in MongoDB.
 *
 * - `slug` is the public-facing identifier (e.g. `/r/abc123`).
 * - `url` is the destination URL the user is redirected to.
 * - `active` lets the owner soft-disable a shortlink (redirect becomes 410).
 * - `userId` enforces ownership: only the owner can read/update/delete.
 */
export interface Shortlink extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  projectId: ObjectId;
  slug: string;
  url: string;
  title?: string;
  active: boolean;
  isArchived?: boolean;
  clicksCount?: number;
  activeFrom?: Date;
  activeTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Public projection of a shortlink — safe to return to the client. */
export type PublicShortlink = {
  id: string;
  userId: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  slug: string;
  url: string;
  title?: string;
  active: boolean;
  isArchived?: boolean;
  clicksCount?: number;
  activeFrom?: Date;
  activeTo?: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A click event recorded on every redirect. The "tracking" payload is
 * intentionally rich so the owner can later see country, city, device
 * class, browser and OS breakdown without re-running the click through
 * an external analytics service.
 *
 * Geo fields (`country`, `city`, `region`) come from request headers
 * (Cloudflare, Vercel, custom proxy) — see utils/geo.ts.
 */
export interface ShortlinkClick extends Document {
  _id?: ObjectId;
  shortlinkId: ObjectId;
  slug: string;
  timestamp: Date;
  ip: string | null;
  ipHash: string | null;
  userAgent: string | null;
  referer: string | null;
  acceptLanguage: string | null;
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
    os: string | null;
    browser: string | null;
    model?: string | null;
  };
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
    lat?: number | null;
    lon?: number | null;
    postalCode?: string | null;
    isp?: string | null;
    timezone?: string | null;
  };
}
