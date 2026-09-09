import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { env } from '@config/env';
import { collection, Collections } from '@config/db';
import { ApiError } from '@utils/ApiError';
import { AccessTokenPayload, RefreshTokenRecord } from '@appTypes/jwt';
import { VerificationTokenPayload } from '@appTypes/email';

/**
 * Token management.
 *
 * Strategy (rotation on every use):
 *  1. Access token = short-lived stateless JWT signed with JWT_ACCESS_SECRET.
 *  2. Refresh token = long-lived JWT signed with JWT_REFRESH_SECRET, carrying
 *     a unique `jti`. The corresponding record (jti + tokenHash) is persisted
 *     in Mongo so we can revoke it on rotation / logout.
 *  3. On every /refresh request we verify the incoming JWT, mark the previous
 *     record as revoked, and issue a brand-new pair. A stolen refresh token
 *     is invalidated the moment a legitimate user rotates it.
 */
const TTL_UNITS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = TTL_UNITS[unit] ?? 0;
  if (multiplier === 0) {
    throw new Error(`Unsupported TTL unit: ${unit}`);
  }
  return value * multiplier;
}

function buildTokenHash(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function newJti(): string {
  return crypto.randomBytes(24).toString('hex');
}

function refreshCollection() {
  return collection<RefreshTokenRecord>(Collections.RefreshTokens);
}

export interface IssueRefreshOptions {
  userId: ObjectId;
  userAgent: string | null;
  ip: string | null;
}

export interface IssueRefreshResult {
  rawToken: string;
  record: RefreshTokenRecord;
}

interface RefreshTokenJwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export const TokenService = {
  /**
   * Issues a short-lived access token for a given user id.
   */
  issueAccessToken(userId: ObjectId): string {
    const payload: AccessTokenPayload = { sub: userId.toHexString() };
    const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  },

  /**
   * Verifies an access token and returns its payload. Throws ApiError(401) on
   * invalid / expired tokens.
   */
  verifyAccessToken(rawToken: string): AccessTokenPayload {
    let decoded: unknown;
    try {
      decoded = jwt.verify(rawToken, env.JWT_ACCESS_SECRET);
    } catch {
      throw new ApiError(401, 'Invalid or expired access token', 'INVALID_TOKEN');
    }
    return assertAccessPayload(decoded);
  },

  /**
   * Issues a refresh JWT. The raw token string is what the client stores
   * (in an httpOnly cookie) and returns to /refresh. We persist only its
   * hash, never the raw value.
   */
  async issueRefreshToken(options: IssueRefreshOptions): Promise<IssueRefreshResult> {
    const jti = newJti();
    const now = new Date();
    const ttlMs = parseTtlToMs(env.JWT_REFRESH_TTL);
    const expiresAt = new Date(now.getTime() + ttlMs);

    const payload: RefreshTokenJwtPayload = {
      sub: options.userId.toHexString(),
      jti,
    };
    const signOptions: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
    const rawToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, signOptions);

    const record: RefreshTokenRecord = {
      jti,
      userId: options.userId,
      tokenHash: buildTokenHash(rawToken),
      createdAt: now,
      revokedAt: null,
      expiresAt,
      userAgent: options.userAgent,
      ip: options.ip,
    };

    await refreshCollection().insertOne(record);
    return { rawToken, record };
  },

  /**
   * Verifies a raw refresh token and returns its persisted record, or throws.
   *
   * A token is valid iff: signature OK + record exists + not revoked +
   * stored hash matches the hash of the incoming token.
   */
  async verifyRefreshToken(rawToken: string): Promise<RefreshTokenRecord> {
    const jti = decodeRefreshJti(rawToken);
    const record = await refreshCollection().findOne({ jti });
    assertRefreshRecordExists(record);
    assertRefreshRecordLive(record);
    assertRefreshHashMatches(record, rawToken);
    return record;
  },

  /**
   * Rotates a refresh token: marks the old record as revoked and issues a new
   * pair (access + refresh). Returns the new access token, new raw refresh
   * token, and the new persisted record.
   */
  async rotateRefreshToken(
    rawToken: string,
    ctx: Omit<IssueRefreshOptions, 'userId'>
  ): Promise<{ accessToken: string; refreshToken: string; record: RefreshTokenRecord }> {
    const previous = await TokenService.verifyRefreshToken(rawToken);
    const accessToken = TokenService.issueAccessToken(previous.userId);
    const issued = await TokenService.issueRefreshToken({ ...ctx, userId: previous.userId });
    await refreshCollection().updateOne(
      { _id: previous._id },
      { $set: { revokedAt: new Date() } }
    );
    return { accessToken, refreshToken: issued.rawToken, record: issued.record };
  },

  /**
   * Revokes a single refresh token (logout from one device).
   */
  async revokeRefreshToken(rawToken: string): Promise<void> {
    let jti: string;
    try {
      jti = decodeRefreshJti(rawToken);
    } catch {
      return;
    }
    await refreshCollection().updateOne(
      { jti, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  },

  /**
   * Revokes every refresh token belonging to a user (logout everywhere /
   * password change / account compromise).
   */
  async revokeAllForUser(userId: ObjectId): Promise<void> {
    await refreshCollection().updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  },

  /**
   * Signs a short-lived JWT that the user follows from the verification
   * email. We tag the payload with `purpose: 'email_verification'` so
   * the verifier can reject tokens minted for a different flow.
   */
  issueEmailVerificationToken(userId: ObjectId): string {
    const payload: VerificationTokenPayload = {
      sub: userId.toHexString(),
      purpose: 'email_verification',
    };
    const options: SignOptions = {
      expiresIn: env.EMAIL_VERIFICATION_TTL as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  },

  /**
   * Verifies an email-verification token and returns the userId. Throws
   * 400 on malformed/expired/wrong-purpose tokens.
   */
  verifyEmailVerificationToken(rawToken: string): ObjectId {
    const decoded = decodeVerification(rawToken);
    assertVerificationPayload(decoded);
    return new ObjectId(decoded.sub);
  },
};

// Re-export for unit tests so they can introspect internal helpers.
export const __testing = { buildTokenHash, parseTtlToMs, decodeRefreshJti };

// ---------------------------------------------------------------------------
// Internal helpers. Each does ONE thing to keep cyclomatic complexity low.
// ---------------------------------------------------------------------------

function assertAccessPayload(decoded: unknown): AccessTokenPayload {
  if (typeof decoded !== 'object' || decoded === null) {
    throw new ApiError(401, 'Invalid access token', 'INVALID_TOKEN');
  }
  const sub = (decoded as AccessTokenPayload).sub;
  if (typeof sub !== 'string') {
    throw new ApiError(401, 'Invalid access token', 'INVALID_TOKEN');
  }
  return decoded as AccessTokenPayload;
}

function decodeRefreshJti(rawToken: string): string {
  let decoded: RefreshTokenJwtPayload;
  try {
    decoded = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as RefreshTokenJwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH');
  }
  if (!decoded?.jti || !decoded?.sub) {
    throw new ApiError(401, 'Malformed refresh token', 'INVALID_REFRESH');
  }
  return decoded.jti;
}

function assertRefreshRecordExists(
  record: RefreshTokenRecord | null
): asserts record is RefreshTokenRecord {
  if (!record) {
    throw new ApiError(401, 'Refresh token not recognized', 'INVALID_REFRESH');
  }
}

function assertRefreshRecordLive(record: RefreshTokenRecord): void {
  if (record.revokedAt) {
    throw new ApiError(401, 'Refresh token has been revoked', 'REVOKED_REFRESH');
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, 'Refresh token expired', 'EXPIRED_REFRESH');
  }
}

function assertRefreshHashMatches(record: RefreshTokenRecord, rawToken: string): void {
  const incomingHash = buildTokenHash(rawToken);
  if (incomingHash !== record.tokenHash) {
    throw new ApiError(401, 'Refresh token mismatch', 'INVALID_REFRESH');
  }
}

function decodeVerification(rawToken: string): VerificationTokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(rawToken, env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(400, 'Invalid or expired verification token', 'INVALID_VERIFICATION');
  }
  if (typeof decoded !== 'object' || decoded === null) {
    throw new ApiError(400, 'Malformed verification token', 'INVALID_VERIFICATION');
  }
  return decoded as VerificationTokenPayload;
}

function assertVerificationPayload(payload: VerificationTokenPayload): void {
  if (payload.purpose !== 'email_verification') {
    throw new ApiError(400, 'Token is not for email verification', 'INVALID_VERIFICATION');
  }
  if (typeof payload.sub !== 'string' || !ObjectId.isValid(payload.sub)) {
    throw new ApiError(400, 'Malformed verification token', 'INVALID_VERIFICATION');
  }
}