import { Request } from 'express';
import { FeatureHelper } from './FeatureHelper';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  limit: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  range?: string;
  sinceDate?: Date | null;
  archived?: boolean;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class QueryHelper {
  /**
   * Main entry point to parse Express request query params into a structured PaginationParams object.
   * Delegates specific query param processing to small, dedicated helper functions (Complexity <= 5).
   */
  public static parse(req: Request, defaultPageSize = 10): PaginationParams {
    const query = req.query || {};

    const pageSize = parsePageSize(query, defaultPageSize);
    const { page, skip } = parsePageAndSkip(query, pageSize);
    const search = parseSearch(query);
    const { sort, order } = parseSortAndOrder(query);
    const range = parseRange(query);
    const sinceDate = QueryHelper.parseDateRange(range);
    const archived = parseArchived(query);

    return {
      page,
      pageSize,
      skip,
      limit: pageSize,
      search,
      sort,
      order,
      range,
      sinceDate,
      archived,
    };
  }

  /**
   * Feature-aware query parser that inspects feature_config for default page size and capability rules.
   */
  public static parseForFeature(req: Request, featureKey: string): PaginationParams {
    const defaultPageSize = FeatureHelper.getDefaultPageSize(featureKey, 10);
    const params = QueryHelper.parse(req, defaultPageSize);

    if (!FeatureHelper.hasFeature(featureKey, 'search')) {
      params.search = '';
    }

    if (!FeatureHelper.hasFeature(featureKey, 'archiving')) {
      params.archived = false;
    }

    return params;
  }

  /**
   * Converts a range string ('24h', '7d', '30d') into a cutoff Date instance.
   */
  public static parseDateRange(range?: string): Date | null {
    if (!range) return null;
    const now = new Date();
    if (range === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (range === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
  }

  /**
   * Builds clean 3-key pagination metadata without redundancy.
   */
  public static buildMeta(total: number, params: PaginationParams): PaginationMeta {
    return {
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }

  /**
   * Constructs a standardized response with data array and meta pagination.
   */
  public static buildResponse<T>(
    items: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    return {
      data: items,
      meta: QueryHelper.buildMeta(total, params),
    };
  }
}

// ---------------------------------------------------------------------------
// Dedicated Modular Parser Helpers (Each with Cyclomatic Complexity <= 5)
// ---------------------------------------------------------------------------

function extractRawLimit(query: Record<string, unknown>): unknown {
  if (query.page_size !== undefined) return query.page_size;
  if (query.pageSize !== undefined) return query.pageSize;
  return query.limit;
}

function parsePageSize(query: Record<string, unknown>, defaultPageSize: number): number {
  const rawLimit = extractRawLimit(query);
  const parsed = parseInt(String(rawLimit || ''), 10);
  if (!parsed || parsed < 1) return defaultPageSize;
  return Math.min(100, parsed);
}

function parsePageAndSkip(
  query: Record<string, unknown>,
  pageSize: number
): { page: number; skip: number } {
  if (query.skip !== undefined) {
    const rawSkip = Math.max(0, parseInt(String(query.skip), 10) || 0);
    const derivedPage = Math.floor(rawSkip / pageSize) + 1;
    return { page: derivedPage, skip: rawSkip };
  }

  if (query.page !== undefined) {
    const rawPage = Math.max(1, parseInt(String(query.page), 10) || 1);
    const derivedSkip = (rawPage - 1) * pageSize;
    return { page: rawPage, skip: derivedSkip };
  }

  return { page: 1, skip: 0 };
}

function parseSearch(query: Record<string, unknown>): string {
  if (typeof query.search === 'string') {
    return query.search.trim();
  }
  return '';
}

function parseSortAndOrder(query: Record<string, unknown>): { sort: string; order: 'asc' | 'desc' } {
  const rawSort = query.sort;
  const sort = typeof rawSort === 'string' && rawSort.trim() ? rawSort.trim() : 'createdAt';
  const order = parseOrder(query);
  return { sort, order };
}

function parseOrder(query: Record<string, unknown>): 'asc' | 'desc' {
  const rawDir = query.order ?? query.sort_dir ?? 'desc';
  const strDir = String(rawDir).toLowerCase();
  return strDir === 'asc' || strDir === '1' ? 'asc' : 'desc';
}

function parseRange(query: Record<string, unknown>): string | undefined {
  if (typeof query.range === 'string' && query.range.trim()) {
    return query.range.trim();
  }
  return undefined;
}

function parseArchived(query: Record<string, unknown>): boolean {
  const val = query.archived;
  return val === 'true' || val === true || val === '1' || val === 1;
}
