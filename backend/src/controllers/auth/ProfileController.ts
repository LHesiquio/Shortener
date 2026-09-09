import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { ProfileModel } from '@models/AuthModel';
import { User } from '@appTypes/user';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export class ProfileController {
  private readonly model = new ProfileModel();

  public updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userIdStr = (req as unknown as { user: { id: string } }).user.id;
    const userId = new ObjectId(userIdStr);

    const input = this.model.extractFromRequest(req);
    await this.model.validate(userId, input);

    const updateFields: Partial<User> = { updatedAt: new Date() };
    if (input.firstName !== undefined) updateFields.firstName = input.firstName.trim();
    if (input.lastName !== undefined) updateFields.lastName = input.lastName.trim();
    if (input.nickname !== undefined) updateFields.nickname = input.nickname.toLowerCase().trim();
    if (input.email !== undefined) updateFields.email = input.email.toLowerCase().trim();
    if (input.timezone !== undefined) updateFields.timezone = input.timezone.trim();

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
