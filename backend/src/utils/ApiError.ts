/**
 * Typed application error.
 *
 * Use this anywhere we need to short-circuit a request with a specific HTTP
 * status and a user-safe message. The global errorHandler middleware will
 * translate it into a JSON response. Anything not derived from this class is
 * treated as an internal server error and never leaks its message.
 */
const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code ?? ApiError.resolveCode(statusCode);
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  private static resolveCode(statusCode: number): string {
    if (statusCode >= 500) return 'INTERNAL_ERROR';
    return STATUS_CODES[statusCode] ?? 'BAD_REQUEST';
  }
}