import { ErrorRequestHandler } from 'express';
import { MongoServerError } from 'mongodb';
import { ApiError } from '@utils/ApiError';

/**
 * Final error-handling middleware. Mounted last in the middleware chain.
 *
 * - ApiError instances are echoed back with their declared status/message.
 * - Mongo duplicate-key errors (code 11000) are translated to 409
 *   SLUG_TAKEN so the front can show a useful message instead of a 500.
 * - Anything else is treated as a 500 and the message is masked, but the
 *   real stack is logged so the developer can still debug it.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({
      ok: false,
      error: {
        code: 'SLUG_TAKEN',
        message: 'That slug is already in use',
      },
    });
    return;
  }

  console.error('[errorHandler] Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

function isDuplicateKeyError(err: unknown): boolean {
  if (err instanceof MongoServerError) return err.code === 11000;
  if (typeof err === 'object' && err !== null) {
    const candidate = err as { code?: unknown; name?: unknown };
    return candidate.code === 11000 || candidate.name === 'MongoServerError';
  }
  return false;
}