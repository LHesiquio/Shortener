import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { User } from '@appTypes/user';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export class DeactivateAccountController {
  public deactivate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as Request & { user?: { id: string } };
    if (!authReq.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const userId = new ObjectId(authReq.user.id);
    const users = collection<User>(Collections.Users);
    const user = await users.findOne({ _id: userId });

    if (!user) {
      throw new ApiError(404, 'User account not found', 'USER_NOT_FOUND');
    }

    await users.updateOne(
      { _id: userId },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    );

    res.json({
      ok: true,
      message: 'Account deactivated successfully',
    });
  });
}
