import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '@config/env';
import { ApiError } from '@utils/ApiError';

function parseWindowMs(window: string): number {
  const match = /^(\d+)([smhd])$/.exec(window);
  if (!match) {
    throw new Error(`Invalid rate-limit window: ${window}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const ms = multipliers[unit];
  if (ms === undefined) {
    throw new Error(`Unsupported rate-limit unit: ${unit}`);
  }
  return value * ms;
}

/**
 * Builds the rate-limit middleware applied to `POST /api/auth/login`.
 *
 * Defaults come from env (`LOGIN_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_WINDOW`)
 * so they can be tuned per environment without code changes. Tests can
 * pass overrides when mounting the routes.
 */
export function createLoginRateLimit(overrides?: { max?: number; windowMs?: number }): RateLimitRequestHandler {
  const max = overrides?.max ?? env.LOGIN_RATE_LIMIT_MAX;
  const windowMs = overrides?.windowMs ?? parseWindowMs(env.LOGIN_RATE_LIMIT_WINDOW);
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new ApiError(429, 'Too many login attempts. Please try again later.', 'RATE_LIMITED'));
    },
  });
}

/**
 * Builds the rate-limit middleware applied to `POST /api/auth/resend-verification`.
 * Stricter than login — these endpoints are common spam/abuse targets.
 */
export function createResendRateLimit(overrides?: { max?: number; windowMs?: number }): RateLimitRequestHandler {
  const max = overrides?.max ?? 3;
  const windowMs = overrides?.windowMs ?? 60 * 60 * 1000; // 1 hour
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new ApiError(429, 'Too many resend attempts. Try again later.', 'RATE_LIMITED'));
    },
  });
}
