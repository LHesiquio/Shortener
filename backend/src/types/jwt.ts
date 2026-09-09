import { ObjectId } from 'mongodb';

/**
 * Decoded shape of a valid access token.
 *
 * `sub` carries the user id (as string, per JWT spec). `iat` / `exp` are
 * populated by `jsonwebtoken` on verification.
 */
export interface AccessTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

/**
 * Persisted shape of a refresh token in the `refresh_tokens` collection.
 *
 * The collection is queried on every refresh request to support rotation
 * (old token revoked + new one issued) and explicit logout (revoke all).
 */
export interface RefreshTokenRecord {
  _id?: ObjectId;
  /** Random opaque secret used to verify the JWT signature. */
  jti: string;
  userId: ObjectId;
  /** Hashed form of the refresh token (we never store the raw token). */
  tokenHash: string;
  createdAt: Date;
  /** Set when the token is rotated or logged out; non-null = invalid. */
  revokedAt: Date | null;
  /** Auto-expires via Mongo TTL index (matches JWT_REFRESH_TTL). */
  expiresAt: Date;
  /** User-agent of the device that created this token (for "remember this device" UX). */
  userAgent: string | null;
  /** IP at the moment of creation (for audit). */
  ip: string | null;
}