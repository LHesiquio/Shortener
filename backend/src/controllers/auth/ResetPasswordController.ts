import { Request, Response } from 'express';
import { collection, Collections } from '@config/db';
import { User } from '@appTypes/user';
import { ResetPasswordModel } from '@models/AuthModel';
import { TokenService } from '@services/TokenService';
import { PasswordService } from '@services/PasswordService';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Handles `POST /api/auth/reset-password`.
 *
 * Verifies the password-reset JWT token, hashes the new password,
 * updates the user document in MongoDB, and revokes all active refresh tokens.
 */
export class ResetPasswordController {
  private resetPasswordModel = new ResetPasswordModel();

  public resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawInput = this.resetPasswordModel.extractFromRequest(req);
    const { token, password } = this.resetPasswordModel.validate(rawInput);

    const userId = TokenService.verifyPasswordResetToken(token);
    const users = collection<User>(Collections.Users);
    const user = await users.findOne({ _id: userId });

    if (!user) {
      throw new ApiError(404, 'User account not found', 'USER_NOT_FOUND');
    }

    const passwordHash = await PasswordService.hash(password);
    await users.updateOne(
      { _id: userId },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    // Invalidate all existing refresh tokens/sessions for security
    await TokenService.revokeAllForUser(userId);

    res.status(200).json({
      ok: true,
      data: { message: 'Password has been reset successfully. You can now log in.' },
    });
  });
}
