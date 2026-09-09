import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ChangePasswordModel } from '@models/AuthModel';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export class ChangePasswordController {
  private changePasswordModel = new ChangePasswordModel();

  public changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as Request & { user?: { id: string } };
    if (!authReq.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const userId = new ObjectId(authReq.user.id);
    const input = this.changePasswordModel.extractFromRequest(req);
    await this.changePasswordModel.execute(userId, input);

    res.json({
      ok: true,
      message: 'Password changed successfully',
    });
  });
}
