import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collection, Collections } from '@config/db';
import { PublicUser, User } from '@appTypes/user';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Handles `GET /api/auth/me` (protected by `authMiddleware`).
 *
 * Returns the public projection of the user identified by the access
 * token in the `Authorization: Bearer ...` header. Used by the front
 * to rehydrate the session on app load.
 */
export class MeController {
  public me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.extractUserId(req);
    const user = await collection<User>(Collections.Users).findOne({ _id: userId });
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }
    const publicUser: PublicUser = {
      id: user._id.toHexString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      status: user.status,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    res.status(200).json({ ok: true, data: publicUser });
  });

  private extractUserId(req: Request): ObjectId {
    const id = req.user?.id;
    if (!id) {
      // Should be unreachable behind authMiddleware, but guards us if a
      // future route forgets to mount it.
      throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    }
    return new ObjectId(id);
  }
}
