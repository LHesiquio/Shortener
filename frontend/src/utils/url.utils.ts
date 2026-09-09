// Each label must be ≥2 chars; TLD must be ≥2 alpha chars only.
// Requires at least: <domain>.<tld>  (e.g. google.com)
// or: <sub>.<domain>.<tld>           (e.g. www.google.com)
const LABEL = '[\\w-]{2,}';
const TLD   = '[a-zA-Z]{2,}';
const URL_REGEX = new RegExp(
  `^(https?:\\/\\/)?${LABEL}(\\.${LABEL})*\\.${TLD}(\\/[\\w\\-./?%&=#]*)?$`,
  'i',
);

/** Returns true only when the hostname has a real domain+TLD structure.
 *  Rules:
 *   - At least 2 parts (labels) separated by dots.
 *   - TLD (last label) must be ≥2 alpha-only chars.
 *   - Domain (second-to-last label) must be ≥2 chars.
 *   - Every other label must also be ≥2 chars.
 *   - If first label is "www", require ≥3 total parts (www.domain.tld).
 */
function isValidHostname(hostname: string): boolean {
  const labels = hostname.toLowerCase().split('.');

  // Must have at least domain + TLD
  if (labels.length < 2) return false;

  // www alone with a TLD (www.goog) is not valid — need 3+ parts
  if (labels[0] === 'www' && labels.length < 3) return false;

  const tld = labels[labels.length - 1];
  // TLD must be purely alpha, 2+ chars (no hyphens, no numbers)
  if (!/^[a-z]{2,}$/.test(tld)) return false;

  // Domain (the part just before TLD) must be ≥2 chars
  const domain = labels[labels.length - 2];
  if (!domain || domain.length < 2) return false;

  // All remaining labels (subdomains) must also be ≥2 chars
  const subdomains = labels.slice(0, -2);
  return subdomains.every((l) => l.length >= 2);
}

export function isValidUrlFormat(urlStr: string): boolean {
  if (!urlStr.trim()) return false;
  const raw = urlStr.trim();

  // First pass: regex pre-check (quick reject)
  if (!URL_REGEX.test(raw)) return false;

  // Second pass: strict hostname check
  try {
    const formatted = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(formatted);
    return isValidHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function normalizeUrl(urlStr: string): string {
  const raw = urlStr.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function extractDomainName(hostname: string): string {
  const host = hostname.replace(/^www\./i, '');
  const parts = host.split('.');
  const name = parts[0] || host;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractPathSlug(pathname: string): string {
  if (!pathname || pathname === '/') return '';
  return pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean).join('/');
}

export function deriveTitleFromUrl(urlStr: string): string {
  if (!urlStr.trim()) return '';
  try {
    const raw = urlStr.trim();
    const formattedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(formattedUrl);
    const domain = extractDomainName(parsed.hostname);
    const pathSlug = extractPathSlug(parsed.pathname);

    return pathSlug ? `${domain} - ${pathSlug}` : domain;
  } catch {
    return '';
  }
}
