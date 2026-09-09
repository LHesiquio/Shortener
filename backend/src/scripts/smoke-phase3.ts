/* eslint-disable no-console */
/**
 * Phase 3 smoke test: exercises the GeneralController through a real
 * Express + HTTP server using a dummy "Widget" entity. No extra deps.
 *
 *   npx ts-node src/scripts/smoke-phase3.ts
 */
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { ObjectId, Document } from 'mongodb';
import { GeneralController } from '@controllers/GeneralController';
import { IBaseModel } from '@models/BaseModel';
import { ApiError } from '@utils/ApiError';
import { connect, close, collection, Collections } from '@config/db';

// ---------------------------------------------------------------------------
// 1) A dummy model that implements IBaseModel — proves the contract works.
// ---------------------------------------------------------------------------
interface WidgetInput { name: string; }
interface WidgetDoc extends Document { _id?: ObjectId; name: string; }

class WidgetModel implements IBaseModel<WidgetInput, WidgetDoc> {
  public extractFromRequest(req: Request): WidgetInput {
    return { name: String(req.body?.name ?? '') };
  }
  public validate(input: WidgetInput): void {
    if (!input.name || input.name.length < 2) {
      throw new ApiError(400, 'name must be at least 2 chars', 'VALIDATION_ERROR');
    }
  }
  public build(input: WidgetInput): WidgetDoc {
    return { name: input.name };
  }
  public toResponse(doc: WidgetDoc): unknown {
    return { id: String(doc._id), name: doc.name };
  }
}

class WidgetController extends GeneralController<WidgetInput, WidgetDoc> {
  protected readonly model = new WidgetModel();
  protected readonly collection = collection<WidgetDoc>('widgets');
}

// ---------------------------------------------------------------------------
// 2) Boot a tiny Express app that wires the controller to HTTP verbs.
// ---------------------------------------------------------------------------
async function bootApp(): Promise<{ url: string; closeServer: () => Promise<void> }> {
  await connect();
  const app = express();
  app.use(express.json());
  const ctrl = new WidgetController();
  app.post('/widgets', ctrl.create);
  app.get('/widgets/:id', ctrl.show);
  app.put('/widgets/:id', ctrl.update);
  app.delete('/widgets/:id', ctrl.delete);

  const errorMiddleware = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ ok: false, error: { code: err.code, message: err.message } });
      return;
    }
    const message = err instanceof Error ? err.message : 'unknown';
    res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message } });
  };
  app.use(errorMiddleware);

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        closeServer: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

// ---------------------------------------------------------------------------
// 3) Minimal HTTP client + assertion helpers (no deps).
// ---------------------------------------------------------------------------
interface HttpResponse { status: number; json: unknown; }

function request(method: string, url: string, body?: unknown): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        method,
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed: unknown = raw;
          if (raw) {
            try { parsed = JSON.parse(raw); } catch { /* keep raw */ }
          }
          resolve({ status: res.statusCode ?? 0, json: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(label: string, cond: boolean, detail?: unknown): void {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`  FAIL ${label}`, detail ?? '');
    process.exitCode = 1;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// 4) The actual smoke flow — split into focused steps to keep main short.
// ---------------------------------------------------------------------------
async function stepCreateInvalid(url: string): Promise<void> {
  const r = await request('POST', `${url}/widgets`, {});
  assert('POST /widgets with empty body returns 400', r.status === 400);
  const code = asRecord(asRecord(r.json).error).code;
  assert('  -> error code is VALIDATION_ERROR', code === 'VALIDATION_ERROR');
}

async function stepCreateValid(url: string): Promise<string> {
  const r = await request('POST', `${url}/widgets`, { name: 'hello' });
  assert('POST /widgets with valid body returns 201', r.status === 201);
  const data = asRecord(r.json);
  assert('  -> response has ok=true', data.ok === true);
  const inner = asRecord(data.data);
  const id = inner.id;
  assert('  -> response has an id', typeof id === 'string' && id.length > 0);
  assert('  -> toResponse exposes id, not _id', Boolean(inner.id) && inner._id === undefined);
  return id as string;
}

async function stepShow(url: string, id: string): Promise<void> {
  const r = await request('GET', `${url}/widgets/${id}`);
  assert(`GET /widgets/${id} returns 200`, r.status === 200);
  const data = asRecord(asRecord(r.json).data);
  assert('  -> name round-trips', data.name === 'hello');
}

async function stepShowMissing(url: string): Promise<void> {
  const r = await request('GET', `${url}/widgets/000000000000000000000000`);
  assert('GET nonexistent returns 404', r.status === 404);

  const r2 = await request('GET', `${url}/widgets/not-an-id`);
  assert('GET malformed id returns 400', r2.status === 400);
  const code = asRecord(asRecord(r2.json).error).code;
  assert('  -> error code is INVALID_ID', code === 'INVALID_ID');
}

async function stepUpdate(url: string, id: string): Promise<void> {
  const r = await request('PUT', `${url}/widgets/${id}`, { name: 'renamed' });
  assert('PUT /widgets/:id with valid body returns 200', r.status === 200);
  const data = asRecord(asRecord(r.json).data);
  assert('  -> new name round-trips', data.name === 'renamed');

  const rBad = await request('PUT', `${url}/widgets/${id}`, {});
  assert('PUT /widgets/:id with empty body returns 400', rBad.status === 400);
}

async function stepDelete(url: string, id: string): Promise<void> {
  const r = await request('DELETE', `${url}/widgets/${id}`);
  assert('DELETE /widgets/:id returns 204', r.status === 204);

  const r2 = await request('DELETE', `${url}/widgets/${id}`);
  assert('DELETE on missing is still 204 (idempotent)', r2.status === 204);
}

async function main(): Promise<void> {
  await connect();
  await collection(Collections.Users).deleteMany({}).catch(() => undefined);
  const { url, closeServer } = await bootApp();

  try {
    await stepCreateInvalid(url);
    const id = await stepCreateValid(url);
    await stepShow(url, id);
    await stepShowMissing(url);
    await stepUpdate(url, id);
    await stepDelete(url, id);
  } finally {
    await closeServer();
    await close();
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('SMOKE FAILED');
  } else {
    console.log('OK');
  }
}

main().catch((err) => {
  console.error('SMOKE CRASHED:', err);
  process.exit(1);
});