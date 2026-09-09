import { resolveIanaTimezone } from '@utils/timezone.utils';
import { QueryHelper } from '@utils/QueryHelper';
import {
  ExportClicksOptions,
  ExportContext,
  ExportFormat,
  ExportResult,
} from './export.types';
import {
  fetchClickDocuments,
  resolveTargetShortlink,
  sanitizeFields,
  sanitizeFormat,
} from './export.utils';
import { CsvExportFormatter } from './CsvExportFormatter';
import { JsonExportFormatter } from './JsonExportFormatter';
import { XlsxExportFormatter } from './XlsxExportFormatter';
import { PdfExportFormatter } from './PdfExportFormatter';

export class ClicksExportManager {
  private static readonly MAX_EXPORT_RECORDS = 10000;

  /**
   * Generates a file export for click logs based on provided options.
   */
  public static async exportClicks(options: ExportClicksOptions): Promise<ExportResult> {
    const format = sanitizeFormat(options.format);
    const timezone = resolveIanaTimezone(options.timezone);
    const sinceDate = QueryHelper.parseDateRange(options.range);
    const fields = sanitizeFields(options.fields);

    const targetShortlink = await resolveTargetShortlink(
      options.userId,
      options.slug,
      options.shortlinkId,
      options.projectName
    );

    const clickDocs = await fetchClickDocuments(
      targetShortlink.ids,
      sinceDate,
      ClicksExportManager.MAX_EXPORT_RECORDS
    );

    const context: ExportContext = {
      clicks: clickDocs,
      targetSlug: targetShortlink.slug,
      targetUrl: targetShortlink.url,
      targetTitle: targetShortlink.title,
      projectName: targetShortlink.projectName,
      timezone,
      sinceDate,
      fields,
    };

    return delegateExportByFormat(format, context);
  }
}

async function delegateExportByFormat(
  format: ExportFormat,
  ctx: ExportContext
): Promise<ExportResult> {
  switch (format) {
    case 'json':
      return JsonExportFormatter.format(ctx);
    case 'xlsx':
      return XlsxExportFormatter.format(ctx);
    case 'pdf':
      return PdfExportFormatter.format(ctx);
    case 'csv':
    default:
      return CsvExportFormatter.format(ctx);
  }
}

export * from './export.types';
