import { Request, Response } from 'express';
import {
  Collection,
  Document,
  Filter,
  ObjectId,
  OptionalUnlessRequiredId,
  UpdateFilter,
  WithId,
} from 'mongodb';
import { IBaseModel } from '@models/BaseModel';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError } from '@utils/ApiError';
import { QueryHelper } from '@utils/QueryHelper';

/**
 * Base CRUD controller. Implements the **Template Method** pattern: each
 * public method here is a thin orchestrator that delegates the domain
 * logic to the injected `model`. Every subclass only has to:
 *
 *   1. Provide a `model` instance (an `IBaseModel`).
 *   2. Provide a `collection` reference to the underlying Mongo collection.
 *
 * Subclasses can override any of the public methods (`index`, `create`, `update`,
 * `show`, `delete`) when their flow diverges.
 *
 * @typeParam TInput - the shape coming out of `extractFromRequest`.
 * @typeParam TDoc   - the shape stored in Mongo.
 */
export abstract class GeneralController<TInput, TDoc extends Document> {
  protected abstract readonly model: IBaseModel<TInput, TDoc>;
  protected abstract readonly collection: Collection<TDoc>;

  // -------------------------------------------------------------------------
  // INDEX (list / query)
  // -------------------------------------------------------------------------

  /**
   * GET handler. Reads pagination parameters (page, page_size, limit, skip, search, sort, order),
   * applies owner filters and search if present, and returns a paginated response.
   */
  public index = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = QueryHelper.parse(req);
    const filter = buildIndexFilter<TDoc>(req, params.search, params.sinceDate, params.archived);
    const sortOrder = params.order === 'asc' ? 1 : -1;
    const sortField = params.sort || 'createdAt';

    const [docs, total] = await Promise.all([
      this.collection
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(params.skip)
        .limit(params.pageSize)
        .toArray(),
      this.collection.countDocuments(filter),
    ]);

    const items = docs.map((doc) => this.model.toResponse(doc));
    const meta = QueryHelper.buildMeta(total, params);

    res.status(200).json({ ok: true, data: items, meta });
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * POST handler. Reads the input from the request, validates and builds the
   * document, then inserts it.
   */
  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const doc = await this.model.build(input);
    const result = await this.collection.insertOne(doc as OptionalUnlessRequiredId<TDoc>);
    const inserted: WithId<TDoc> = {
      ...(doc as object),
      _id: result.insertedId,
    } as WithId<TDoc>;
    res.status(201).json({ ok: true, data: this.model.toResponse(inserted) });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  /**
   * PUT/PATCH handler. Reads the id from `req.params.id` and the payload from
   * `req.body`, then performs a `findOneAndUpdate` returning the new doc.
   */
  public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseObjectId(req.params.id, 'id');
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const doc = await this.model.build(input);
    const filter: Filter<TDoc> = { _id: id } as unknown as Filter<TDoc>;
    const update: UpdateFilter<TDoc> = { $set: doc as unknown as Partial<TDoc> };
    const result = await this.collection.findOneAndUpdate(filter, update, {
      returnDocument: 'after',
    });
    if (!result) {
      throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
    }
    res.status(200).json({ ok: true, data: this.model.toResponse(result) });
  });

  // -------------------------------------------------------------------------
  // SHOW (read one)
  // -------------------------------------------------------------------------

  /**
   * GET handler. Reads the id from `req.params.id` and returns the matching
   * document.
   */
  public show = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseObjectId(req.params.id, 'id');
    const doc = await this.collection.findOne({ _id: id } as unknown as Filter<TDoc>);
    if (!doc) {
      throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
    }
    res.status(200).json({ ok: true, data: this.model.toResponse(doc) });
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  /**
   * DELETE handler. Reads the id from `req.params.id`, removes the doc, and
   * returns the deleted resource in the data key with HTTP 200.
   */
  public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseObjectId(req.params.id, 'id');
    const filter: Filter<TDoc> = { _id: id } as unknown as Filter<TDoc>;
    if (req.user?.id && ObjectId.isValid(req.user.id)) {
      (filter as Record<string, unknown>).userId = new ObjectId(req.user.id);
    }

    const doc = await this.collection.findOne(filter);
    if (!doc) {
      throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
    }

    await this.collection.deleteOne(filter);
    res.status(200).json({ ok: true, data: this.model.toResponse(doc) });
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Validates and converts a string to an ObjectId. Throws 400 on failure
 * rather than letting Mongo throw a cryptic BSON error later.
 */
function parseObjectId(raw: string, fieldName: string): ObjectId {
  if (!raw || !ObjectId.isValid(raw)) {
    throw new ApiError(400, `Invalid ${fieldName}`, 'INVALID_ID');
  }
  return new ObjectId(raw);
}

function buildIndexFilter<TDoc extends Document>(
  req: Request,
  search?: string,
  sinceDate?: Date | null,
  archived?: boolean
): Filter<TDoc> {
  const filter: Filter<TDoc> = {} as Filter<TDoc>;
  if (req.user?.id && ObjectId.isValid(req.user.id)) {
    (filter as Record<string, unknown>).userId = new ObjectId(req.user.id);
  }
  if (search) {
    (filter as Record<string, unknown>).name = { $regex: search, $options: 'i' };
  }
  if (sinceDate) {
    (filter as Record<string, unknown>).createdAt = { $gte: sinceDate };
  }
  if (archived === true) {
    (filter as Record<string, unknown>).isArchived = true;
  } else if (archived === false) {
    (filter as Record<string, unknown>).$or = [
      { isArchived: false },
      { isArchived: { $exists: false } },
    ];
  }
  return filter;
}