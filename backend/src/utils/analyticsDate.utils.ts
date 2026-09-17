import { resolveIanaTimezone } from '@utils/timezone.utils';

/**
 * Resolves user timezone with priority:
 * 1. Stored user DB timezone (unless empty or 'auto')
 * 2. Client header/query param
 * 3. Default 'UTC'
 */
export function resolveUserTimezone(storedTz?: string, clientTz?: string): string {
  const trimmedStored = storedTz?.trim();
  const trimmedClient = clientTz?.trim();
  const rawTimezone = (trimmedStored && trimmedStored !== 'auto') ? trimmedStored : (trimmedClient || 'UTC');
  return resolveIanaTimezone(rawTimezone);
}

/**
 * Calculates start boundaries for 24h, 7d, 30d in user local timezone.
 */
export function calculateSinceDate(rangeParam: string, userTimezone: string): {
  sinceDate: Date;
  last24h: Date;
  last7d: Date;
  last30d: Date;
} {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = startOfLocalDayNDaysAgo(now, 7, userTimezone);
  const last30d = startOfLocalDayNDaysAgo(now, 30, userTimezone);

  let sinceDate = last30d;
  if (rangeParam === '24h') {
    sinceDate = last24h;
  } else if (rangeParam === '7d') {
    sinceDate = last7d;
  }

  return { sinceDate, last24h, last7d, last30d };
}

export function formatDateInTimezone(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
}

/**
 * Returns a UTC Date as a safe lower bound covering the last `n` complete local days.
 */
export function startOfLocalDayNDaysAgo(now: Date, n: number, _timeZone: string): Date {
  return new Date(now.getTime() - (n + 1) * 24 * 60 * 60 * 1000);
}

/**
 * Shifts a YYYY-MM-DD calendar date string by `deltaDays` days.
 */
export function shiftCalendarDay(dateStr: string, deltaDays: number, timeZone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const shifted = new Date(noonUtc.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return formatDateInTimezone(shifted, timeZone);
}
