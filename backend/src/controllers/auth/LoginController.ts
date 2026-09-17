import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { LoginModel } from '@models/AuthModel';
import { TokenService } from '@services/TokenService';
import { PublicUser } from '@appTypes/user';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { setRefreshCookie } from '@utils/cookie';

interface LoginResponsePayload {
  user: PublicUser;
  accessToken: string;
}

/**
 * Handles `POST /api/auth/login`.
 *
 * Standalone action controller that verifies credentials and issues tokens.
 * Refresh cookie: when the body includes `remember: true` the cookie
 * gets a long `maxAge` so it survives browser restarts; otherwise it's
 * a session cookie that vanishes when the browser closes. The access
 * JWT TTL is fixed by env regardless.
 */
export class LoginController {
  private readonly model = new LoginModel();

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const user = await this.model.build(input);
    if (!user._id) {
      throw new ApiError(500, 'User is missing _id', 'INTERNAL');
    }

    if (user.twoFactorEnabled) {
      const mfaToken = TokenService.issueMfaChallengeToken(user._id, input.remember);
      res.status(200).json({
        ok: true,
        data: {
          mfaRequired: true,
          mfaToken,
          email: user.email,
        },
      });
      return;
    }

    const tokens = await this.issueTokensForUser(user._id, req, input.remember);
    const payload: LoginResponsePayload = {
      user: this.model.toResponse(user),
      accessToken: tokens.accessToken,
    };

    setRefreshCookie(res, tokens.refreshToken, input.remember);
    res.status(200).json({ ok: true, data: payload });
  });

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async issueTokensForUser(
    userId: ObjectId,
    req: Request,
    remember: boolean
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = TokenService.issueAccessToken(userId);
    const refresh = await TokenService.issueRefreshToken({
      userId,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });
    void remember;
    return { accessToken, refreshToken: refresh.rawToken };
  }
}
