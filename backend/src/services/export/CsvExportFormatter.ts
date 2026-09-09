import { ShortlinkClick } from '@appTypes/shortlink';
import { ExportContext, ExportResult } from './export.types';
import { buildFilename, extractClickFieldValue } from './export.utils';

const CSV_HEADER_MAP: Record<string, string> = {
  timestamp: 'Timestamp',
  slug: 'Shortlink Slug',
  country: 'Country',
  region: 'Region',
  city: 'City',
  referer: 'Referrer',
  deviceType: 'Device Type',
  deviceModel: 'Device Model',
  deviceOs: 'Device OS',
  deviceBrowser: 'Device Browser',
  userAgent: 'User Agent',
};

export class CsvExportFormatter {
  public static format(ctx: ExportContext): ExportResult {
    const headers = ctx.fields.map((f) =>
      f === 'timestamp' ? `Timestamp (${ctx.timezone})` : CSV_HEADER_MAP[f] || f
    );

    const rows: string[] = [headers.map(escapeCsvField).join(',')];

    for (const click of ctx.clicks) {
      rows.push(buildClickRow(click, ctx.timezone, ctx.fields));
    }

    const csvContent = '\uFEFF' + rows.join('\n');
    return {
      buffer: csvContent,
      contentType: 'text/csv; charset=utf-8',
      filename: buildFilename(ctx.targetSlug, 'csv', ctx.projectName),
    };
  }
}

function buildClickRow(c: ShortlinkClick, timezone: string, fields: string[]): string {
  const row = fields.map((f) => extractClickFieldValue(c, f, timezone));
  return row.map(escapeCsvField).join(',');
}

function escapeCsvField(val: string | null | undefined): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
