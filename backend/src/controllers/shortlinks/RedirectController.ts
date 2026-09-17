import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { Project } from '@appTypes/project';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { snapshotRequestAsync } from '@utils/geo';
import { evaluateShortlinkStatus, renderStatusPage } from '@utils/redirectHtml.utils';

export class RedirectController {
  public redirect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const slug = this.extractSlug(req);
    const shortlink = await collection<Shortlink>(Collections.Shortlinks).findOne({ slug });
    if (!shortlink) {
      throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
    }

    const handled = await handleInactiveShortlink(shortlink, res);
    if (handled) return;

    this.recordClick(shortlink, req).catch((err) => {
      console.warn('[redirect] failed to record click:', err);
    });

    res.set('Cache-Control', 'no-store');
    res.redirect(302, shortlink.url);
  });

  private extractSlug(req: Request): string {
    const slug = req.params.slug;
    if (!slug || typeof slug !== 'string' || slug.length === 0) {
      throw new ApiError(400, 'Missing slug', 'VALIDATION_ERROR');
    }
    return slug;
  }

  private async recordClick(shortlink: Shortlink, req: Request): Promise<void> {
    if (!shortlink._id) return;
    const snap = await snapshotRequestAsync(req);
    const click: ShortlinkClick = {
      shortlinkId: shortlink._id,
      slug: shortlink.slug,
      timestamp: new Date(),
      ip: snap.ip,
      ipHash: snap.ipHash,
      userAgent: snap.userAgent,
      referer: snap.referer,
      acceptLanguage: snap.acceptLanguage,
      device: snap.device,
      geo: snap.geo,
    };
    await Promise.all([
      collection<ShortlinkClick>(Collections.ShortlinkClicks).insertOne(click),
      collection<Shortlink>(Collections.Shortlinks).updateOne(
        { _id: shortlink._id },
        { $inc: { clicksCount: 1 } }
      ),
    ]);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function handleInactiveShortlink(shortlink: Shortlink, res: Response): Promise<boolean> {
  const status = evaluateShortlinkStatus(shortlink);
  if (status !== 'active') {
    res.set('Cache-Control', 'no-store');
    const statusCode = status === 'not_started' ? 200 : 410;
    res.status(statusCode).send(renderStatusPage(status, shortlink.activeFrom));
    return true;
  }

  const isArchived = await isProjectArchived(shortlink.projectId);
  if (isArchived) {
    res.set('Cache-Control', 'no-store');
    res.status(410).send(renderStatusPage('disabled', shortlink.activeFrom));
    return true;
  }

  return false;
}

async function isProjectArchived(projectId?: ObjectId): Promise<boolean> {
  if (!projectId) return false;
  const project = await collection<Project>(Collections.Projects).findOne({ _id: projectId });
  return Boolean(project?.isArchived);
}
