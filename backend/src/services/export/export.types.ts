import { ShortlinkClick } from '@appTypes/shortlink';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

export interface ExportClicksOptions {
  userId: string;
  slug?: string;
  shortlinkId?: string;
  projectName?: string;
  range?: string;
  timezone?: string;
  format?: ExportFormat;
  fields?: string[];
}

export interface ExportResult {
  buffer: Buffer | string;
  contentType: string;
  filename: string;
}

export interface ExportContext {
  clicks: ShortlinkClick[];
  targetSlug: string;
  targetUrl: string;
  targetTitle: string;
  projectName: string;
  timezone: string;
  sinceDate?: Date | null;
  fields: string[];
}
