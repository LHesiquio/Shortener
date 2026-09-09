import { Request, Response } from 'express';
import { Collection, ObjectId, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { GeneralController } from '@controllers/GeneralController';
import { CreateProjectInput, ProjectModel } from '@models/ProjectModel';
import { Project } from '@appTypes/project';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { collection, Collections } from '@config/db';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError } from '@utils/ApiError';

export class ProjectController extends GeneralController<CreateProjectInput, Project> {
  protected readonly model = new ProjectModel();

  protected get collection(): Collection<Project> {
    return collection<Project>(Collections.Projects);
  }

  public list = this.index;

  public override show = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const project = await resolveProject(this.collection, req.params.id, userId);
    res.status(200).json({ ok: true, data: this.model.toResponse(project) });
  });

  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);

    const projectToBuild = await this.model.build(input);
    projectToBuild.userId = userId;

    const result = await this.collection.insertOne(projectToBuild as OptionalUnlessRequiredId<Project>);
    const createdDoc: WithId<Project> = { ...projectToBuild, _id: result.insertedId };

    res.status(201).json({
      ok: true,
      data: this.model.toResponse(createdDoc),
    });
  });

  public archive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const project = await resolveProject(this.collection, req.params.id, userId);

    const updated = await this.collection.findOneAndUpdate(
      { _id: project._id, userId },
      { $set: { isArchived: true, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) throw new ApiError(404, 'Project not found', 'NOT_FOUND');

    await collection<Shortlink>(Collections.Shortlinks).updateMany(
      { projectId: project._id, userId },
      { $set: { isArchived: true, updatedAt: new Date() } }
    );

    res.status(200).json({ ok: true, data: this.model.toResponse(updated) });
  });

  public unarchive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const project = await resolveProject(this.collection, req.params.id, userId);

    const updated = await this.collection.findOneAndUpdate(
      { _id: project._id, userId },
      { $set: { isArchived: false, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) throw new ApiError(404, 'Project not found', 'NOT_FOUND');

    await collection<Shortlink>(Collections.Shortlinks).updateMany(
      { projectId: project._id, userId },
      { $set: { isArchived: false, updatedAt: new Date() } }
    );

    res.status(200).json({ ok: true, data: this.model.toResponse(updated) });
  });

  public override delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const project = await resolveProject(this.collection, req.params.id, userId);

    await performCascadingProjectDelete(project._id, userId);
    await this.collection.deleteOne({ _id: project._id, userId });

    res.status(200).json({ ok: true, data: this.model.toResponse(project) });
  });
}

function getAuthenticatedUserId(req: Request): ObjectId {
  const rawUserId = (req as unknown as { user: { id: string } }).user?.id;
  if (!rawUserId || !ObjectId.isValid(rawUserId)) {
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  return new ObjectId(rawUserId);
}

async function findProjectById(
  coll: Collection<Project>,
  param: string,
  userId: ObjectId
): Promise<WithId<Project> | null> {
  if (ObjectId.isValid(param) && param.length === 24) {
    return coll.findOne({ _id: new ObjectId(param), userId });
  }
  return null;
}

async function resolveProject(
  coll: Collection<Project>,
  rawParam: string,
  userId: ObjectId
): Promise<WithId<Project>> {
  const trimmed = rawParam?.trim();
  if (!trimmed) {
    throw new ApiError(400, 'Invalid project identifier', 'INVALID_PARAM');
  }

  const byId = await findProjectById(coll, trimmed, userId);
  if (byId) return byId;

  const bySlug = await coll.findOne({ slug: trimmed.toLowerCase(), userId });
  if (bySlug) return bySlug;

  throw new ApiError(404, 'Project not found', 'NOT_FOUND');
}

async function performCascadingProjectDelete(projectId: ObjectId, userId: ObjectId): Promise<void> {
  const shortlinksColl = collection<Shortlink>(Collections.Shortlinks);
  const clicksColl = collection<ShortlinkClick>(Collections.ShortlinkClicks);

  const shortlinks = await shortlinksColl.find({ projectId, userId }).toArray();
  const shortlinkIds = shortlinks.map((s) => s._id).filter((id): id is ObjectId => Boolean(id));

  if (shortlinkIds.length > 0) {
    await clicksColl.deleteMany({ shortlinkId: { $in: shortlinkIds } });
    await shortlinksColl.deleteMany({ projectId, userId });
  }
}
