import { Request, Response } from 'express';
import { z } from 'zod';
import { collection, Collections } from '@config/db';
import { User } from '@appTypes/user';
import { TokenService } from '@services/TokenService';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

const verifySchema = z.object({ token: z.string().min(1) });

/**
 * Handles `POST /api/auth/verify-email`.
 *
 * Body: `{ token }` — the JWT minted when the user was registered (or
 * when they asked for a resend). On success the user's status is set
 * to 'active' and we respond with 200. The token is single-use in
 * spirit: replaying it after activation is a no-op (200, already active).
 */
export class VerifyEmailController {
  public verify = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = this.extractToken(req);
    const userId = TokenService.verifyEmailVerificationToken(token);
    const users = collection<User>(Collections.Users);
    const user = await users.findOne({ _id: userId });
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }
    if (user.status === 'active') {
      res.status(200).json({ ok: true, data: { alreadyActive: true, userId: userId.toHexString() } });
      return;
    }
    await users.updateOne(
      { _id: userId, status: 'inactive' },
      { $set: { status: 'active', updatedAt: new Date() } }
    );
    res.status(200).json({ ok: true, data: { activated: true, userId: userId.toHexString() } });
  });

  private extractToken(req: Request): string {
    const result = verifySchema.safeParse(req.body ?? {});
    if (!result.success) {
      throw new ApiError(400, 'Invalid request: token is required', 'VALIDATION_ERROR');
    }
    return result.data.token;
  }
}
