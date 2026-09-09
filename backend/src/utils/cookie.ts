import type { Response } from 'express';
import { env } from '@config/env';

const COOKIE_NAME = 'refreshToken';
const COOKIE_PATH = '/api/auth';

function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Default cookie options shared by both set and clear.
 *
 * - `httpOnly` so the browser JS cannot read it (mitigates XSS theft).
 * - `sameSite=lax` so it travels on top-level navigations to /api/auth
 *   but is blocked on most cross-site CSRF.
 * - `path` is restricted to the auth namespace so it is not sent with
 *   unrelated requests.
 * - `secure` is enabled in production; left off in development so the
 *   cookie works on `http://localhost:5173` without HTTPS.
 */
function baseOptions(): {
  httpOnly: true;
  sameSite: 'lax';
  path: string;
  secure: boolean;
  maxAge?: number;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: COOKIE_PATH,
    secure: isProduction(),
  };
}

/**
 * Set the refresh-token cookie. When `remember` is true the cookie has
 * a long `maxAge` so it survives browser restarts (and the front can
 * call /refresh to extend the access JWT); otherwise it is a session
 * cookie that disappears when the browser closes.
 */
export function setRefreshCookie(
  res: Response,
  rawToken: string,
  remember: boolean
): void {
  const options = baseOptions();
  if (remember) {
    options.maxAge = env.REMEMBER_REFRESH_MAX_AGE_MS;
  }
  res.cookie(COOKIE_NAME, rawToken, options);
}

/**
 * Clear the refresh-token cookie. Mirrors the options used when setting
 * it (same path, sameSite, etc.) so the browser actually drops it.
 */
export function clearRefreshCookie(res: Response): void {
  const options = baseOptions();
  res.clearCookie(COOKIE_NAME, options);
}

/** Name of the cookie. Exposed for tests and the request helper. */
export const REFRESH_COOKIE_NAME = COOKIE_NAME;
