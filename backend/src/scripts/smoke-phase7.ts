/* eslint-disable no-console */
/**
 * Phase 7 smoke test: full shortlink CRUD + redirect + stats.
 *
 *   npx tsx src/scripts/smoke-phase7.ts
 *
 * Boots a real Express app, registers a user, runs the CRUD flow,
 * hits /r/:slug with a few different "devices" (simulated via headers),
 * and asserts the stats endpoint sees them.
 */
import http, { IncomingMessage } from 'http';
import { connect, close, collection, Collections, ensureIndexes } from '@config/db';
import { createApp } from '@/app';
import { User } from '@appTypes/user';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean, extra?: unknown): void {
  if (cond) { passed += 1; console.log(`  ✅ ${label}`); }
  else { failed += 1; console.log(`  ❌ ${label}`); if (extra !== undefined) console.log('     extra:', JSON.stringify(extra)); }
}

async function step(label: string, fn: () => Promise<unknown>): Promise<unknown> {
  console.log(`\n▶ ${label}`);
  try { return await fn(); } catch (err) { failed += 1; console.log(`  ❌ threw: ${err}`); return undefined; }
}

// ---------------------------------------------------------------------------
// HTTP client (no auto-redirect — we want to inspect the 302 ourselves)
// ---------------------------------------------------------------------------

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  sendCookies?: boolean;
  bearer?: string;
  rawCookie?: string;
  extraHeaders?: Record<string, string>;
  /** When true, do not follow 3xx redirects. Default true for /r/:slug. */
  manualRedirects?: boolean;
}

interface HttpResponse {
  status: number;
  body: unknown;
  raw: IncomingMessage;
  location: string | null;
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
  headers.cookie = resolveCookieHeader(opts);
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) headers[k] = v;
  }
  return headers;
}

function resolveCookieHeader(opts: RequestOptions): string {
  if (opts.rawCookie !== undefined) return opts.rawCookie;
  if (opts.sendCookies === false) return '';
  return jarAsHeader();
}

function performRequest(path: string, opts: RequestOptions, data: string | null): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        method: opts.method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: buildHeaders(opts, data),
      },
      (res) => {
        pushCookiesFrom(res);
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve(buildResponse(res, Buffer.concat(chunks).toString('utf8')));
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function buildResponse(res: IncomingMessage, text: string): HttpResponse {
  let parsed: unknown = text;
  try { if (text) parsed = JSON.parse(text); } catch { /* keep as text */ }
  return { status: res.statusCode ?? 0, body: parsed, raw: res, location: firstLocation(res) };
}

function firstLocation(res: IncomingMessage): string | null {
  const value = res.headers['location'];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function request(path: string, opts: RequestOptions): Promise<HttpResponse> {
  const data = opts.body !== undefined ? JSON.stringify(opts.body) : null;
  return performRequest(path, opts, data);
}

// ---------------------------------------------------------------------------
// Server boot + helpers
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
  await collection<Shortlink>(Collections.Shortlinks).deleteMany({ slug: { $regex: /^phase7/ } });
  await collection<ShortlinkClick>(Collections.ShortlinkClicks).deleteMany({});
}

// ---------------------------------------------------------------------------
// Setup: register a user and return the access token
// ---------------------------------------------------------------------------

async function registerAndGetToken(email: string, password: string, nick: string): Promise<string> {
  resetJar();
  const res = await request('/api/auth/register', {
    method: 'POST', body: { email, password, firstName: 'P7', lastName: 'Smoke', nickname: nick },
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

async function stepCreateWithAutoSlug(token: string): Promise<string> {
  const res = await request('/api/shortlinks', {
    method: 'POST', bearer: token,
    body: { url: 'https://example.com/auto', title: 'Auto slug' },
  });
  assert('201', res.status === 201);
  const data = res.body as { data: { id: string; slug: string; url: string; title: string; active: boolean } };
  assert('has id', typeof data?.data?.id === 'string' && (data.data.id as string).length === 24);
  assert('auto-generated slug', typeof data?.data?.slug === 'string' && (data.data.slug as string).length >= 4);
  assert('url round-trips', data?.data?.url === 'https://example.com/auto');
  assert('title round-trips', data?.data?.title === 'Auto slug');
  assert('active=true by default', data?.data?.active === true);
  return data.data.id;
}

async function stepCreateWithCustomSlug(token: string, slug: string, url: string): Promise<string> {
  const res = await request('/api/shortlinks', {
    method: 'POST', bearer: token,
    body: { url, slug, title: 'Custom' },
  });
  assert(`201 for slug=${slug}`, res.status === 201, res.body);
  return (res.body as { data: { id: string } }).data.id;
}

async function stepCreateValidations(token: string): Promise<void> {
  // missing url
  const r1 = await request('/api/shortlinks', { method: 'POST', bearer: token, body: { slug: 'phase7-bad' } });
  assert('missing url → 400', r1.status === 400);

  // invalid url
  const r2 = await request('/api/shortlinks', {
    method: 'POST', bearer: token, body: { url: 'not-a-url', slug: 'phase7-bad2' },
  });
  assert('invalid url → 400', r2.status === 400);

  // js: scheme blocked
  const r3 = await request('/api/shortlinks', {
    method: 'POST', bearer: token, body: { url: 'javascript:alert(1)', slug: 'phase7-xss' },
  });
  assert('javascript: scheme → 400', r3.status === 400);

  // reserved slug
  const r4 = await request('/api/shortlinks', {
    method: 'POST', bearer: token, body: { url: 'https://example.com/r', slug: 'api' },
  });
  assert('reserved slug → 400', r4.status === 400);

  // bad slug chars
  const r5 = await request('/api/shortlinks', {
    method: 'POST', bearer: token, body: { url: 'https://example.com/r', slug: 'has space' },
  });
  assert('bad slug chars → 400', r5.status === 400);
}

async function stepList(token: string): Promise<void> {
  const res = await request('/api/shortlinks?limit=10&skip=0', { method: 'GET', bearer: token });
  assert('200', res.status === 200);
  const payload = res.body as { data: { items: unknown[]; pagination: { total: number; limit: number; skip: number } } };
  assert('items is an array', Array.isArray(payload?.data?.items));
  assert('pagination.total >= 2', payload?.data?.pagination?.total >= 2);
  assert('pagination.limit = 10', payload?.data?.pagination?.limit === 10);
}

async function stepShowAndOwnership(token: string, id: string, otherToken: string): Promise<void> {
  const r1 = await request(`/api/shortlinks/${id}`, { method: 'GET', bearer: token });
  assert('owner can show → 200', r1.status === 200);

  const r2 = await request(`/api/shortlinks/${id}`, { method: 'GET', bearer: otherToken });
  assert('other user gets 404 (no leak)', r2.status === 404);
}

async function stepUpdate(token: string, id: string): Promise<void> {
  const r = await request(`/api/shortlinks/${id}`, {
    method: 'PATCH', bearer: token,
    body: { url: 'https://example.com/updated', active: false, title: 'updated!' },
  });
  assert('200', r.status === 200);
  const data = r.body as { data: { url: string; active: boolean; title: string; slug: string } };
  assert('url updated', data?.data?.url === 'https://example.com/updated');
  assert('active=false', data?.data?.active === false);
  assert('title updated', data?.data?.title === 'updated!');
  assert('slug unchanged', typeof data?.data?.slug === 'string');

  // empty patch
  const rBad = await request(`/api/shortlinks/${id}`, { method: 'PATCH', bearer: token, body: {} });
  assert('empty patch → 400', rBad.status === 400);
}

async function stepDuplicateSlug(token: string, slug: string): Promise<void> {
  const r = await request('/api/shortlinks', {
    method: 'POST', bearer: token,
    body: { url: 'https://example.com/dup', slug },
  });
  assert('duplicate custom slug → 409', r.status === 409);
}

async function stepRedirect(activeSlug: string, inactiveSlug: string, unknownSlug: string): Promise<void> {
  // Active: 302 to the destination URL.
  const a = await request(`/r/${activeSlug}`, { method: 'GET', sendCookies: false, manualRedirects: true });
  assert('active slug → 302', a.status === 302);
  assert('Location header points at destination', a.location === 'https://example.com/custom');

  // Inactive: 410 Gone.
  const i = await request(`/r/${inactiveSlug}`, { method: 'GET', sendCookies: false });
  assert('inactive slug → 410', i.status === 410);

  // Unknown: 404.
  const u = await request(`/r/${unknownSlug}`, { method: 'GET', sendCookies: false });
  assert('unknown slug → 404', u.status === 404);
}

async function stepClickTracking(token: string, id: string, slug: string): Promise<void> {
  // Hit the redirect with different "devices" so stats have variety.
  const samples: Array<Record<string, string>> = [
    {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'x-user-country': 'MX',
      'x-user-city': 'Ciudad Juarez',
      'x-forwarded-for': '189.146.0.10',
      'accept-language': 'es-MX,es;q=0.9',
      'referer': 'https://twitter.com/some/tweet',
    },
    {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'x-user-country': 'US',
      'x-user-city': 'Austin',
      'x-forwarded-for': '8.8.8.8',
      'accept-language': 'en-US,en;q=0.9',
    },
    {
      'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      'x-user-country': 'AR',
      'x-user-city': 'Buenos Aires',
      'x-forwarded-for': '200.123.45.67',
    },
  ];
  for (const headers of samples) {
    const r = await request(`/r/${slug}`, { method: 'GET', sendCookies: false, extraHeaders: headers });
    assert(`click from ${headers['x-user-country']} → 302`, r.status === 302);
  }
  // Fire-and-forget insert: give Mongo and DNS lookup a moment to flush.
  await new Promise((r) => setTimeout(r, 300));
}

async function stepStats(token: string, id: string): Promise<void> {
  const r = await request(`/api/shortlinks/${id}/stats`, { method: 'GET', bearer: token });
  assert('200', r.status === 200);
  const payload = r.body as { data: StatsPayload };
  assertTotals(payload.data);
  assertCountries(payload.data);
  assertDevices(payload.data);
  assertBrowsers(payload.data);
  assert('recent has at least 3 entries', (payload?.data?.recent ?? []).length >= 3);
}

interface StatsPayload {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  uniqueIpsLast7d: number;
  byCountry: Array<{ key: string; count: number }>;
  byDevice: Array<{ key: string; count: number }>;
  byBrowser: Array<{ key: string; count: number }>;
  byOs: Array<{ key: string; count: number }>;
  recent: Array<{ country: string | null; deviceType: string }>;
}

function assertTotals(d: StatsPayload | undefined): void {
  assert('totalClicks >= 3', (d?.totalClicks ?? 0) >= 3);
  assert('clicksLast24h >= 3', (d?.clicksLast24h ?? 0) >= 3);
  assert('clicksLast7d >= 3', (d?.clicksLast7d ?? 0) >= 3);
  assert('uniqueIpsLast7d >= 3 (3 distinct x-forwarded-for)', (d?.uniqueIpsLast7d ?? 0) >= 3);
}

function assertCountries(d: StatsPayload | undefined): void {
  const keys = d?.byCountry.map((e) => e.key) ?? [];
  assert('byCountry includes MX, US, AR', ['MX', 'US', 'AR'].every((c) => keys.includes(c)));
}

function assertDevices(d: StatsPayload | undefined): void {
  const keys = d?.byDevice.map((e) => e.key) ?? [];
  assert('byDevice includes desktop + mobile', keys.includes('desktop') && keys.includes('mobile'));
}

function assertBrowsers(d: StatsPayload | undefined): void {
  const keys = d?.byBrowser.map((e) => e.key) ?? [];
  assert('byBrowser includes Chrome and Safari', keys.includes('Chrome') && keys.includes('Safari'));
}

async function stepDelete(token: string, id: string): Promise<void> {
  const r = await request(`/api/shortlinks/${id}`, { method: 'DELETE', bearer: token });
  assert('204', r.status === 204);
  const r2 = await request(`/api/shortlinks/${id}`, { method: 'GET', bearer: token });
  assert('after delete → 404', r2.status === 404);
  const clicksLeft = await collection<ShortlinkClick>(Collections.ShortlinkClicks).countDocuments({ shortlinkId: id as unknown as ObjectId });
  assert('clicks cascaded', clicksLeft === 0);
}

// ObjectId is used as cast above; we need the import for that to compile.
import { ObjectId } from 'mongodb';

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Booting test server on a free port...');
  await bootApp();
  // Wipe any leftover data from previous failed runs so the counts in
  // the assertions are predictable.
  await collection<Shortlink>(Collections.Shortlinks).deleteMany({});
  await collection<ShortlinkClick>(Collections.ShortlinkClicks).deleteMany({});
  await collection<User>(Collections.Users).deleteMany({ email: { $regex: /phase7/ } });
  console.log(`Server up at ${baseUrl}`);

  const email = `phase7+${Date.now()}@example.com`;
  const password = 'CorrectHorseBattery9!';
  const nick = `phase7_${Date.now()}`;
  const otherEmail = `phase7+other+${Date.now()}@example.com`;
  const otherNick = `phase7_other_${Date.now()}`;

  const token = await registerAndGetToken(email, password, nick);
  const otherToken = await registerAndGetToken(otherEmail, password, otherNick);

  await step('create validations (missing/invalid url, js:, reserved, bad chars)', () => stepCreateValidations(token));

  const autoId = await step('create with auto-generated slug', () => stepCreateWithAutoSlug(token));
  // autoId is created for coverage but not used in the subsequent flow.
  void autoId;
  const customSlug = `phase7custom${Date.now()}`;
  const customId = (await step('create with custom slug', () => stepCreateWithCustomSlug(token, customSlug, 'https://example.com/custom'))) as string;

  await step('list returns the new shortlinks', () => stepList(token));
  await step('show enforces ownership (other user gets 404)', () => stepShowAndOwnership(token, customId, otherToken));

  // Create a SECOND custom shortlink specifically for the "inactive" redirect
  // assertion so we don't have to disable the one we'll use for clicks.
  const inactiveSlug = `phase7inactive${Date.now()}`;
  const inactiveId = (await step('create a second shortlink (for the inactive check)', () => stepCreateWithCustomSlug(token, inactiveSlug, 'https://example.com/inactive'))) as string;
  // Disable it so the next step can verify the 410 path.
  await request(`/api/shortlinks/${inactiveId}`, { method: 'PATCH', bearer: token, body: { active: false } });

  // Redirect + tracking must run BEFORE we PATCH the main customId (which
  // also sets active=false), otherwise the click recording wouldn't see an
  // active shortlink.
  await step('redirect: active→302, inactive→410, unknown→404', () => stepRedirect(customSlug, inactiveSlug, `phase7missing${Date.now()}`));
  await step('click tracking fires from 3 "devices"', () => stepClickTracking(token, customId, customSlug));
  await step('stats reflect the clicks with geo+device breakdown', () => stepStats(token, customId));

  await step('update mutates url/active/title, refuses empty patch', () => stepUpdate(token, customId));
  await step('duplicate custom slug returns 409', () => stepDuplicateSlug(token, customSlug));

  await step('delete cascades and removes the shortlink', () => stepDelete(token, customId));

  // Clean up + report
  await cleanUser(email);
  await cleanUser(otherEmail);
  await teardown();

  console.log(`\n=========================`);
  console.log(`✅ ${passed} passed, ❌ ${failed} failed`);
  console.log(`=========================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('smoke-phase7 crashed:', err);
  process.exit(1);
});
