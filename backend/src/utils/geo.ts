import type { Request } from 'express';
import { createHash } from 'crypto';

export interface ParsedDevice {
  type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  os: string | null;
  browser: string | null;
  model: string | null;
}

export interface ParsedGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  postalCode: string | null;
  isp: string | null;
  timezone: string | null;
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

const IP_HEADERS = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'] as const;

/**
 * Best-effort client IP extraction. Honors proxy headers
 * (`cf-connecting-ip`, `x-real-ip`, `x-forwarded-for`) and falls back to `req.ip`.
 */
export function extractClientIp(req: Request): string | null {
  const fromHeader = readIpFromHeaders(req);
  if (fromHeader) return fromHeader;
  return req.ip ?? null;
}

function readIpFromHeaders(req: Request): string | null {
  for (const header of IP_HEADERS) {
    const value = req.headers[header];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (header === 'x-forwarded-for') return firstFromList(trimmed);
    return trimmed;
  }
  return null;
}

function firstFromList(value: string): string | null {
  const first = value.split(',')[0]?.trim();
  return first ?? null;
}

/** Stable, non-reversible hash of an IP for analytics without storing PII. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function isLocalOrPrivateIp(ip: string | null): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '');
  if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;

  const parts = clean.split('.').map((p) => Number(p));
  if (parts.length === 4) {
    const [a, b] = parts as [number, number, number, number];
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Geo extraction (CDN headers first, fallback to IP Geolocation API)
// ---------------------------------------------------------------------------

const COUNTRY_HEADERS = ['x-user-country', 'cf-ipcountry', 'x-vercel-ip-country', 'fastly-geo-country'] as const;
const REGION_HEADERS  = ['x-user-region', 'cf-region', 'cf-region-code', 'x-vercel-ip-country-region', 'fastly-geo-region'] as const;
const CITY_HEADERS    = ['x-user-city', 'cf-ipcity', 'x-vercel-ip-city', 'fastly-geo-city'] as const;

export function extractGeoFromHeaders(req: Request): ParsedGeo {
  return {
    country: readHeader(req, COUNTRY_HEADERS)?.toUpperCase() ?? null,
    region:  readHeader(req, REGION_HEADERS) ?? null,
    city:    readHeader(req, CITY_HEADERS) ?? null,
    lat: null,
    lon: null,
    postalCode: null,
    isp: null,
    timezone: null,
  };
}

function readHeader(req: Request, names: readonly string[]): string | null {
  for (const name of names) {
    const value = firstNonEmpty(req.headers[name]);
    if (value) return value;
  }
  return null;
}

function firstNonEmpty(value: string | string[] | undefined): string | null {
  const raw = extractFirstString(value);
  return raw === null ? null : (raw.trim() || null);
}

function extractFirstString(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

/**
 * Resolves Geolocation asynchronously:
 * 1. Reads proxy/CDN headers if available.
 * 2. If headers are absent, fetches IP Geolocation from ip-api.com API.
 * 3. Captures coordinates (lat/lon), city, region, postalCode, ISP, and timezone.
 */
export async function resolveGeo(req: Request, ip: string | null): Promise<ParsedGeo> {
  const fromHeaders = extractGeoFromHeaders(req);

  try {
    const cleanIp = ip ? ip.replace(/^::ffff:/, '') : '';
    const queryIp = isLocalOrPrivateIp(cleanIp) ? '' : cleanIp;
    const url = `http://ip-api.com/json/${queryIp}?fields=status,countryCode,country,regionName,city,zip,lat,lon,timezone,isp`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        countryCode?: string;
        country?: string;
        regionName?: string;
        city?: string;
        zip?: string;
        lat?: number;
        lon?: number;
        timezone?: string;
        isp?: string;
      };

      if (data.status === 'success') {
        return {
          country: fromHeaders.country ?? data.countryCode ?? data.country ?? 'Unknown',
          region: fromHeaders.region ?? data.regionName ?? null,
          city: fromHeaders.city ?? data.city ?? null,
          lat: typeof data.lat === 'number' ? data.lat : null,
          lon: typeof data.lon === 'number' ? data.lon : null,
          postalCode: data.zip ?? null,
          isp: data.isp ?? null,
          timezone: data.timezone ?? null,
        };
      }
    }
  } catch (err) {
    console.warn('[geo] IP geolocation lookup fallback error:', err);
  }

  return {
    country: fromHeaders.country ?? 'Unknown',
    region: fromHeaders.region ?? null,
    city: fromHeaders.city ?? null,
    lat: null,
    lon: null,
    postalCode: null,
    isp: null,
    timezone: null,
  };
}

// ---------------------------------------------------------------------------
// User-Agent parsing
// ---------------------------------------------------------------------------

const BOT_RE = /\b(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|embedly|preview|monitor|curl|wget|axios|node-fetch|python-requests)\b/i;
const MOBILE_RE = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i;
const TABLET_RE = /ipad|tablet|kindle|playbook|silk/i;

interface OsMatch { re: RegExp; label: string; }
const OS_TABLE: readonly OsMatch[] = [
  { re: /windows nt 10/i, label: 'Windows 10/11' },
  { re: /windows nt 6\.3/i, label: 'Windows 8.1' },
  { re: /windows nt 6\.2/i, label: 'Windows 8' },
  { re: /windows nt 6\.1/i, label: 'Windows 7' },
  { re: /windows/i, label: 'Windows' },
  { re: /mac os x|macintosh/i, label: 'macOS' },
  { re: /iphone os|ipad os/i, label: 'iOS' },
  { re: /android/i, label: 'Android' },
  { re: /cros/i, label: 'ChromeOS' },
  { re: /linux/i, label: 'Linux' },
];

interface BrowserMatch { re: RegExp; label: string; }
const BROWSER_TABLE: readonly BrowserMatch[] = [
  { re: /edg\//i, label: 'Edge' },
  { re: /opr\/|opera/i, label: 'Opera' },
  { re: /chrome|crios/i, label: 'Chrome' },
  { re: /firefox|fxios/i, label: 'Firefox' },
  { re: /safari/i, label: 'Safari' },
  { re: /samsungbrowser/i, label: 'Samsung Internet' },
  { re: /duckduckgo/i, label: 'DuckDuckGo' },
];

function extractDeviceModel(ua: string): string | null {
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/macintosh|mac os x/i.test(ua)) return 'Mac';
  const androidModel = ua.match(/\b(SM-[A-Z0-9]+|Pixel\s[0-9a-zA-Z\s]+|Redmi\s[0-9a-zA-Z\s]+|POCO\s[0-9a-zA-Z\s]+|OnePlus\s[0-9a-zA-Z\s]+)\b/i);
  if (androidModel) return androidModel[1];
  if (/android/i.test(ua)) return 'Android Device';
  if (/windows/i.test(ua)) return 'PC / Windows';
  return null;
}

export function parseUserAgent(ua: string | null | undefined): ParsedDevice {
  if (!ua) return { type: 'unknown', os: null, browser: null, model: null };
  if (BOT_RE.test(ua)) return { type: 'bot', os: null, browser: null, model: 'Bot' };
  const type = TABLET_RE.test(ua) ? 'tablet' : MOBILE_RE.test(ua) ? 'mobile' : 'desktop';
  return {
    type,
    os: matchFirst(ua, OS_TABLE),
    browser: matchFirst(ua, BROWSER_TABLE),
    model: extractDeviceModel(ua),
  };
}

function matchFirst(ua: string, table: readonly { re: RegExp; label: string }[]): string | null {
  for (const entry of table) if (entry.re.test(ua)) return entry.label;
  return null;
}

// ---------------------------------------------------------------------------
// Aggregate "request snapshot" — what we persist on every click
// ---------------------------------------------------------------------------

export interface ClickSnapshot {
  ip: string | null;
  ipHash: string | null;
  userAgent: string | null;
  referer: string | null;
  acceptLanguage: string | null;
  device: ParsedDevice;
  geo: ParsedGeo;
}

export async function snapshotRequestAsync(req: Request): Promise<ClickSnapshot> {
  const ip = extractClientIp(req);
  const ua = pickHeaderString(req.headers['user-agent']);
  const ref = pickHeaderString(req.headers['referer'] ?? req.headers['referrer']);
  const lang = pickHeaderString(req.headers['accept-language']);
  const geo = await resolveGeo(req, ip);

  return {
    ip,
    ipHash: hashIp(ip),
    userAgent: ua,
    referer: ref,
    acceptLanguage: lang ? lang.split(',')[0]?.trim() ?? null : null,
    device: parseUserAgent(ua),
    geo,
  };
}

function pickHeaderString(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}
