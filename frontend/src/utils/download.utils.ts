/**
 * download.utils.ts
 *
 * Shared browser-download helpers used by every export flow (sync and async).
 * Keeping them here avoids duplicating Blob/anchor plumbing across services.
 */

export const EXPORT_MIME_MAP: Record<string, string> = {
  csv: 'text/csv;charset=utf-8;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  json: 'application/json',
};

export function extractDispositionFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename=["']?([^"';]+)["']?/);
  return match ? match[1] : null;
}

export function buildFallbackFilename(
  projectName?: string,
  slug?: string,
  format = 'csv'
): string {
  const safeProject = (projectName || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSlug = (slug || 'report').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const prefix = safeProject ? `${safeProject}-${safeSlug}` : `click-logs-${safeSlug}`;
  return `${prefix}-${dateStr}.${format}`;
}

export function resolveExportFilename(
  disposition: string | null,
  projectName?: string,
  slug?: string,
  format = 'csv'
): string {
  return extractDispositionFilename(disposition) || buildFallbackFilename(projectName, slug, format);
}

export function triggerDownload(rawBlob: Blob, filename: string, format = 'csv'): void {
  const mimeType = EXPORT_MIME_MAP[format] || rawBlob.type || 'application/octet-stream';
  const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }, 1000);
}
