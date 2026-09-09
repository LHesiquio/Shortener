import { ShortlinkClick } from '@appTypes/shortlink';
import { ExportContext, ExportResult } from './export.types';
import { buildFilename, formatLocalizedTimestamp } from './export.utils';

export class JsonExportFormatter {
  public static format(ctx: ExportContext): ExportResult {
    const payload = {
      metadata: {
        project: ctx.projectName,
        shortlink: {
          slug: ctx.targetSlug,
          title: ctx.targetTitle,
          url: ctx.targetUrl,
        },
        timezone: ctx.timezone,
        generatedAtUtc: new Date().toISOString(),
        selectedFields: ctx.fields,
        totalRecords: ctx.clicks.length,
      },
      clicks: ctx.clicks.map((c) => mapClickToJson(c, ctx.timezone, ctx.fields)),
    };

    const jsonContent = JSON.stringify(payload, null, 2);
    return {
      buffer: jsonContent,
      contentType: 'application/json; charset=utf-8',
      filename: buildFilename(ctx.targetSlug, 'json', ctx.projectName),
    };
  }
}

function buildGeoObject(c: ShortlinkClick, fields: string[]) {
  const map: Record<string, string | null | undefined> = {
    country: c.geo?.country,
    region: c.geo?.region,
    city: c.geo?.city,
  };
  const geo: Record<string, string | null> = {};
  for (const f of fields) {
    if (f in map) geo[f] = map[f] || null;
  }
  return Object.keys(geo).length > 0 ? geo : undefined;
}

function buildDeviceObject(c: ShortlinkClick, fields: string[]) {
  const map: Record<string, { key: string; val: string | null | undefined }> = {
    deviceType: { key: 'type', val: c.device?.type },
    deviceModel: { key: 'model', val: c.device?.model },
    deviceOs: { key: 'os', val: c.device?.os },
    deviceBrowser: { key: 'browser', val: c.device?.browser },
  };
  const device: Record<string, string | null> = {};
  for (const f of fields) {
    if (map[f]) device[map[f].key] = map[f].val || null;
  }
  return Object.keys(device).length > 0 ? device : undefined;
}

function appendTimestampAndSlug(result: Record<string, unknown>, c: ShortlinkClick, tz: string, fields: string[]) {
  if (fields.includes('timestamp')) {
    result.timestampUtc = c.timestamp.toISOString();
    result.timestampLocalized = formatLocalizedTimestamp(c.timestamp, tz);
  }
  if (fields.includes('slug')) result.slug = c.slug;
}

function appendExtras(result: Record<string, unknown>, c: ShortlinkClick, fields: string[]) {
  if (fields.includes('referer')) result.referer = c.referer || 'Direct';
  if (fields.includes('userAgent')) result.userAgent = c.userAgent || null;
}

function mapClickToJson(c: ShortlinkClick, timezone: string, fields: string[]) {
  const result: Record<string, unknown> = { id: c._id?.toString() };
  appendTimestampAndSlug(result, c, timezone, fields);
  const geo = buildGeoObject(c, fields);
  if (geo) result.geo = geo;
  const device = buildDeviceObject(c, fields);
  if (device) result.device = device;
  appendExtras(result, c, fields);
  return result;
}
