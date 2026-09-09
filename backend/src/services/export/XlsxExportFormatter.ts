import ExcelJS from 'exceljs';
import { ExportContext, ExportResult } from './export.types';
import { buildFilename, extractClickFieldValue } from './export.utils';

interface ColumnDef {
  key: string;
  header: string;
  width: number;
}

const COLUMN_DEFS: Record<string, ColumnDef> = {
  timestamp: { key: 'timestamp', header: 'Timestamp', width: 25 },
  slug: { key: 'slug', header: 'Shortlink Slug', width: 18 },
  country: { key: 'country', header: 'Country', width: 18 },
  region: { key: 'region', header: 'Region', width: 20 },
  city: { key: 'city', header: 'City', width: 20 },
  referer: { key: 'referer', header: 'Referrer URL', width: 28 },
  deviceType: { key: 'deviceType', header: 'Device Type', width: 16 },
  deviceModel: { key: 'deviceModel', header: 'Device Model', width: 20 },
  deviceOs: { key: 'deviceOs', header: 'Device OS', width: 18 },
  deviceBrowser: { key: 'deviceBrowser', header: 'Device Browser', width: 18 },
  userAgent: { key: 'userAgent', header: 'User Agent', width: 42 },
};

export class XlsxExportFormatter {
  public static async format(ctx: ExportContext): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LinkTracker';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Click Logs', {
      views: [{ showGridLines: true }],
    });

    setupSheetColumns(sheet, ctx.timezone, ctx.fields);
    renderBannerBlock(sheet, ctx);
    populateRows(sheet, ctx);

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: buildFilename(ctx.targetSlug, 'xlsx', ctx.projectName),
    };
  }
}

function setupSheetColumns(sheet: ExcelJS.Worksheet, timezone: string, fields: string[]): void {
  sheet.columns = fields.map((f) => {
    const def = COLUMN_DEFS[f] || { key: f, header: f, width: 20 };
    const header = f === 'timestamp' ? `Timestamp (${timezone})` : def.header;
    return { header, key: def.key, width: def.width };
  });
}

function renderBannerBlock(sheet: ExcelJS.Worksheet, ctx: ExportContext): void {
  const colCount = Math.max(ctx.fields.length, 1);
  sheet.spliceRows(1, 0, [], []);

  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = 'LINKTRACKER  •  CLICK LOGS AUDIT REPORT';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFF9C4' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B1C18' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(2, 1, 2, colCount);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = `Project: ${ctx.projectName}   |   Slug: /${ctx.targetSlug} (${ctx.targetTitle})   |   Timezone: ${ctx.timezone}   |   Total Logs: ${ctx.clicks.length}`;
  metaCell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF49473C' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F4ED' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 22;

  styleHeaderRow(sheet.getRow(3));
}

function styleHeaderRow(headerRow: ExcelJS.Row): void {
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B2C28' } };
    cell.font = { bold: true, color: { argb: 'FFFFF9C4' }, size: 10.5, name: 'Arial' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF636037' } } };
  });
}

function populateRows(sheet: ExcelJS.Worksheet, ctx: ExportContext): void {
  ctx.clicks.forEach((c, idx) => {
    const rowObj: Record<string, string> = {};
    for (const f of ctx.fields) {
      rowObj[f] = extractClickFieldValue(c, f, ctx.timezone);
    }
    const row = sheet.addRow(rowObj);
    row.height = 20;

    const isEven = idx % 2 === 0;
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF1B1C18' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFFAF9F5' },
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE3E3DC' } },
        right: { style: 'thin', color: { argb: 'FFE3E3DC' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  });
}
