/**
 * Shape of every JSON response coming from the backend.
 *
 * Convention:
 *  - `ok: true`  → `data` is the typed payload
 *  - `ok: false` → `error.code` and `error.message` describe the failure
 */
export interface ApiMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiFail {
  ok: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiOk<T> | ApiFail;

/** Public projection of a user — never includes `passwordHash`. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  status: 'active' | 'inactive';
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload returned by /login and /register (active). */
export interface AuthData {
  user: PublicUser;
  accessToken: string;
}

/** Payload returned by /register when email verification is enabled. */
export interface RegisterPendingPayload {
  user: PublicUser;
  message: string;
}

/** Payload returned by /refresh. */
export interface RefreshData {
  accessToken: string;
}
