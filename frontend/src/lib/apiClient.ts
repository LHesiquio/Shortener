import type { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5001';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
}

function parseJsonPayload(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function handleFailedResponse<T>(res: Response, payload: unknown): never {
  const fail = payload as Extract<ApiResponse<T>, { ok: false }> | null;
  const err = fail?.error;
  throw new ApiError(
    res.status,
    err?.code ?? 'UNKNOWN_ERROR',
    err?.message ?? `Request failed with status ${res.status}`,
    err?.details
  );
}

function handleSuccessPayload<T>(res: Response, payload: unknown): T {
  const ok = payload as Extract<ApiResponse<T>, { ok: true }> | null;
  if (!ok || ok.ok !== true) {
    throw new ApiError(res.status, 'MALFORMED_RESPONSE', 'Server returned an unexpected response');
  }
  return ok.data;
}

function buildFetchInit(opts: RequestOptions): RequestInit {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const token = opts.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (token) headers.authorization = `Bearer ${token}`;

  return {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  };
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const init = buildFetchInit(opts);
  const res = await fetch(`${API_BASE_URL}${path}`, init);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = parseJsonPayload(text);

  if (!res.ok) {
    handleFailedResponse<T>(res, payload);
  }

  return handleSuccessPayload<T>(res, payload);
}

export const apiClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  getWithMeta: async <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => {
    const init = buildFetchInit({ ...opts, method: 'GET' });
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    const text = await res.text();
    const payload = parseJsonPayload(text) as any;

    if (!res.ok) {
      handleFailedResponse<T>(res, payload);
    }
    if (!payload || payload.ok !== true) {
      throw new ApiError(res.status, 'MALFORMED_RESPONSE', 'Server returned an unexpected response');
    }
    return { data: payload.data as T, meta: payload.meta as import('@/types/api').ApiMeta | undefined };
  },
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};

export { API_BASE_URL };
