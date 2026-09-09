/**
 * timezone.utils.ts
 *
 * Centralised IANA timezone resolution for the backend.
 * All timezone strings flowing from user profiles should pass through
 * `resolveIanaTimezone` before being used in Mongo aggregations or
 * Intl formatters.
 */

/**
 * Validates a timezone string and returns a safe IANA timezone identifier.
 *
 * Rules:
 *  - Empty / undefined → system default (America/Mexico_City)
 *  - Literal 'auto'   → resolve to system default (never stored)
 *  - Invalid IANA     → fallback to 'UTC'
 *  - Valid IANA       → return as-is
 */
export function resolveIanaTimezone(tz?: string | null): string {
  const trimmed = tz?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') {
    // 'auto' is a UI sentinel only – it should never reach the DB.
    // Default to a widely-used offset as a safe fallback.
    return 'America/Mexico_City';
  }

  try {
    // This throws a RangeError for invalid timezone identifiers.
    new Intl.DateTimeFormat('en-US', { timeZone: trimmed });
    return trimmed;
  } catch {
    return 'UTC';
  }
}

/**
 * Returns the IANA offset label for display purposes, e.g. "(UTC-6)".
 */
export function formatTimezoneOffset(tz: string): string {
  try {
    const resolved = resolveIanaTimezone(tz);
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: resolved,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';
    return `(${offset})`;
  } catch {
    return '(UTC)';
  }
}
