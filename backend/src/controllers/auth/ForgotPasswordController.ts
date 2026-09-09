import { Request, Response } from 'express';
import { collection, Collections } from '@config/db';
import { User } from '@appTypes/user';
import { ForgotPasswordModel } from '@models/AuthModel';
import { TokenService } from '@services/TokenService';
import { EmailService } from '@services/EmailService';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Handles `POST /api/auth/forgot-password`.
 *
 * Always responds 200 with a generic message to prevent user enumeration.
 * If the user exists and is active, a 1-hour password reset link is generated
 * and sent via email.
 */
export class ForgotPasswordController {
  private forgotPasswordModel = new ForgotPasswordModel();

  public forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawInput = this.forgotPasswordModel.extractFromRequest(req);
    const { email } = this.forgotPasswordModel.validate(rawInput);

    const user = await collection<User>(Collections.Users).findOne({ email });
    if (user && user.status === 'active') {
      const token = TokenService.issuePasswordResetToken(user._id!);
      await EmailService.sendPasswordResetEmail(user.email, token);
    }

    res.status(200).json({
      ok: true,
      data: { message: 'If an account exists with this email, a password reset link has been sent.' },
    });
  });
}
