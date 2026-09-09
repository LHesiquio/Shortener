import { Request } from 'express';
import { z } from 'zod';
import { ObjectId, WithId } from 'mongodb';
import dns from 'dns/promises';
import net from 'net';
import { IBaseModel, IModelWithBuildForUpdate } from '@models/BaseModel';
import { PublicShortlink, Shortlink } from '@appTypes/shortlink';
import { ApiError } from '@utils/ApiError';
import { generateRandomSlug, isReservedSlug, normalizeSlug, SlugError } from '@utils/slug';
import { collection, Collections } from '@config/db';
import { env } from '@config/env';

const createSchema = z.object({
  url: z.string().url().max(2048),
  slug: z.string().min(1).max(64).optional(),
  title: z.string().max(200).optional(),
  projectId: z.string().refine((val) => ObjectId.isValid(val), { message: 'Invalid projectId' }).optional(),
  activeFrom: z.coerce.date().optional(),
  activeTo: z.coerce.date().optional(),
}).refine((data) => {
  if (data.activeFrom && data.activeTo) {
    return data.activeTo > data.activeFrom;
  }
  return true;
}, {
  message: 'activeTo must be strictly after activeFrom',
  path: ['activeTo'],
});

export type CreateShortlinkInput = z.infer<typeof createSchema>;

const updateSchema = z.object({
  url: z.string().url().max(2048).optional(),
  title: z.string().max(200).nullable().optional(),
  active: z.boolean().optional(),
  projectId: z.string().refine((val) => ObjectId.isValid(val), { message: 'Invalid projectId' }).optional(),
  activeFrom: z.coerce.date().optional(),
  activeTo: z.coerce.date().nullable().optional(),
});

export type UpdateShortlinkInput = z.infer<typeof updateSchema>;

const PRIVATE_HOSTNAMES = new Set(['localhost']);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 0) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
}

function isPrivateHost(hostname: string): boolean {
  if (PRIVATE_HOSTNAMES.has(hostname)) return true;
  if (net.isIP(hostname)) {
    return hostname.includes(':') ? isPrivateIPv6(hostname) : isPrivateIPv4(hostname);
  }
  return false;
}

async function assertUrlIsSafe(rawUrl: string): Promise<void> {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new ApiError(400, 'Invalid URL', 'INVALID_URL'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError(400, 'Only http and https URLs are allowed', 'UNSAFE_URL');
  }
  if (!env.SHORTLINK_BLOCK_PRIVATE_HOSTS) return;
  const host = parsed.hostname.toLowerCase();
  if (isPrivateHost(host)) {
    throw new ApiError(400, 'URLs pointing to private/loopback hosts are not allowed', 'PRIVATE_HOST');
  }
  try {
    const records = await dns.lookup(host, { all: true });
    for (const r of records) {
      if (net.isIP(r.address) === 4 && isPrivateIPv4(r.address)) {
        throw new ApiError(400, 'URL resolves to a private address', 'PRIVATE_HOST');
      }
      if (net.isIP(r.address) === 6 && isPrivateIPv6(r.address)) {
        throw new ApiError(400, 'URL resolves to a private address', 'PRIVATE_HOST');
      }
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'Could not resolve destination host', 'INVALID_URL');
  }
}

export class ShortlinkModel implements IBaseModel<CreateShortlinkInput, Shortlink>, IModelWithBuildForUpdate<UpdateShortlinkInput, Shortlink> {
  private readonly maxRandomAttempts = 5;

  public extractFromRequest(req: Request): CreateShortlinkInput {
    return {
      url: req.body?.url,
      slug: req.body?.slug,
      title: req.body?.title,
      projectId: req.body?.projectId,
      activeFrom: req.body?.activeFrom,
      activeTo: req.body?.activeTo,
    };
  }

  public validate(input: CreateShortlinkInput): void {
    const result = createSchema.safeParse(input);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid shortlink payload';
      throw new ApiError(400, msg, 'VALIDATION_ERROR');
    }
    if (input.slug !== undefined) {
      try { normalizeSlug(input.slug); } catch (err) {
        if (err instanceof SlugError) throw new ApiError(400, err.message, err.code);
        throw err;
      }
    }
  }

  public async build(input: CreateShortlinkInput): Promise<Shortlink> {
    await assertUrlIsSafe(input.url);
    const slug = input.slug !== undefined
      ? normalizeSlug(input.slug)
      : await this.generateUniqueSlug();

    const now = new Date();
    const activeFromDate = input.activeFrom ? new Date(input.activeFrom) : now;
    const activeToDate = input.activeTo ? new Date(input.activeTo) : undefined;

    return {
      userId: new ObjectId(),
      projectId: input.projectId ? new ObjectId(input.projectId) : new ObjectId(),
      slug,
      url: input.url,
      title: input.title,
      active: true,
      isArchived: false,
      clicksCount: 0,
      activeFrom: activeFromDate,
      activeTo: activeToDate,
      createdAt: now,
      updatedAt: now,
    };
  }

  public extractFromRequestForUpdate(req: Request): UpdateShortlinkInput {
    return {
      url: req.body?.url,
      title: req.body?.title,
      active: req.body?.active,
      projectId: req.body?.projectId,
      activeFrom: req.body?.activeFrom,
      activeTo: req.body?.activeTo,
    };
  }

  public validateUpdate(input: UpdateShortlinkInput): void {
    const result = updateSchema.safeParse(input);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid update payload';
      throw new ApiError(400, msg, 'VALIDATION_ERROR');
    }
    const hasAnyField = Object.values(input).some((val) => val !== undefined);
    if (!hasAnyField) {
      throw new ApiError(400, 'At least one field must be provided for update', 'EMPTY_UPDATE');
    }
  }

  public buildForUpdate(input: UpdateShortlinkInput): Shortlink {
    const now = new Date();
    const patch: Partial<Shortlink> = { updatedAt: now };
    if (input.url !== undefined) patch.url = input.url;
    if (input.title !== undefined) patch.title = input.title ?? undefined;
    if (input.active !== undefined) patch.active = input.active;
    if (input.projectId !== undefined) patch.projectId = new ObjectId(input.projectId);
    if (input.activeFrom !== undefined) patch.activeFrom = new Date(input.activeFrom);
    if (input.activeTo !== undefined) patch.activeTo = input.activeTo ? new Date(input.activeTo) : undefined;

    return patch as Shortlink;
  }

  public toResponse(doc: WithId<Shortlink>): PublicShortlink {
    return {
      id: doc._id.toHexString(),
      userId: doc.userId.toHexString(),
      projectId: doc.projectId ? doc.projectId.toHexString() : '',
      slug: doc.slug,
      url: doc.url,
      title: doc.title,
      active: doc.active,
      isArchived: Boolean(doc.isArchived),
      clicksCount: doc.clicksCount ?? 0,
      activeFrom: doc.activeFrom,
      activeTo: doc.activeTo,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private async generateUniqueSlug(): Promise<string> {
    for (let attempt = 0; attempt < this.maxRandomAttempts; attempt += 1) {
      const candidate = generateRandomSlug();
      if (isReservedSlug(candidate)) continue;
      const taken = await collection<Shortlink>(Collections.Shortlinks).findOne(
        { slug: candidate },
        { projection: { _id: 1 } }
      );
      if (!taken) return candidate;
    }
    throw new ApiError(500, 'Could not generate a unique slug, please try again', 'SLUG_GENERATION_FAILED');
  }
}
