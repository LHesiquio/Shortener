import { Request, Response } from 'express';
import { ObjectId, WithId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { User, PublicUser } from '@appTypes/user';
import { TokenService } from '@services/TokenService';
import { PasswordService } from '@services/PasswordService';
import { TwoFactorService } from '@services/TwoFactorService';
import {
  TwoFactorConfirmModel,
  TwoFactorDisableModel,
  TwoFactorChallengeModel,
  TwoFactorChallengeInput,
  TwoFactorRegenerateCodesModel,
  LoginModel,
} from '@models/AuthModel';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { setRefreshCookie } from '@utils/cookie';

function getUserCollection() {
  return collection<User>(Collections.Users);
}

function extractUserId(req: Request): ObjectId {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
  }
  return new ObjectId(id);
}

async function fetchUserById(userId: ObjectId): Promise<WithId<User>> {
  const user = await getUserCollection().findOne({ _id: userId });
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return user;
}

function verifyTotpAgainstUserSecret(encryptedSecret: string, code: string): void {
  const plainSecret = TwoFactorService.decryptSecret(encryptedSecret);
  const isValid = TwoFactorService.verifyTotp(plainSecret, code);
  if (!isValid) {
    throw new ApiError(401, 'Invalid authentication code. Please check and try again.', 'INVALID_2FA_CODE');
  }
}

async function consumeBackupCodeIfPresent(userId: ObjectId, backupCode: string, existingCodes: string[] = []): Promise<void> {
  const hashed = TwoFactorService.hashBackupCode(backupCode);
  const exists = existingCodes.includes(hashed);
  if (!exists) {
    throw new ApiError(401, 'Invalid backup recovery code.', 'INVALID_BACKUP_CODE');
  }
  const remainingCodes = existingCodes.filter((code) => code !== hashed);
  await getUserCollection().updateOne(
    { _id: userId },
    { $set: { twoFactorBackupCodes: remainingCodes, updatedAt: new Date() } }
  );
}

function assertTwoFactorIsActive(user: WithId<User>): void {
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new ApiError(400, 'Two-factor authentication is not active for this account', '2FA_NOT_ACTIVE');
  }
}

async function verifyChallengeCandidate(user: WithId<User>, input: TwoFactorChallengeInput): Promise<void> {
  if (input.code) {
    verifyTotpAgainstUserSecret(user.twoFactorSecret!, input.code);
    return;
  }
  if (input.backupCode) {
    await consumeBackupCodeIfPresent(user._id, input.backupCode, user.twoFactorBackupCodes);
  }
}

async function issueTokensAndSetCookie(
  res: Response,
  user: WithId<User>,
  req: Request,
  remember: boolean
): Promise<string> {
  const accessToken = TokenService.issueAccessToken(user._id);
  const refresh = await TokenService.issueRefreshToken({
    userId: user._id,
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.ip ?? null,
  });
  setRefreshCookie(res, refresh.rawToken, remember);
  return accessToken;
}

export class TwoFactorController {
  private readonly confirmModel = new TwoFactorConfirmModel();
  private readonly disableModel = new TwoFactorDisableModel();
  private readonly challengeModel = new TwoFactorChallengeModel();
  private readonly regenerateModel = new TwoFactorRegenerateCodesModel();
  private readonly loginModel = new LoginModel();

  /**
   * Generates a new 2FA secret, stores it as temp on user, and returns QR code.
   * `POST /api/auth/2fa/setup` (Protected)
   */
  public setup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req);
    const user = await fetchUserById(userId);
    const { secret, otpauthUrl } = TwoFactorService.generateSecret(user.email);
    const qrCodeDataUrl = await TwoFactorService.generateQrCode(otpauthUrl);
    const encryptedSecret = TwoFactorService.encryptSecret(secret);

    await getUserCollection().updateOne(
      { _id: userId },
      { $set: { twoFactorTempSecret: encryptedSecret, updatedAt: new Date() } }
    );

    res.status(200).json({
      ok: true,
      data: { secret, qrCodeDataUrl, otpauthUrl },
    });
  });

  /**
   * Confirms 6-digit TOTP code, activates 2FA and returns unhashed backup codes.
   * `POST /api/auth/2fa/confirm` (Protected)
   */
  public confirm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req);
    const input = this.confirmModel.validate(this.confirmModel.extractFromRequest(req));
    const user = await fetchUserById(userId);

    if (!user.twoFactorTempSecret) {
      throw new ApiError(400, 'No pending 2FA setup found. Please start setup first.', 'NO_PENDING_2FA');
    }

    verifyTotpAgainstUserSecret(user.twoFactorTempSecret, input.code);

    const { plainCodes, hashedCodes } = TwoFactorService.generateBackupCodes(8);

    await getUserCollection().updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorSecret: user.twoFactorTempSecret,
          twoFactorTempSecret: null,
          twoFactorBackupCodes: hashedCodes,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      ok: true,
      data: { backupCodes: plainCodes },
    });
  });

  /**
   * Disables 2FA upon verifying current password.
   * `POST /api/auth/2fa/disable` (Protected)
   */
  public disable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req);
    const input = this.disableModel.validate(this.disableModel.extractFromRequest(req));
    const user = await fetchUserById(userId);

    const isPasswordValid = await PasswordService.compare(input.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    await getUserCollection().updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorTempSecret: null,
          twoFactorBackupCodes: [],
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      ok: true,
      data: { message: 'Two-factor authentication has been disabled successfully' },
    });
  });

  /**
   * Completes login by verifying 2FA challenge token with TOTP or backup code.
   * `POST /api/auth/2fa/challenge` (Public, Rate-limited)
   */
  public challenge = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = this.challengeModel.validate(this.challengeModel.extractFromRequest(req));
    const { userId, remember } = TokenService.verifyMfaChallengeToken(input.mfaToken);
    const user = await fetchUserById(userId);

    assertTwoFactorIsActive(user);
    await verifyChallengeCandidate(user, input);

    const accessToken = await issueTokensAndSetCookie(res, user, req, remember);
    const publicUser: PublicUser = this.loginModel.toResponse(user);

    res.status(200).json({
      ok: true,
      data: {
        user: publicUser,
        accessToken,
      },
    });
  });

  /**
   * Regenerates a new batch of backup recovery codes after password check.
   * `POST /api/auth/2fa/backup-codes/regenerate` (Protected)
   */
  public regenerateBackupCodes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req);
    const input = this.regenerateModel.validate(this.regenerateModel.extractFromRequest(req));
    const user = await fetchUserById(userId);

    if (!user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-factor authentication is not enabled', '2FA_NOT_ACTIVE');
    }

    const isPasswordValid = await PasswordService.compare(input.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    const { plainCodes, hashedCodes } = TwoFactorService.generateBackupCodes(8);

    await getUserCollection().updateOne(
      { _id: userId },
      { $set: { twoFactorBackupCodes: hashedCodes, updatedAt: new Date() } }
    );

    res.status(200).json({
      ok: true,
      data: { backupCodes: plainCodes },
    });
  });
}
