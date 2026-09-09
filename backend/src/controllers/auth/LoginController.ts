import { Request, Response } from 'express';
import { Collection, ObjectId } from 'mongodb';
import { GeneralController } from '@controllers/GeneralController';
import { LoginInput, LoginModel } from '@models/AuthModel';
import { TokenService } from '@services/TokenService';
import { collection, Collections } from '@config/db';
import { PublicUser, User } from '@appTypes/user';
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
 * Inherits the validate-then-build pipeline from `GeneralController`,
 * but the action we expose is `login` (not `create`) because we don't
 * insert anything — we just verify credentials and issue tokens.
 *
 * Refresh cookie: when the body includes `remember: true` the cookie
 * gets a long `maxAge` so it survives browser restarts; otherwise it's
 * a session cookie that vanishes when the browser closes. The access
 * JWT TTL is fixed by env regardless.
 */
export class LoginController extends GeneralController<LoginInput, User> {
  protected readonly model = new LoginModel();

  /** Lazy: login doesn't actually use the collection, but the base class requires it. */
  protected get collection(): Collection<User> {
    return collection<User>(Collections.Users);
  }

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const user = await this.model.build(input);
    if (!user._id) {
      throw new ApiError(500, 'User is missing _id', 'INTERNAL');
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
    // `remember` is currently a hint for the cookie; the refresh JWT TTL
    // is set by env. If we ever need a longer-lived refresh on remember,
    // the only change is in TokenService.issueRefreshToken.
    void remember;
    return { accessToken, refreshToken: refresh.rawToken };
  }

  /**
   * Override so /login can't be wired to the base `create` accidentally.
   */
  public create = asyncHandler(async (_req: Request, _res: Response): Promise<void> => {
    throw new ApiError(500, 'LoginController.create should not be used directly. Use login().');
  });
}
