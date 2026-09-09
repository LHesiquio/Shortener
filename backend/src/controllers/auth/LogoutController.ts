import { Request, Response } from 'express';
import { TokenService } from '@services/TokenService';
import { asyncHandler } from '@utils/asyncHandler';
import { clearRefreshCookie, REFRESH_COOKIE_NAME } from '@utils/cookie';

/**
 * Handles `POST /api/auth/logout`.
 *
 * Revokes the refresh token that lives in the cookie (if any) and clears
 * the cookie on the client. We always respond 204 so the action is
 * idempotent — a missing/invalid cookie still logs you out.
 */
export class LogoutController {
  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (raw) {
      await TokenService.revokeRefreshToken(raw);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  });
}
