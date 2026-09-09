/**
 * Side-effect import that flips EMAIL_VERIFICATION_ENABLED on for the
 * Phase 6 smoke. The smoke imports this file BEFORE any other module so
 * `dotenv.config` runs first and overrides whatever was loaded from
 * `.env` (or sets it from scratch if a dedicated `.env.phase6` exists).
 */
import dotenv from 'dotenv';
import path from 'path';

// 1) Load the base .env so other env vars (Mongo URL, secrets, etc.) are set.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// 2) Then overlay .env.phase6 if it exists, with override so we can flip
//    EMAIL_VERIFICATION_ENABLED without editing the main .env file.
dotenv.config({ path: path.resolve(process.cwd(), '.env.phase6'), override: true });
// 3) Always force these on for the smoke, regardless of any .env file.
process.env.EMAIL_VERIFICATION_ENABLED = 'true';
process.env.MAIL_TRANSPORT = 'console';
process.env.LOGIN_RATE_LIMIT_MAX = '1000';
process.env.RESEND_VERIFICATION_RATE_LIMIT_MAX = process.env.RESEND_VERIFICATION_RATE_LIMIT_MAX ?? '1000';
