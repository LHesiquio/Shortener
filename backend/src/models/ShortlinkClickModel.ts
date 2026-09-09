import { Request } from 'express';
import { z } from 'zod';
import { ObjectId, WithId } from 'mongodb';
import { IBaseModel } from '@models/BaseModel';
import { ShortlinkClick } from '@appTypes/shortlink';
import { ApiError } from '@utils/ApiError';

const createClickSchema = z.object({
  shortlinkId: z.string().min(1, 'shortlinkId is required'),
  slug: z.string().min(1, 'slug is required'),
  timestamp: z.date().optional(),
  ip: z.string().nullable().optional(),
  ipHash: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  referer: z.string().nullable().optional(),
  acceptLanguage: z.string().nullable().optional(),
  device: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet', 'bot', 'unknown']).default('unknown'),
    os: z.string().nullable().optional(),
    browser: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
  }).optional(),
  geo: z.object({
    country: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }).optional(),
});

export type CreateShortlinkClickInput = z.infer<typeof createClickSchema>;

export interface PublicShortlinkClick {
  id: string;
  shortlinkId: string;
  slug: string;
  timestamp: string;
  ipHash: string | null;
  referer: string;
  device: {
    type: string;
    os: string;
    browser: string;
    model: string | null;
  };
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
  };
}

export class ShortlinkClickModel implements IBaseModel<CreateShortlinkClickInput, ShortlinkClick> {
  public extractFromRequest(req: Request): CreateShortlinkClickInput {
    return {
      shortlinkId: req.body?.shortlinkId,
      slug: req.body?.slug,
      timestamp: req.body?.timestamp ? new Date(req.body.timestamp) : undefined,
      ip: req.body?.ip,
      ipHash: req.body?.ipHash,
      userAgent: req.body?.userAgent,
      referer: req.body?.referer,
      acceptLanguage: req.body?.acceptLanguage,
      device: req.body?.device,
      geo: req.body?.geo,
    };
  }

  public validate(input: CreateShortlinkClickInput): void {
    const result = createClickSchema.safeParse(input);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid click payload';
      throw new ApiError(400, msg, 'VALIDATION_ERROR');
    }
  }

  public build(input: CreateShortlinkClickInput): ShortlinkClick {
    const base = extractClickBase(input);
    return {
      ...base,
      device: buildClickDevice(input.device),
      geo: buildClickGeo(input.geo),
    };
  }

  public toResponse(doc: WithId<ShortlinkClick>): PublicShortlinkClick {
    const timestampStr = doc.timestamp instanceof Date
      ? doc.timestamp.toISOString()
      : new Date(doc.timestamp).toISOString();

    return {
      id: doc._id.toHexString(),
      shortlinkId: doc.shortlinkId.toHexString(),
      slug: doc.slug,
      timestamp: timestampStr,
      ipHash: doc.ipHash || null,
      referer: doc.referer || 'Direct',
      device: formatClickDevice(doc.device),
      geo: formatClickGeo(doc.geo),
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers (Cyclomatic Complexity <= 5 each)
// ---------------------------------------------------------------------------

function extractClickBase(input: CreateShortlinkClickInput) {
  return {
    shortlinkId: new ObjectId(input.shortlinkId),
    slug: input.slug,
    timestamp: input.timestamp ?? new Date(),
    ip: input.ip ?? null,
    ipHash: input.ipHash ?? null,
    userAgent: input.userAgent ?? null,
    referer: input.referer ?? null,
    acceptLanguage: input.acceptLanguage ?? null,
  };
}

function buildClickDevice(device?: CreateShortlinkClickInput['device']) {
  return {
    type: device?.type || 'unknown',
    os: device?.os || null,
    browser: device?.browser || null,
    model: device?.model || null,
  };
}

function buildClickGeo(geo?: CreateShortlinkClickInput['geo']) {
  return {
    country: geo?.country || null,
    region: geo?.region || null,
    city: geo?.city || null,
  };
}

function formatClickDevice(device?: ShortlinkClick['device']) {
  return {
    type: device?.type || 'unknown',
    os: device?.os || 'Unknown',
    browser: device?.browser || 'Unknown',
    model: device?.model || null,
  };
}

function formatClickGeo(geo?: ShortlinkClick['geo']) {
  return {
    country: geo?.country || null,
    region: geo?.region || null,
    city: geo?.city || null,
  };
}
