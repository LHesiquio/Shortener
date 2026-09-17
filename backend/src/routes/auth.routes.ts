import { Router } from 'express';
import { RegisterController } from '@controllers/auth/RegisterController';
import { LoginController } from '@controllers/auth/LoginController';
import { RefreshController } from '@controllers/auth/RefreshController';
import { LogoutController } from '@controllers/auth/LogoutController';
import { MeController } from '@controllers/auth/MeController';
import { VerifyEmailController } from '@controllers/auth/VerifyEmailController';
import { ResendVerificationController } from '@controllers/auth/ResendVerificationController';
import { ForgotPasswordController } from '@controllers/auth/ForgotPasswordController';
import { ResetPasswordController } from '@controllers/auth/ResetPasswordController';
import { ProfileController } from '@controllers/auth/ProfileController';
import { ChangePasswordController } from '@controllers/auth/ChangePasswordController';
import { DeactivateAccountController } from '@controllers/auth/DeactivateAccountController';
import { TwoFactorController } from '@controllers/auth/TwoFactorController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { createLoginRateLimit, createResendRateLimit, createTwoFactorRateLimit } from '@middlewares/rateLimit';

const router = Router();
const registerController = new RegisterController();
const loginController = new LoginController();
const refreshController = new RefreshController();
const logoutController = new LogoutController();
const meController = new MeController();
const profileController = new ProfileController();
const changePasswordController = new ChangePasswordController();
const deactivateAccountController = new DeactivateAccountController();
const verifyEmailController = new VerifyEmailController();
const resendController = new ResendVerificationController();
const forgotPasswordController = new ForgotPasswordController();
const resetPasswordController = new ResetPasswordController();
const twoFactorController = new TwoFactorController();

/**
 * The login / resend / 2fa rate limits are factories so tests can pass
 * permissive overrides when mounting the routes. By default they read env.
 */
const loginRateLimit = createLoginRateLimit();
const resendRateLimit = createResendRateLimit();
const twoFactorRateLimit = createTwoFactorRateLimit();

// Public — auth
router.post('/register', registerController.register);
router.post('/login', loginRateLimit, loginController.login);
router.post('/refresh', refreshController.refresh);
router.post('/logout', logoutController.logout);
router.post('/2fa/challenge', twoFactorRateLimit, twoFactorController.challenge);

// Public — email verification & recovery
router.post('/verify-email', verifyEmailController.verify);
router.post('/resend-verification', resendRateLimit, resendController.resend);
router.post('/forgot-password', resendRateLimit, forgotPasswordController.forgotPassword);
router.post('/reset-password', resendRateLimit, resetPasswordController.resetPassword);

// Protected
router.get('/me', authMiddleware, meController.me);
router.patch('/profile', authMiddleware, profileController.updateProfile);
router.post('/change-password', authMiddleware, changePasswordController.changePassword);
router.post('/deactivate', authMiddleware, deactivateAccountController.deactivate);

// Protected — Two-Factor Authentication
router.post('/2fa/setup', authMiddleware, twoFactorController.setup);
router.post('/2fa/confirm', authMiddleware, twoFactorRateLimit, twoFactorController.confirm);
router.post('/2fa/disable', authMiddleware, twoFactorController.disable);
router.post('/2fa/backup-codes/regenerate', authMiddleware, twoFactorController.regenerateBackupCodes);

export { router as authRouter };
