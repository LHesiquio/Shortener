import { Request, Response } from 'express';
import { Collection, ObjectId, Filter, WithId, OptionalUnlessRequiredId } from 'mongodb';
import { z } from 'zod';
import { GeneralController } from '@controllers/GeneralController';
import { CreateShortlinkInput, ShortlinkModel } from '@models/ShortlinkModel';
import { PublicShortlink, Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { collection, Collections } from '@config/db';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

import { QueryHelper } from '@utils/QueryHelper';

/**
 * Handles `/api/shortlinks/*` for the authenticated user.
 *
 * - `create`     POST  /              (inherits GeneralController + sets userId)
 * - `listMine`   GET   /              (paginated via QueryHelper, owner-filtered)
 * - `show`       GET   /:id           (inherits GeneralController, owner-filtered)
 * - `update`     PATCH /:id           (inherits GeneralController, owner-filtered)
 * - `delete`     DELETE /:id          (inherits GeneralController, owner-filtered + cascades to clicks)
 */
export class ShortlinkController extends GeneralController<CreateShortlinkInput, Shortlink> {
  protected readonly model = new ShortlinkModel();

  protected get collection(): Collection<Shortlink> {
    return collection<Shortlink>(Collections.Shortlinks);
  }

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  /**
   * Inherits the GeneralController.create flow but stamps the document
   * with the authenticated userId before insertion.
   */
  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const doc = await this.model.build(input);
    doc.userId = userId;
    const result = await this.collection.insertOne(doc as OptionalUnlessRequiredId<Shortlink>);
    const stored: WithId<Shortlink> = { ...doc, _id: result.insertedId };
    res.status(201).json({ ok: true, data: this.model.toResponse(stored) });
  });

  // -------------------------------------------------------------------------
  // listMine / index
  // -------------------------------------------------------------------------

  public listMine = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const params = QueryHelper.parseForFeature(req, 'shortlinks');
    const projectIdRaw = (req.query.projectId || req.query.project_id) as string | undefined;
    const resolvedProjectId = await resolveProjectId(userId, projectIdRaw);
    const filter = buildShortlinkFilter(userId, resolvedProjectId, params);

    const sortOrder = params.order === 'asc' ? 1 : -1;
    const sortField = params.sort || 'createdAt';

    const [itemsWithProject, total] = await Promise.all([
      this.collection
        .aggregate([
          { $match: filter },
          { $sort: { [sortField]: sortOrder } },
          { $skip: params.skip },
          { $limit: params.pageSize },
          {
            $lookup: {
              from: Collections.Projects,
              localField: 'projectId',
              foreignField: '_id',
              as: 'projectDoc',
            },
          },
          {
            $lookup: {
              from: Collections.ShortlinkClicks,
              localField: '_id',
              foreignField: 'shortlinkId',
              as: 'clicksList',
            },
          },
          {
            $addFields: {
              projectInfo: { $arrayElemAt: ['$projectDoc', 0] },
              computedClicksCount: { $size: '$clicksList' },
            },
          },
        ])
        .toArray(),
      this.collection.countDocuments(filter),
    ]);

    const formattedItems: PublicShortlink[] = itemsWithProject.map((item) => {
      const base = this.model.toResponse(item as WithId<Shortlink>);
      base.clicksCount = item.computedClicksCount ?? item.clicksCount ?? 0;
      if (item.projectInfo) {
        base.project = {
          id: item.projectInfo._id.toHexString(),
          name: item.projectInfo.name,
        };
      }
      return base;
    });

    const meta = QueryHelper.buildMeta(total, params);

    res.status(200).json({
      ok: true,
      data: formattedItems,
      meta,
    });
  });

  public override index = this.listMine;

  // -------------------------------------------------------------------------
  // show  (override to enforce ownership)
  // -------------------------------------------------------------------------

  public show = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const doc = await this.findOwnedOr404(req, userId);
    res.status(200).json({ ok: true, data: this.model.toResponse(doc) });
  });

  // -------------------------------------------------------------------------
  // update  (override to enforce ownership)
  // -------------------------------------------------------------------------

  public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const input = this.model.extractFromRequestForUpdate(req);
    this.model.validateUpdate(input);
    const patch = this.model.buildForUpdate(input);
    const id = this.parseObjectId(req.params.id);
    const result = await this.collection.findOneAndUpdate(
      { _id: id, userId } as Filter<Shortlink>,
      { $set: patch as unknown as Partial<Shortlink> },
      { returnDocument: 'after' }
    );
    if (!result) throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
    res.status(200).json({ ok: true, data: this.model.toResponse(result) });
  });

  // -------------------------------------------------------------------------
  // delete  (override to enforce ownership + cascade clicks)
  // -------------------------------------------------------------------------

  public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const doc = await this.findOwnedOr404(req, userId);
    const id = doc._id;
    await this.collection.deleteOne({ _id: id, userId } as Filter<Shortlink>);
    await collection<ShortlinkClick>(Collections.ShortlinkClicks).deleteMany({ shortlinkId: id });
    res.status(200).json({ ok: true, data: this.model.toResponse(doc) });
  });

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private requireUserId(req: Request): ObjectId {
    const id = req.user?.id;
    if (!id) throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    return new ObjectId(id);
  }

  private parseObjectId(raw: string | undefined): ObjectId {
    if (!raw || !ObjectId.isValid(raw)) {
      throw new ApiError(400, 'Invalid shortlink id', 'INVALID_ID');
    }
    return new ObjectId(raw);
  }

  private async findOwnedOr404(req: Request, userId: ObjectId): Promise<WithId<Shortlink>> {
    const id = this.parseObjectId(req.params.id);
    const doc = await this.collection.findOne({ _id: id, userId } as Filter<Shortlink>);
    if (!doc) throw new ApiError(404, 'Shortlink not found', 'NOT_FOUND');
    return doc;
  }
}

async function resolveProjectId(userId: ObjectId, projectIdRaw?: string): Promise<ObjectId | undefined> {
  if (!projectIdRaw || !projectIdRaw.trim()) return undefined;
  const raw = projectIdRaw.trim();
  if (ObjectId.isValid(raw) && raw.length === 24) {
    return new ObjectId(raw);
  }
  const project = await collection(Collections.Projects).findOne({ userId, slug: raw.toLowerCase() });
  return project?._id ?? new ObjectId();
}

function buildShortlinkFilter(
  userId: ObjectId,
  resolvedProjectId?: ObjectId,
  params?: import('@utils/QueryHelper').PaginationParams
): Filter<Shortlink> {
  const filter: Filter<Shortlink> = { userId };

  if (resolvedProjectId) {
    filter.projectId = resolvedProjectId;
  }

  if (params?.archived === true) {
    filter.isArchived = true;
  } else {
    filter.$or = [{ isArchived: false }, { isArchived: { $exists: false } }];
  }

  if (params?.search) {
    const searchRegex = { $regex: params.search, $options: 'i' };
    const searchFilter = {
      $or: [{ title: searchRegex }, { slug: searchRegex }, { url: searchRegex }],
    };
    return { $and: [filter, searchFilter] } as Filter<Shortlink>;
  }

  return filter;
}
