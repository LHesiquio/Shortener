import 'dotenv/config';
import { z } from 'zod';

/**
 * Validates and exposes environment variables.
 *
 * The application must fail fast at boot if the environment is misconfigured,
 * so we throw on the first missing or invalid variable rather than silently
 * falling back to unsafe defaults.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),

  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((origin) => origin.trim())),

  MONGO_URL: z.string().url(),
  MONGO_DB: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  REMEMBER_REFRESH_MAX_AGE_MS: z.coerce.number().int().positive().default(2_592_000_000),

  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW: z.string().default('15m'),

  EMAIL_VERIFICATION_ENABLED: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((value) => value === 'true'),

  EMAIL_VERIFICATION_TTL: z.string().default('24h'),

  /**
   * Base URL of the front-end, used to build the link in the verification
   * email. Example: http://localhost:5173
   */
  FRONTEND_BASE_URL: z.string().url().default('http://localhost:5173'),

  /**
   * 'console' (dev) prints the email to stdout. 'smtp' (prod) is a stub
   * for now — when you wire real SMTP later, only the transport changes.
   */
  MAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().email().default('no-reply@shortlinks.local'),

  BCRYPT_COST: z.coerce.number().int().min(8).max(15).default(12),

  // ===== Shortlinks =====
  /** Public base URL of the front-end, used in the shortlink response. */
  SHORTLINK_BASE_URL: z.string().url().default('http://localhost:5173'),
  SHORTLINK_SLUG_MIN: z.coerce.number().int().min(1).default(3),
  SHORTLINK_SLUG_MAX: z.coerce.number().int().min(1).default(32),
  SHORTLINK_DEFAULT_RANDOM_LEN: z.coerce.number().int().min(4).max(32).default(8),
  SHORTLINK_RESERVED_SLUGS: z
    .string()
    .default('api,admin,r,login,register,me,health,verify-email,resend-verification,logout,refresh,docs,assets,static,favicon.ico,_next,robots.txt,sitemap.xml')
    .transform((v) => v.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)),
  /** When true, refuse to shorten URLs pointing at private/loopback IPs. */
  SHORTLINK_BLOCK_PRIVATE_HOSTS: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  /** TTL for click records. Default 0 = keep forever. Format: ms as string. */
  SHORTLINK_CLICK_TTL_MS: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;