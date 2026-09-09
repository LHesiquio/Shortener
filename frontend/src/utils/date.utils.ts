/**
 * date.utils.ts
 *
 * Centralized date/time formatting utilities for the frontend.
 *
 * Design Contract:
 *  - ALL dates in MongoDB are stored in UTC.
 *  - ALL dates rendered on the UI must pass through these helpers,
 *    using the user's IANA timezone from their profile (user.timezone).
 *
 * No other file should call `new Date(...).toLocaleDateString()` directly.
 */

/**
 * Formats a date value into a human-readable date string in the given IANA timezone.
 *
 * @example
 *   formatLocalizedDate('2026-07-30T03:27:00.000Z', 'America/Mexico_City')
 *   // → "Jul 29, 2026"  (because 03:27 UTC = 21:27 on Jul 29 in UTC-6)
 */
export function formatLocalizedDate(
  dateInput: string | Date,
  timeZone: string = 'UTC',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const resolved = resolveTimezone(timeZone);
  const d = toDate(dateInput);
  if (!d) return String(dateInput);
  try {
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
      timeZone: resolved,
    };
    return new Intl.DateTimeFormat('en-US', opts).format(d);
  } catch {
    return d.toUTCString();
  }
}

/**
 * Formats a UTC ISO string into a short date label (e.g. "Jul 29") using the
 * given IANA timezone.  Used for chart X-axis labels in day/30d views.
 *
 * @example
 *   formatLocalizedShortDate('2026-07-30', 'America/Mexico_City')
 *   // → "Jul 30"
 */
export function formatLocalizedShortDate(
  dateInput: string | Date,
  timeZone: string = 'UTC'
): string {
  return formatLocalizedDate(dateInput, timeZone, { month: 'short', day: 'numeric' });
}

/**
 * Formats a UTC ISO string into a time label (e.g. "9 PM") using the
 * given IANA timezone.  Used for hourly chart X-axis labels in 24h views.
 *
 * @example
 *   formatLocalizedHour('2026-07-30T03:00:00.000Z', 'America/Mexico_City')
 *   // → "9 PM"
 */
export function formatLocalizedHour(
  dateInput: string | Date,
  timeZone: string = 'UTC'
): string {
  const resolved = resolveTimezone(timeZone);
  const d = toDate(dateInput);
  if (!d) return String(dateInput);
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: resolved,
      hour: 'numeric',
      hour12: true,
    }).format(d);
  } catch {
    return d.toISOString().substring(11, 16);
  }
}

/**
 * Formats a UTC ISO string into a full date+time tooltip string
 * (e.g. "Jul 29 at 9:27 PM") using the given IANA timezone.
 */
export function formatLocalizedTooltip(
  dateInput: string | Date,
  timeZone: string = 'UTC'
): string {
  const resolved = resolveTimezone(timeZone);
  const d = toDate(dateInput);
  if (!d) return String(dateInput);
  try {
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: resolved,
      month: 'short',
      day: 'numeric',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: resolved,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return `${datePart} at ${timePart}`;
  } catch {
    return d.toUTCString();
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveTimezone(tz: string): string {
  if (!tz || tz.trim().toLowerCase() === 'auto') return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz.trim() });
    return tz.trim();
  } catch {
    return 'UTC';
  }
}

function toDate(input: string | Date): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  // CRITICAL: ECMA-262 §20.4.1.15 — ISO date-only strings (YYYY-MM-DD) are
  // interpreted as UTC midnight (00:00Z).  In any timezone west of UTC (e.g.
  // America/Mexico_City, UTC-6) that midnight becomes 6 PM the *previous* local
  // day, causing daily chart labels to display one day behind.
  //
  // Fix: parse YYYY-MM-DD as NOON UTC (12:00Z).  This is the same calendar day
  // in every timezone from UTC-12 to UTC+12, so Intl.DateTimeFormat will always
  // produce the correct local calendar day label.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
  if (dateOnly) {
    const [y, m, d] = input.split('-').map(Number);
    const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return isNaN(noon.getTime()) ? null : noon;
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
