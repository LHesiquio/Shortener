import PDFDocument from 'pdfkit';
import { ShortlinkClick } from '@appTypes/shortlink';
import { ExportContext, ExportResult } from './export.types';
import { buildFilename, extractClickFieldValue, formatLocalizedTimestamp } from './export.utils';

const PDF_HEADERS_MAP: Record<string, string> = {
  timestamp: 'Timestamp',
  slug: 'Slug',
  country: 'Country',
  region: 'Region',
  city: 'City',
  referer: 'Referrer',
  deviceType: 'Device',
  deviceModel: 'Model',
  deviceOs: 'OS',
  deviceBrowser: 'Browser',
  userAgent: 'User Agent',
};

const FIELD_WEIGHTS: Record<string, number> = {
  timestamp: 125,
  slug: 70,
  country: 80,
  region: 80,
  city: 80,
  referer: 120,
  deviceType: 65,
  deviceModel: 75,
  deviceOs: 75,
  deviceBrowser: 75,
  userAgent: 150,
};

export class PdfExportFormatter {
  public static async format(ctx: ExportContext): Promise<ExportResult> {
    const pdfBuffer = await generatePdfDocument(ctx);
    return {
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      filename: buildFilename(ctx.targetSlug, 'pdf', ctx.projectName),
    };
  }
}

function computeColWidths(fields: string[]): number[] {
  const rawTotal = fields.reduce((sum, f) => sum + (FIELD_WEIGHTS[f] || 80), 0);
  const availableWidth = 770;
  return fields.map((f) => Math.floor(((FIELD_WEIGHTS[f] || 80) / rawTotal) * availableWidth));
}

function generatePdfDocument(ctx: ExportContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 36,
      info: { Title: `Click Logs - ${ctx.projectName} /${ctx.targetSlug}`, Author: 'LinkTracker' },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    renderPdfHeader(doc, ctx);
    renderMetadataCard(doc, ctx);
    renderPdfTable(doc, ctx);
    doc.end();
  });
}

function renderPdfHeader(doc: PDFKit.PDFDocument, ctx: ExportContext): void {
  doc.fontSize(16).fillColor('#1B1C18').font('Helvetica-Bold').text('LinkTracker', 36, 30);
  doc.fontSize(9.5).fillColor('#636037').font('Helvetica-Bold').text('CLICK LOGS AUDIT REPORT', 36, 48);

  const genDate = formatLocalizedTimestamp(new Date(), ctx.timezone);
  doc.fontSize(8).fillColor('#73777F').font('Helvetica').text(`Exported: ${genDate}`, 500, 32, {
    align: 'right',
    width: 306,
  });
  doc.text(`Total Records: ${ctx.clicks.length}`, 500, 46, { align: 'right', width: 306 });
}

function renderMetadataCard(doc: PDFKit.PDFDocument, ctx: ExportContext): void {
  const y = 64;
  doc.roundedRect(36, y, 770, 32, 6).fillAndStroke('#F5F4ED', '#CAC6B8');

  doc.fontSize(8).fillColor('#73777F').font('Helvetica-Bold');
  doc.text('PROJECT:', 46, y + 6).text('SHORTLINK:', 220, y + 6).text('TIMEZONE:', 440, y + 6).text('TARGET URL:', 580, y + 6);

  doc.fontSize(8.5).fillColor('#1B1C18').font('Helvetica-Bold');
  doc.text(ctx.projectName, 46, y + 17, { width: 165, ellipsis: true });
  doc.text(`/${ctx.targetSlug} (${ctx.targetTitle})`, 220, y + 17, { width: 210, ellipsis: true });
  doc.text(ctx.timezone, 440, y + 17, { width: 130, ellipsis: true });
  doc.text(ctx.targetUrl || 'Multiple links', 580, y + 17, { width: 215, ellipsis: true });
}

function renderTableHeader(doc: PDFKit.PDFDocument, fields: string[], colWidths: number[], y: number): void {
  doc.rect(36, y, 770, 20).fill('#1B1C18');
  let x = 42;
  fields.forEach((f, i) => {
    doc.fontSize(8).fillColor('#FFF9C4').font('Helvetica-Bold').text(PDF_HEADERS_MAP[f] || f, x, y + 5);
    x += colWidths[i];
  });
}

function renderTableRow(
  doc: PDFKit.PDFDocument,
  c: ShortlinkClick,
  fields: string[],
  widths: number[],
  tz: string,
  y: number,
  isEven: boolean
): void {
  if (isEven) {
    doc.rect(36, y, 770, 18).fill('#FAF9F5');
  }
  doc.strokeColor('#E3E3DC').lineWidth(0.5).moveTo(36, y + 18).lineTo(806, y + 18).stroke();

  let x = 42;
  fields.forEach((f, idx) => {
    const val = extractClickFieldValue(c, f, tz);
    doc.fontSize(7.5).fillColor('#1B1C18').font('Helvetica').text(val, x, y + 4, {
      width: widths[idx] - 8,
      height: 14,
      ellipsis: true,
    });
    x += widths[idx];
  });
}

function renderPdfTable(doc: PDFKit.PDFDocument, ctx: ExportContext): void {
  const colWidths = computeColWidths(ctx.fields);
  let y = 106;
  renderTableHeader(doc, ctx.fields, colWidths, y);
  y += 20;

  const maxRows = Math.min(ctx.clicks.length, 500);
  for (let i = 0; i < maxRows; i++) {
    if (y > 540) {
      doc.addPage({ layout: 'landscape', margin: 36 });
      y = 36;
      renderTableHeader(doc, ctx.fields, colWidths, y);
      y += 20;
    }
    renderTableRow(doc, ctx.clicks[i], ctx.fields, colWidths, ctx.timezone, y, i % 2 === 0);
    y += 18;
  }
}
