import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@services/TokenService';
import { ApiError } from '@utils/ApiError';

/**
 * Express middleware that authenticates the request using the
 * `Authorization: Bearer <token>` header.
 *
 * On success, attaches `req.user = { id }` for downstream handlers.
 * On failure, forwards an ApiError(401) which the global errorHandler
 * will turn into a clean JSON response.
 *
 * Used by protected routes (e.g. `GET /api/auth/me`, future link CRUD).
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    next(new ApiError(401, 'Missing bearer token', 'MISSING_TOKEN'));
    return;
  }

  const raw = header.slice('bearer '.length).trim();
  if (!raw) {
    next(new ApiError(401, 'Empty bearer token', 'MISSING_TOKEN'));
    return;
  }

  try {
    const payload = TokenService.verifyAccessToken(raw);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(err);
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}