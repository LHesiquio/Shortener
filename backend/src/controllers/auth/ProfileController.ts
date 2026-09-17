import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { ProfileModel, ProfileUpdateInput } from '@models/AuthModel';
import { User } from '@appTypes/user';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export class ProfileController {
  private readonly model = new ProfileModel();

  public updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userIdStr = req.user?.id;
    if (!userIdStr) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }
    const userId = new ObjectId(userIdStr);

    const input = this.model.extractFromRequest(req);
    await this.model.validate(userId, input);

    const updateFields = buildProfileUpdateFields(input);
    const result = await collection<User>(Collections.Users).findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.status(200).json({ ok: true, data: this.model.toResponse(result) });
  });
}

function buildProfileUpdateFields(input: ProfileUpdateInput): Partial<User> {
  const fields: Partial<User> = { updatedAt: new Date() };
  assignIfPresent(fields, 'firstName', input.firstName?.trim());
  assignIfPresent(fields, 'lastName', input.lastName?.trim());
  assignIfPresent(fields, 'nickname', input.nickname?.toLowerCase().trim());
  assignIfPresent(fields, 'email', input.email?.toLowerCase().trim());
  assignIfPresent(fields, 'timezone', input.timezone?.trim());
  return fields;
}

function assignIfPresent(target: Partial<User>, key: keyof User, value?: string): void {
  if (value !== undefined) {
    (target as Record<string, unknown>)[key] = value;
  }
}
