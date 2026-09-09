import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError } from '@utils/ApiError';
import { SlugAvailabilityService, SlugFeatureType } from '@services/SlugAvailabilityService';

function parseExcludeId(raw?: string): ObjectId | undefined {
  if (raw && ObjectId.isValid(raw)) return new ObjectId(raw);
  return undefined;
}

function getUserId(req: Request): ObjectId {
  const raw = (req as unknown as { user: { id: string } }).user?.id;
  if (!raw || !ObjectId.isValid(raw)) {
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  return new ObjectId(raw);
}

export class SlugController {
  public check = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const type = (req.query.type as SlugFeatureType) || 'project';
    const slug = (req.query.slug as string) || '';
    const excludeId = parseExcludeId(req.query.excludeId as string | undefined);

    const result = await SlugAvailabilityService.check(type, slug, userId, excludeId);
    res.status(200).json({ ok: true, data: result });
  });
}
