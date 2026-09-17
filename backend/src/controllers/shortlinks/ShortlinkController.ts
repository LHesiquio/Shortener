import { Request, Response } from 'express';
import { Collection, ObjectId, Filter, WithId, OptionalUnlessRequiredId, Document } from 'mongodb';
import { ShortlinkModel } from '@models/ShortlinkModel';
import { PublicShortlink, Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { collection, Collections } from '@config/db';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import { QueryHelper } from '@utils/QueryHelper';

interface AggregatedShortlinkDoc extends WithId<Shortlink> {
  projectInfo?: { _id: ObjectId; name: string };
  computedClicksCount?: number;
}

/**
 * Handles `/api/shortlinks/*` for the authenticated user.
 */
export class ShortlinkController {
  private readonly model = new ShortlinkModel();

  private get collection(): Collection<Shortlink> {
    return collection<Shortlink>(Collections.Shortlinks);
  }

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

  public listMine = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const params = QueryHelper.parseForFeature(req, 'shortlinks');
    const projectIdRaw = (req.query.projectId || req.query.project_id) as string | undefined;
    const resolvedProjectId = await resolveProjectId(userId, projectIdRaw);
    const filter = buildShortlinkFilter(userId, resolvedProjectId, params);

    const sortOrder: 1 | -1 = params.order === 'asc' ? 1 : -1;
    const sortField = params.sort || 'createdAt';
    const pipeline = buildShortlinkPipeline(filter, sortField, sortOrder, params.skip, params.pageSize);

    const [itemsWithProject, total] = await Promise.all([
      this.collection.aggregate<AggregatedShortlinkDoc>(pipeline).toArray(),
      this.collection.countDocuments(filter),
    ]);

    const formattedItems: PublicShortlink[] = itemsWithProject.map((item) =>
      formatShortlinkItem(this.model, item)
    );

    res.status(200).json({
      ok: true,
      data: formattedItems,
      meta: QueryHelper.buildMeta(total, params),
    });
  });

  public index = this.listMine;

  public show = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const doc = await this.findOwnedOr404(req, userId);
    res.status(200).json({ ok: true, data: this.model.toResponse(doc) });
  });

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

// ---------------------------------------------------------------------------
// Pipeline & Formatting Helpers
// ---------------------------------------------------------------------------

function buildShortlinkPipeline(
  filter: Filter<Shortlink>,
  sortField: string,
  sortOrder: 1 | -1,
  skip: number,
  pageSize: number
): Document[] {
  return [
    { $match: filter },
    { $sort: { [sortField]: sortOrder } },
    { $skip: skip },
    { $limit: pageSize },
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
  ];
}

function formatShortlinkItem(model: ShortlinkModel, item: AggregatedShortlinkDoc): PublicShortlink {
  const base = model.toResponse(item);
  base.clicksCount = item.computedClicksCount ?? item.clicksCount ?? 0;
  if (item.projectInfo) {
    base.project = {
      id: item.projectInfo._id.toHexString(),
      name: item.projectInfo.name,
    };
  }
  return base;
}

async function resolveProjectId(userId: ObjectId, projectIdRaw?: string): Promise<ObjectId | undefined> {
  const raw = projectIdRaw?.trim();
  if (!raw) return undefined;
  if (isDirectObjectId(raw)) {
    return new ObjectId(raw);
  }
  return resolveProjectBySlug(userId, raw);
}

function isDirectObjectId(raw: string): boolean {
  return raw.length === 24 && ObjectId.isValid(raw);
}

async function resolveProjectBySlug(userId: ObjectId, slug: string): Promise<ObjectId> {
  const project = await collection(Collections.Projects).findOne({ userId, slug: slug.toLowerCase() });
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
