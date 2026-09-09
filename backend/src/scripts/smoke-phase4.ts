/* eslint-disable no-console */
/**
 * Phase 4 smoke test: POST /api/auth/register end-to-end.
 *
 *   npx ts-node src/scripts/smoke-phase4.ts
 *
 * Boots a real Express app on a random port, ensures indexes, runs a
 * sequence of HTTP assertions and cleans up the created user at the end.
 */
import http from 'http';
import { Server } from 'http';
import { connect, close, collection, Collections } from '@config/db';
import { createApp } from '@/app';
import { User } from '@appTypes/user';

interface HttpResponse { status: number; json: unknown; headers: Record<string, string | string[] | undefined>; }

function request(method: string, url: string, body?: unknown, cookies?: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        method,
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(cookies ? { Cookie: cookies } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed: unknown = raw;
          if (raw) {
            try { parsed = JSON.parse(raw); } catch { /* keep raw */ }
          }
          resolve({ status: res.statusCode ?? 0, json: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(label: string, cond: boolean, detail?: unknown): void {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`  FAIL ${label}`, detail ?? '');
    process.exitCode = 1;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getSetCookie(headers: HttpResponse['headers']): string | undefined {
  const v = headers['set-cookie'];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

interface StartedServer { base: string; close: () => Promise<void>; }

async function startServer(): Promise<StartedServer> {
  const app = createApp();
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.on('listening', () => r()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
}

const validBody: RegisterBody = {
  email: 'smoke-phase4@example.com',
  password: 'super-secret-123',
  firstName: 'Smoke',
  lastName: 'Tester',
  nickname: 'smokey',
};

async function stepInvalidBodies(base: string): Promise<void> {
  const r1 = await request('POST', `${base}/api/auth/register`, {});
  assert('POST /register with empty body -> 400', r1.status === 400);
  assert('  -> code is VALIDATION_ERROR', asRecord(asRecord(r1.json).error).code === 'VALIDATION_ERROR');

  const r2 = await request('POST', `${base}/api/auth/register`, { ...validBody, password: 'short' });
  assert('POST /register with short password -> 400', r2.status === 400);

  const r3 = await request('POST', `${base}/api/auth/register`, { ...validBody, nickname: 'has space!' });
  assert('POST /register with invalid nickname -> 400', r3.status === 400);
}

async function stepHappyPath(base: string): Promise<void> {
  const r = await request('POST', `${base}/api/auth/register`, validBody);
  assert('POST /register valid -> 201', r.status === 201);

  const data = asRecord(asRecord(r.json).data);
  const user = asRecord(data.user);
  const accessToken = data.accessToken;
  assertAccessToken(accessToken);
  assertUserShape(user);
  assertCookieShape(getSetCookie(r.headers));
}

function assertAccessToken(token: unknown): void {
  assert('  -> returns accessToken', typeof token === 'string' && (token as string).length > 20);
}

function assertUserShape(user: Record<string, unknown>): void {
  assert('  -> user.id is a string', typeof user.id === 'string' && (user.id as string).length === 24);
  assert('  -> user.email round-trips', user.email === validBody.email);
  assert('  -> user.nickname round-trips', user.nickname === validBody.nickname);
  assert('  -> user.firstName round-trips', user.firstName === validBody.firstName);
  assert('  -> user.lastName round-trips', user.lastName === validBody.lastName);
  assert('  -> user.status is active (verification disabled)', user.status === 'active');
  assert('  -> response does NOT leak passwordHash', user.passwordHash === undefined);
}

function assertCookieShape(setCookie: string | undefined): void {
  assert('  -> Set-Cookie header present', typeof setCookie === 'string');
  if (typeof setCookie !== 'string') return;
  assert('  -> cookie is httpOnly', setCookie.includes('HttpOnly'));
  assert('  -> cookie is named refreshToken', setCookie.startsWith('refreshToken='));
  assert('  -> cookie scoped to /api/auth', setCookie.includes('Path=/api/auth'));
  assert('  -> cookie SameSite=Lax', setCookie.includes('SameSite=Lax'));
}

async function stepDuplicates(base: string): Promise<void> {
  const r1 = await request('POST', `${base}/api/auth/register`, validBody);
  assert('POST /register duplicate email -> 409', r1.status === 409);
  assert('  -> code is EMAIL_TAKEN', asRecord(asRecord(r1.json).error).code === 'EMAIL_TAKEN');

  const r2 = await request('POST', `${base}/api/auth/register`, { ...validBody, email: 'other@example.com' });
  assert('POST /register duplicate nickname -> 409', r2.status === 409);
  assert('  -> code is NICKNAME_TAKEN', asRecord(asRecord(r2.json).error).code === 'NICKNAME_TAKEN');
}

async function stepPersistence(): Promise<void> {
  const stored = await collection<User>(Collections.Users).findOne({ email: validBody.email });
  assert('  -> user is persisted in Mongo', stored !== null);
  assert('  -> passwordHash starts with $2b$', Boolean(stored && (stored.passwordHash as string).startsWith('$2b$')));
  assert('  -> raw password NOT stored', stored !== null && !JSON.stringify(stored).includes(validBody.password));
}

async function main(): Promise<void> {
  await connect();
  await collection<User>(Collections.Users).deleteMany({ email: /smoke-phase4/ });
  const { base, close: closeServer } = await startServer();

  try {
    await stepInvalidBodies(base);
    await stepHappyPath(base);
    await stepDuplicates(base);
    await stepPersistence();
  } finally {
    await collection<User>(Collections.Users).deleteMany({ email: validBody.email });
    await collection(Collections.RefreshTokens).deleteMany({});
    await closeServer();
    await close();
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('SMOKE FAILED');
  } else {
    console.log('OK');
  }
}

main().catch((err) => {
  console.error('SMOKE CRASHED:', err);
  process.exit(1);
});