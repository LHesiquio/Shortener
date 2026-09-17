import { Request, Response } from 'express';
import { Collection, ObjectId } from 'mongodb';
import { RegisterModel } from '@models/AuthModel';
import { TokenService } from '@services/TokenService';
import { EmailService } from '@services/EmailService';
import { collection, Collections } from '@config/db';
import { env } from '@config/env';
import { User } from '@appTypes/user';
import { asyncHandler } from '@utils/asyncHandler';
import { setRefreshCookie } from '@utils/cookie';

interface RegisterActivePayload {
  user: ReturnType<RegisterModel['toResponse']>;
  accessToken: string;
}

interface RegisterPendingVerificationPayload {
  user: ReturnType<RegisterModel['toResponse']>;
  message: string;
}

/**
 * Handles `POST /api/auth/register`.
 *
 * Flow branches on `EMAIL_VERIFICATION_ENABLED`:
 *  - false (default): create user with status='active', issue tokens, log in.
 *  - true:            create user with status='inactive', send a verification
 *                     email, respond with `{ user, message }` (no tokens,
 *                     no cookie). The user has to click the link in the
 *                     email to become active and then log in normally.
 *
 * In both cases the response is 201 Created.
 */
export class RegisterController {
  private readonly model = new RegisterModel();

  private get collection(): Collection<User> {
    return collection<User>(Collections.Users);
  }

  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const doc = await this.model.build(input);
    const result = await this.collection.insertOne(doc);
    const stored = { ...doc, _id: result.insertedId };
    const userResponse = this.model.toResponse(stored);

    if (env.EMAIL_VERIFICATION_ENABLED) {
      await this.handlePendingVerification(result.insertedId, userResponse, res);
      return;
    }
    await this.handleActiveRegistration(result.insertedId, userResponse, req, res);
  });

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async handleActiveRegistration(
    userId: ObjectId,
    userResponse: RegisterActivePayload['user'],
    req: Request,
    res: Response
  ): Promise<void> {
    const tokens = await this.issueTokensForUser(userId, req);
    setRefreshCookie(res, tokens.refreshToken, false);
    const payload: RegisterActivePayload = { user: userResponse, accessToken: tokens.accessToken };
    res.status(201).json({ ok: true, data: payload });
  }

  private async handlePendingVerification(
    userId: ObjectId,
    userResponse: RegisterPendingVerificationPayload['user'],
    res: Response
  ): Promise<void> {
    const token = TokenService.issueEmailVerificationToken(userId);
    await EmailService.sendVerificationEmail(userResponse.email, token);
    const payload: RegisterPendingVerificationPayload = {
      user: userResponse,
      message: 'Account created. Check your email to verify and activate it.',
    };
    res.status(201).json({ ok: true, data: payload });
  }

  private async issueTokensForUser(
    userId: ObjectId,
    req: Request
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = TokenService.issueAccessToken(userId);
    const refresh = await TokenService.issueRefreshToken({
      userId,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });
    return { accessToken, refreshToken: refresh.rawToken };
  }
}
