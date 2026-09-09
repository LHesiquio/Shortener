/* eslint-disable no-console */
/**
 * Phase 6 smoke test: full email-verification flow.
 *
 *   npx tsx src/scripts/smoke-phase6.ts
 *
 * This script forces EMAIL_VERIFICATION_ENABLED=true and MAIL_TRANSPORT=console
 * via the _load-env-phase6 side-effect import, so it can run on top of the
 * regular `.env` without editing it.
 */
import './_load-env-phase6';

import http, { IncomingMessage } from 'http';
import { connect, close, collection, Collections, ensureIndexes } from '@config/db';
import { createApp } from '@/app';
import { User } from '@appTypes/user';
import { RefreshTokenRecord } from '@appTypes/jwt';
import { env } from '@config/env';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
let consoleBuffer = '';
let lastLink = '';

function assert(label: string, cond: boolean, extra?: unknown): void {
  if (cond) { passed += 1; console.log(`  ✅ ${label}`); }
  else { failed += 1; console.log(`  ❌ ${label}`); if (extra !== undefined) console.log('     extra:', JSON.stringify(extra)); }
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n▶ ${label}`);
  try { await fn(); } catch (err) { failed += 1; console.log(`  ❌ threw: ${err}`); }
}

// Patch console.log so we can scrape the verification link printed by
// EmailService/console without coupling the smoke to the exact wording.
const originalLog = console.log;
// eslint-disable-next-line no-console
console.log = (...args: unknown[]): void => {
  const text = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  consoleBuffer += text + '\n';
  const m = /link:\s*(\S+)/.exec(text);
  if (m && m[1]) lastLink = m[1];
  originalLog(...args);
};

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  sendCookies?: boolean;
  bearer?: string;
  rawCookie?: string;
}

interface HttpResponse {
  status: number;
  body: unknown;
  raw: IncomingMessage;
}

let baseUrl = '';
let serverHandle: http.Server | null = null;
let cookieJar: string[] = [];

function resetJar(): void { cookieJar = []; }

function upsertCookie(pair: string): void {
  const name = pair.split('=')[0];
  cookieJar = cookieJar.filter((existing) => !existing.startsWith(`${name}=`));
  if (!pair.endsWith('=')) cookieJar.push(pair);
}

function pushCookiesFrom(res: IncomingMessage): void {
  const raw = res.headers['set-cookie'];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [raw];
  for (const c of list) {
    const pair = c.split(';')[0];
    if (pair) upsertCookie(pair);
  }
}

function jarAsHeader(): string { return cookieJar.join('; '); }

function buildHeaders(opts: RequestOptions, data: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (data) headers['content-length'] = String(Buffer.byteLength(data));
  if (opts.rawCookie !== undefined) headers.cookie = opts.rawCookie;
  else if (opts.sendCookies !== false) headers.cookie = jarAsHeader();
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  return headers;
}

function performRequest(path: string, opts: RequestOptions, data: string | null): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        method: opts.method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: buildHeaders(opts, data),
      },
      (res) => {
        pushCookiesFrom(res);
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsed: unknown = text;
          try { if (text) parsed = JSON.parse(text); } catch { /* keep as text */ }
          resolve({ status: res.statusCode ?? 0, body: parsed, raw: res });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function request(path: string, opts: RequestOptions): Promise<HttpResponse> {
  const data = opts.body !== undefined ? JSON.stringify(opts.body) : null;
  return performRequest(path, opts, data);
}

// ---------------------------------------------------------------------------
// Server boot + cleanup
// ---------------------------------------------------------------------------

async function bootApp(): Promise<void> {
  await connect();
  await ensureIndexes();
  const app = createApp();
  const handle = app.listen(0, '127.0.0.1', () => undefined);
  serverHandle = handle;
  await new Promise<void>((resolve) => handle.once('listening', () => resolve()));
  const addr = handle.address();
  if (typeof addr !== 'object' || !addr) throw new Error('server did not bind');
  baseUrl = `http://127.0.0.1:${addr.port}`;
}

async function teardown(): Promise<void> {
  const handle = serverHandle;
  if (handle) await new Promise<void>((resolve) => handle.close(() => resolve()));
  await close();
}

async function cleanUser(email: string): Promise<void> {
  await collection<User>(Collections.Users).deleteMany({ email });
  await collection<RefreshTokenRecord>(Collections.RefreshTokens).deleteMany({});
}

// ---------------------------------------------------------------------------
// Step functions
// ---------------------------------------------------------------------------

async function stepRegisterSendsVerification(email: string, password: string, nick: string): Promise<void> {
  consoleBuffer = ''; lastLink = '';
  resetJar();
  const res = await request('/api/auth/register', {
    method: 'POST', body: { email, password, firstName: 'P6', lastName: 'Smoke', nickname: nick },
  });
  assert('201 Created', res.status === 201);
  const data = res.body as { data: { user: { status: string; email: string }; message?: string; accessToken?: string } };
  assert('user created', data?.data?.user?.email === email);
  assert('user.status === inactive', data?.data?.user?.status === 'inactive');
  assert('no accessToken issued', data?.data?.accessToken === undefined);
  assert('message present', typeof data?.data?.message === 'string');
  assert('no refresh cookie set', !cookieJar.some((c) => c.startsWith('refreshToken=')));
}

async function stepLoginInactiveRejected(email: string, password: string): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert('403', res.status === 403);
  const data = res.body as { error: { code: string } };
  assert('code ACCOUNT_INACTIVE', data?.error?.code === 'ACCOUNT_INACTIVE');
}

function tokenFromLink(link: string): string {
  const m = /[?&]token=([^&]+)/.exec(link);
  if (!m || !m[1]) throw new Error(`token not found in link: ${link}`);
  return decodeURIComponent(m[1]);
}

async function stepVerifyActivates(link: string): Promise<void> {
  const token = tokenFromLink(link);
  const res = await request('/api/auth/verify-email', { method: 'POST', body: { token } });
  assert('200', res.status === 200);
  const data = res.body as { data: { activated: boolean; userId: string } };
  assert('activated=true', data?.data?.activated === true);
}

async function stepVerifyIsIdempotent(link: string): Promise<void> {
  const token = tokenFromLink(link);
  const res = await request('/api/auth/verify-email', { method: 'POST', body: { token } });
  assert('200', res.status === 200);
  const data = res.body as { data: { alreadyActive: boolean } };
  assert('alreadyActive=true', data?.data?.alreadyActive === true);
}

async function stepLoginNowSucceeds(email: string, password: string): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert('200', res.status === 200);
  const data = res.body as { data: { accessToken: string; user: { status: string } } };
  assert('accessToken issued', typeof data?.data?.accessToken === 'string');
  assert('user.status === active', data?.data?.user?.status === 'active');
}

async function stepVerifyBadToken(): Promise<void> {
  const res = await request('/api/auth/verify-email', { method: 'POST', body: { token: 'not-a-jwt' } });
  assert('400', res.status === 400);
  const data = res.body as { error: { code: string } };
  assert('code INVALID_VERIFICATION', data?.error?.code === 'INVALID_VERIFICATION');
}

async function stepVerifyAccessTokenRejected(): Promise<void> {
  // A real access JWT has no `purpose` set → must be rejected.
  const jwt = await import('jsonwebtoken');
  const accessToken = jwt.default.sign({ sub: '6a54000000000000000000aa' }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
  const res = await request('/api/auth/verify-email', { method: 'POST', body: { token: accessToken } });
  assert('400', res.status === 400);
  const data = res.body as { error: { code: string } };
  assert('code INVALID_VERIFICATION', data?.error?.code === 'INVALID_VERIFICATION');
}

async function stepResendSendsNewLink(email: string): Promise<void> {
  consoleBuffer = ''; lastLink = '';
  const res = await request('/api/auth/resend-verification', { method: 'POST', body: { email } });
  assert('200', res.status === 200);
  assert('generic message', typeof (res.body as { data: { message: string } })?.data?.message === 'string');
  // Give the async EmailService a tick to flush to stdout
  await new Promise((r) => setTimeout(r, 50));
  assert('new link captured in console', /link:\s*http/.test(consoleBuffer), consoleBuffer);
  assert('link is well-formed', lastLink.startsWith(env.FRONTEND_BASE_URL));
}

async function stepResendNoUserIsGeneric(): Promise<void> {
  consoleBuffer = ''; lastLink = '';
  const res = await request('/api/auth/resend-verification', {
    method: 'POST', body: { email: 'no+such@example.com' },
  });
  assert('200 (no enumeration)', res.status === 200);
  await new Promise((r) => setTimeout(r, 50));
  assert('no link printed for unknown email', !/link:\s*http/.test(consoleBuffer));
}

async function stepResendBadEmail(): Promise<void> {
  const res = await request('/api/auth/resend-verification', { method: 'POST', body: { email: 'not-an-email' } });
  assert('400', res.status === 400);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Booting test server on a free port...');
  await bootApp();
  console.log(`Server up at ${baseUrl}`);
  console.log(`EMAIL_VERIFICATION_ENABLED=${env.EMAIL_VERIFICATION_ENABLED}  MAIL_TRANSPORT=${env.MAIL_TRANSPORT}`);

  const email = `phase6+${Date.now()}@example.com`;
  const password = 'CorrectHorseBattery9!';
  const nick = `phase6_${Date.now()}`;

  await step('register creates an inactive user + sends verification email', () => stepRegisterSendsVerification(email, password, nick));
  await step('login is rejected for inactive user', () => stepLoginInactiveRejected(email, password));
  await step('verify with the captured link activates the user', async () => {
    await new Promise((r) => setTimeout(r, 50));
    await stepVerifyActivates(lastLink);
  });
  await step('verify is idempotent (alreadyActive=true)', async () => { await stepVerifyIsIdempotent(lastLink); });
  await step('login now succeeds for the active user', () => stepLoginNowSucceeds(email, password));

  await step('verify with a malformed token → 400', () => stepVerifyBadToken());
  await step('verify with a regular access JWT → 400 (purpose guard)', () => stepVerifyAccessTokenRejected());

  // For the resend tests we need a *fresh* inactive user (the previous one
  // was activated above). Reuse the helper so we get a new email + link.
  const resendEmail = `phase6+resend+${Date.now()}@example.com`;
  const resendNick = `phase6_resend_${Date.now()}`;
  await step('seed an inactive user for the resend checks',
    () => stepRegisterSendsVerification(resendEmail, password, resendNick));
  await step('resend sends a new link to an existing inactive email',
    () => stepResendSendsNewLink(resendEmail).then(() => undefined));
  await step('resend is generic for unknown emails (no enumeration)', () => stepResendNoUserIsGeneric());
  await step('resend rejects malformed email → 400', () => stepResendBadEmail());

  await cleanUser(email);
  await teardown();

  console.log(`\n=========================`);
  console.log(`✅ ${passed} passed, ❌ ${failed} failed`);
  console.log(`=========================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('smoke-phase6 crashed:', err);
  process.exit(1);
});
