import { RequestHandler } from 'express';
import { ApiError } from '@utils/ApiError';

/**
 * Rejects NoSQL-injection attempts in incoming request bodies.
 *
 * MongoDB operators start with `$` (e.g. `$gt`, `$ne`) or contain `.`.
 * If a request body has any such key, the request is rejected with 400
 * before it ever reaches a controller.
 */
const FORBIDDEN_KEY = /^\$/;
const FORBIDDEN_CHAR = /\./;

function hasForbiddenKeys(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenKeys);
  return Object.keys(value as Record<string, unknown>).some((key) => {
    if (FORBIDDEN_KEY.test(key) || FORBIDDEN_CHAR.test(key)) return true;
    return hasForbiddenKeys((value as Record<string, unknown>)[key]);
  });
}

export const noSanitize: RequestHandler = (req, _res, next) => {
  const candidates: unknown[] = [req.body, req.params, req.query];
  const found = candidates.find(hasForbiddenKeys);
  if (found !== undefined) {
    next(new ApiError(400, 'Invalid request payload', 'INVALID_PAYLOAD'));
    return;
  }
  next();
};