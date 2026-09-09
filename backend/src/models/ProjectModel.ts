import { Request } from 'express';
import { z } from 'zod';
import { ObjectId, WithId } from 'mongodb';
import { IBaseModel } from '@models/BaseModel';
import { Project, PublicProject } from '@appTypes/project';
import { ApiError } from '@utils/ApiError';
import { normalizeSlug, slugify, generateRandomSlug } from '@utils/slug';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i, 'Invalid slug format').optional(),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export class ProjectModel implements IBaseModel<CreateProjectInput, Project> {
  public extractFromRequest(req: Request): CreateProjectInput {
    return {
      name: req.body?.name,
      slug: req.body?.slug,
      description: req.body?.description,
    };
  }

  public validate(input: CreateProjectInput): void {
    const result = createProjectSchema.safeParse(input);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid project payload';
      throw new ApiError(400, msg, 'VALIDATION_ERROR');
    }
  }

  public build(input: CreateProjectInput): Project {
    const now = new Date();
    const resolvedSlug = input.slug?.trim()
      ? normalizeSlug(input.slug)
      : slugify(input.name) || `project-${generateRandomSlug()}`;

    return {
      userId: new ObjectId(),
      name: input.name.trim(),
      slug: resolvedSlug,
      description: input.description?.trim(),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  public toResponse(doc: WithId<Project>): PublicProject {
    return {
      id: doc._id.toHexString(),
      userId: doc.userId.toHexString(),
      name: doc.name,
      slug: doc.slug || slugify(doc.name) || doc._id.toHexString(),
      description: doc.description,
      isArchived: Boolean(doc.isArchived),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

/** Alias for backward compatibility if imported elsewhere */
export const CreateProjectModel = ProjectModel;
