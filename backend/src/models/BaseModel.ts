import { Request } from 'express';
import { Collection, Document, WithId } from 'mongodb';
import { ApiError } from '@utils/ApiError';

/**
 * The contract every "model" in the project must satisfy.
 *
 * The four methods are the four steps of the CRUD pipeline that the
 * `GeneralController` orchestrates. By keeping them as an interface we get
 * a single, type-safe seam between the controller (orchestration) and the
 * model (domain knowledge).
 *
 * Type parameters:
 *  - TInput: the shape coming out of `extractFromRequest` (the raw payload).
 *  - TDoc:   the shape stored in MongoDB.
 *
 * @example
 *   interface UserInput { email: string; password: string; }
 *   interface UserDoc { email: string; passwordHash: string; }
 *
 *   class UserModel implements IBaseModel<UserInput, UserDoc> {
 *     extractFromRequest(req) { return req.body; }
 *     validate(input)         { ... }
 *     build(input)            { ... }
 *     toResponse(doc)         { return { id: doc._id, email: doc.email }; }
 *   }
 */
export interface IBaseModel<TInput, TDoc extends Document> {
  /**
   * Pulls the raw input out of an Express request. Should NOT validate.
   * Keeps the controller ignorant of where the data lives (body / params /
   * query / headers).
   */
  extractFromRequest(req: Request): TInput;

  /**
   * Validates the input and throws an `ApiError(400)` on failure. May be
   * synchronous or async (e.g. for uniqueness checks against the DB).
   */
  validate(input: TInput): void | Promise<void>;

  /**
   * Transforms validated input into a document ready to be inserted /
   * updated in MongoDB (e.g. hashing a password, defaulting timestamps).
   */
  build(input: TInput): TDoc | Promise<TDoc>;

  /**
   * Projects a stored document into the public-facing response shape
   * (e.g. strip `passwordHash`). The document is always passed as the
   * Mongo `WithId<TDoc>` flavour, which is what `findOne` returns.
   * Returns `unknown` so the controller can hand it straight to
   * `res.json` without further casting.
   */
  toResponse(doc: WithId<TDoc>): unknown;
}

/**
 * Optional hooks a model can implement to participate in update / show
 * operations. Defined as a separate interface so a model can opt-in only
 * to what it actually needs.
 */
export interface IModelWithBuildForUpdate<TInput, TDoc extends Document> {
  /** Same as `build` but for updates. Defaults to `build` if not provided. */
  buildForUpdate?(input: TInput): TDoc | Promise<TDoc>;
}

/**
 * Reserved base class that all model "behaviour helpers" extend.
 * Currently it just exposes a couple of convenience methods to throw
 * consistent ApiErrors. It is not mandatory to extend it — implementing
 * `IBaseModel` is enough — but it keeps the code DRY.
 */
export abstract class BaseModel<TInput, TDoc extends Document> implements IBaseModel<TInput, TDoc> {
  protected abstract readonly collection: Collection<TDoc>;

  public abstract extractFromRequest(req: Request): TInput;
  public abstract validate(input: TInput): void | Promise<void>;
  public abstract build(input: TInput): TDoc | Promise<TDoc>;
  public abstract toResponse(doc: WithId<TDoc>): unknown;

  /** Throws a 400 ApiError with the given message. */
  protected failValidation(message: string, details?: unknown): never {
    throw new ApiError(400, message, 'VALIDATION_ERROR', details);
  }

  /** Throws a 404 ApiError. */
  protected failNotFound(message = 'Resource not found'): never {
    throw new ApiError(404, message, 'NOT_FOUND');
  }
}