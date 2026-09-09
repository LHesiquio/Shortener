/* eslint-disable no-console */
/**
 * Phase 5 smoke test: full auth flow (register → login → me → refresh → me → logout).
 *
 *   npx tsx src/scripts/smoke-phase5.ts
 *
 * Assumes Mongo is running on $MONGO_URL and that LOGIN_RATE_LIMIT_MAX
 * is set high enough not to interfere (the dev .env sets it to 1000).
 */
import http, { IncomingMessage } from 'http';
import { connect, close, collection, Collections, ensureIndexes } from '@config/db';
import { createApp } from '@/app';
import { User } from '@appTypes/user';
import { RefreshTokenRecord } from '@appTypes/jwt';

// ---------------------------------------------------------------------------
// Tiny test harness (no extra deps)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${label}`);
    if (extra !== undefined) console.log('     extra:', JSON.stringify(extra));
  }
}

async function step(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n▶ ${label}`);
  try { await fn(); } catch (err) { failed += 1; console.log(`  ❌ threw: ${err}`); }
}

// ---------------------------------------------------------------------------
// HTTP client (no extra deps)
// ---------------------------------------------------------------------------

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  sendCookies?: boolean;
  bearer?: string;
  /** Override the cookie header sent with this request (skips the jar). */
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
          try { if (text) parsed = JSON.parse(text); } catch { /* leave as text */ }
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
// Server boot
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
// Step functions (each ≤ 40 lines, ≤ 5 complexity)
// ---------------------------------------------------------------------------

async function stepRegister(email: string, password: string, nick: string): Promise<string> {
  const res = await request('/api/auth/register', {
    method: 'POST', body: { email, password, firstName: 'Phase', lastName: 'Five', nickname: nick },
  });
  assert('201 Created', res.status === 201);
  const data = res.body as { data: { accessToken: string; user: { id: string; email: string; nickname: string } } };
  assert('has accessToken', typeof data?.data?.accessToken === 'string' && data.data.accessToken.length > 0);
  assert('user.email matches', data?.data?.user?.email === email);
  assert('user.id is set', typeof data?.data?.user?.id === 'string');
  assert('refresh cookie set', cookieJar.some((c) => c.startsWith('refreshToken=')));
  return data.data.accessToken;
}

async function stepLoginRemember(email: string, password: string): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', { method: 'POST', body: { email, password, remember: true } });
  assert('200 OK', res.status === 200);
  const setCookie = firstSetCookie(res);
  assert('remember=true → cookie has Max-Age', /Max-Age=\d{6,}/.test(setCookie), setCookie);
}

async function stepLoginFresh(email: string, password: string): Promise<string> {
  resetJar();
  const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert('login 200', res.status === 200);
  const data = res.body as { data: { accessToken: string } };
  return data.data.accessToken;
}

async function stepMeWithBearer(access: string, email: string, nick: string): Promise<void> {
  const res = await request('/api/auth/me', { method: 'GET', bearer: access, sendCookies: false });
  assert('200 OK', res.status === 200);
  const data = res.body as { data: { email: string; nickname: string } };
  assert('me.email matches', data?.data?.email === email);
  assert('me.nickname matches', data?.data?.nickname === nick);
}

async function stepMeWithoutBearer(): Promise<void> {
  const res = await request('/api/auth/me', { method: 'GET', sendCookies: false });
  assert('401', res.status === 401);
}

async function stepRefreshRotates(email: string, password: string): Promise<string> {
  await stepLoginFresh(email, password);
  const oldRefreshCookie = findRefreshCookie();
  const refRes = await request('/api/auth/refresh', { method: 'POST', body: { remember: false } });
  assert('refresh 200', refRes.status === 200);
  const newRefreshCookie = findRefreshCookie();
  assert('new refresh cookie differs from old', newRefreshCookie !== oldRefreshCookie);
  const data = refRes.body as { data: { accessToken: string } };
  const rotatedAccess = data.data.accessToken;

  // Replaying the old refresh cookie must fail
  const oldRes = await request('/api/auth/refresh', { method: 'POST', body: { remember: false }, rawCookie: oldRefreshCookie });
  assert('old refresh cookie is rejected', oldRes.status === 401);

  return rotatedAccess;
}

async function stepLogoutRevokes(): Promise<void> {
  const res = await request('/api/auth/logout', { method: 'POST' });
  assert('204 No Content', res.status === 204);
  const setCookie = firstSetCookie(res);
  assert('refresh cookie cleared', /refreshToken=;/.test(setCookie) || /Max-Age=0/i.test(setCookie), setCookie);
}

async function stepLoginWrongPassword(email: string, correctPassword: string): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', { method: 'POST', body: { email, password: 'wrongPassword99' } });
  assert('401', res.status === 401);
  const data = res.body as { error: { code: string } };
  assert('code INVALID_CREDENTIALS', data?.error?.code === 'INVALID_CREDENTIALS');
  void correctPassword;
}

async function stepLoginNoUser(): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', {
    method: 'POST', body: { email: 'no+such@example.com', password: 'whatever1234' },
  });
  assert('401', res.status === 401);
  const data = res.body as { error: { code: string } };
  assert('same error code', data?.error?.code === 'INVALID_CREDENTIALS');
}

async function stepLoginBadPayload(): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', {
    method: 'POST', body: { email: 'not-an-email', password: 'short' },
  });
  assert('400', res.status === 400);
}

async function stepSessionCookie(email: string, password: string): Promise<void> {
  resetJar();
  const res = await request('/api/auth/login', {
    method: 'POST', body: { email, password, remember: false },
  });
  assert('200', res.status === 200);
  const setCookie = firstSetCookie(res);
  assert('no Max-Age', !/Max-Age=/.test(setCookie), setCookie);
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function firstSetCookie(res: HttpResponse): string {
  const raw = res.raw.headers['set-cookie'];
  if (!raw) return '';
  return Array.isArray(raw) ? (raw[0] ?? '') : raw;
}

function findRefreshCookie(): string {
  return cookieJar.find((c) => c.startsWith('refreshToken=')) ?? '';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Booting test server on a free port...');
  await bootApp();
  console.log(`Server up at ${baseUrl}`);

  const email = `phase5+${Date.now()}@example.com`;
  const password = 'CorrectHorseBattery9!';
  const nick = `phase5_${Date.now()}`;

  await step('register creates a user and returns tokens',
    () => stepRegister(email, password, nick).then(() => undefined));

  await step('login with remember=true persists cookie', () => stepLoginRemember(email, password));
  await step('GET /me with the access token',
    async () => { const a = await stepLoginFresh(email, password); await stepMeWithBearer(a, email, nick); });
  await step('GET /me without bearer → 401', () => stepMeWithoutBearer());

  let rotatedAccess = '';
  await step('POST /refresh rotates the token', async () => { rotatedAccess = await stepRefreshRotates(email, password); });
  await step('GET /me with rotated access token',
    () => stepMeWithBearer(rotatedAccess, email, nick));

  await step('POST /logout revokes the refresh cookie', () => stepLogoutRevokes());
  await step('login with wrong password → 401', () => stepLoginWrongPassword(email, password));
  await step('login with non-existent user → 401 (no enumeration)', () => stepLoginNoUser());
  await step('login with bad payload → 400', () => stepLoginBadPayload());
  await step('remember=false → session cookie (no Max-Age)', () => stepSessionCookie(email, password));

  await cleanUser(email);
  await teardown();

  console.log(`\n=========================`);
  console.log(`✅ ${passed} passed, ❌ ${failed} failed`);
  console.log(`=========================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('smoke-phase5 crashed:', err);
  process.exit(1);
});
