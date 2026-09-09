import bcrypt from 'bcrypt';
import { env } from '@config/env';

/**
 * Password hashing / verification.
 *
 * Uses bcrypt with a configurable cost factor (default 12). The cost lives in
 * env so we can dial it down in tests without touching code.
 *
 * We expose async-only methods because bcrypt's async API uses the libuv
 * thread pool and never blocks the event loop.
 */
export const PasswordService = {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_COST);
  },

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};