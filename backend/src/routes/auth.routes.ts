import { Router } from 'express';
import { RegisterController } from '@controllers/auth/RegisterController';
import { LoginController } from '@controllers/auth/LoginController';
import { RefreshController } from '@controllers/auth/RefreshController';
import { LogoutController } from '@controllers/auth/LogoutController';
import { MeController } from '@controllers/auth/MeController';
import { VerifyEmailController } from '@controllers/auth/VerifyEmailController';
import { ResendVerificationController } from '@controllers/auth/ResendVerificationController';
import { ProfileController } from '@controllers/auth/ProfileController';
import { ChangePasswordController } from '@controllers/auth/ChangePasswordController';
import { DeactivateAccountController } from '@controllers/auth/DeactivateAccountController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { createLoginRateLimit, createResendRateLimit } from '@middlewares/rateLimit';

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

/**
 * The login / resend rate limits are factories so tests can pass
 * permissive overrides when mounting the routes. By default they read env.
 */
const loginRateLimit = createLoginRateLimit();
const resendRateLimit = createResendRateLimit();

// Public — auth
router.post('/register', registerController.register);
router.post('/login', loginRateLimit, loginController.login);
router.post('/refresh', refreshController.refresh);
router.post('/logout', logoutController.logout);

// Public — email verification
router.post('/verify-email', verifyEmailController.verify);
router.post('/resend-verification', resendRateLimit, resendController.resend);

// Protected
router.get('/me', authMiddleware, meController.me);
router.patch('/profile', authMiddleware, profileController.updateProfile);
router.post('/change-password', authMiddleware, changePasswordController.changePassword);
router.post('/deactivate', authMiddleware, deactivateAccountController.deactivate);

export { router as authRouter };
