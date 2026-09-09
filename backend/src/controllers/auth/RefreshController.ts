import { Request, Response } from 'express';
import { TokenService } from '@services/TokenService';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { REFRESH_COOKIE_NAME, setRefreshCookie } from '@utils/cookie';

interface RefreshRequestBody {
  remember?: boolean;
}

/**
 * Handles `POST /api/auth/refresh`.
 *
 * Reads the refresh JWT from the httpOnly cookie, rotates it (the old
 * one is marked revoked in Mongo) and sets a brand-new cookie + returns
 * a fresh access token.
 *
 * `remember` is optional in the body. If true, the new cookie has a
 * long maxAge; if false (or absent) the new cookie is a session cookie.
 * The front is responsible for tracking "remember this device" state
 * across calls.
 */
export class RefreshController {
  public refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawToken = this.extractRefreshCookie(req);
    this.assertCookiePresent(rawToken);

    const remember = this.readRemember(req);
    const rotated = await TokenService.rotateRefreshToken(rawToken, {
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });

    setRefreshCookie(res, rotated.refreshToken, remember);
    res.status(200).json({ ok: true, data: { accessToken: rotated.accessToken } });
  });

  // -------------------------------------------------------------------------
  // Private helpers (each does ONE thing)
  // -------------------------------------------------------------------------

  private extractRefreshCookie(req: Request): string | undefined {
    return req.cookies?.[REFRESH_COOKIE_NAME];
  }

  private assertCookiePresent(raw: string | undefined): asserts raw is string {
    if (!raw) {
      throw new ApiError(401, 'Missing refresh cookie', 'MISSING_REFRESH');
    }
  }

  private readRemember(req: Request): boolean {
    const body = req.body as RefreshRequestBody | undefined;
    return body?.remember === true;
  }
}
