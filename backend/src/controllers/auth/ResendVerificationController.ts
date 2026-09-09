import { Request, Response } from 'express';
import { z } from 'zod';
import { collection, Collections } from '@config/db';
import { User } from '@appTypes/user';
import { TokenService } from '@services/TokenService';
import { EmailService } from '@services/EmailService';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

const resendSchema = z.object({ email: z.string().email().max(120) });

/**
 * Handles `POST /api/auth/resend-verification`.
 *
 * Always responds 200 with a generic success message regardless of
 * whether the email exists — this prevents user enumeration. When the
 * user does exist and is still inactive, a new verification email is
 * queued (invalidating any previous token since it carries the same
 * userId but a fresh `iat` / `exp`).
 */
export class ResendVerificationController {
  public resend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = this.parseBody(req);
    const user = await collection<User>(Collections.Users).findOne({ email });
    if (user && user.status === 'inactive') {
      const token = TokenService.issueEmailVerificationToken(user._id!);
      await EmailService.sendVerificationEmail(user.email, token);
    }
    res.status(200).json({
      ok: true,
      data: { message: 'If the account exists and is unverified, a new email has been sent.' },
    });
  });

  private parseBody(req: Request): { email: string } {
    const result = resendSchema.safeParse(req.body ?? {});
    if (!result.success) {
      throw new ApiError(400, 'Invalid request: valid email is required', 'VALIDATION_ERROR');
    }
    return result.data;
  }
}
