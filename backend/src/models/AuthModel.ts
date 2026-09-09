import { Request } from 'express';
import { z } from 'zod';
import { WithId } from 'mongodb';
import { IBaseModel } from '@models/BaseModel';
import { collection, Collections } from '@config/db';
import { env } from '@config/env';
import { PublicUser, User } from '@appTypes/user';
import { PasswordService } from '@services/PasswordService';
import { ApiError } from '@utils/ApiError';
import { resolveIanaTimezone } from '@utils/timezone.utils';

// ---------------------------------------------------------------------------
// 1. LOGIN MODEL
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export class LoginModel implements IBaseModel<LoginInput, User> {
  public extractFromRequest(req: Request): LoginInput {
    return {
      email: req.body?.email,
      password: req.body?.password,
      remember: req.body?.remember,
    };
  }

  public validate(input: LoginInput): void {
    const result = loginSchema.safeParse(input);
    if (!result.success) {
      throw new ApiError(400, 'Invalid login payload', 'VALIDATION_ERROR');
    }
  }

  public async build(input: LoginInput): Promise<WithId<User>> {
    const user = await collection<User>(Collections.Users).findOne({ email: input.email });
    if (!user) {
      await PasswordService.compare(input.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalido');
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }
    const ok = await PasswordService.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }
    if (user.status === 'inactive') {
      throw new ApiError(403, 'Account is not active', 'ACCOUNT_INACTIVE');
    }
    return user;
  }

  public toResponse(doc: WithId<User>): PublicUser {
    return {
      id: doc._id.toHexString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      nickname: doc.nickname,
      status: doc.status,
      timezone: doc.timezone,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. REGISTER MODEL
// ---------------------------------------------------------------------------

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
  timezone?: string;
}

const registerSchema = z.object({
  email: z.string().email().max(120).transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be at most 128 characters'),
  firstName: z.string().min(1).max(60).transform((v) => v.trim()),
  lastName: z.string().min(1).max(60).transform((v) => v.trim()),
  nickname: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'nickname may only contain letters, numbers, _, ., -')
    .transform((v) => v.toLowerCase().trim()),
  timezone: z.string().max(100).optional(),
});

export class RegisterModel implements IBaseModel<RegisterInput, User> {
  public extractFromRequest(req: Request): RegisterInput {
    const body = req.body ?? {};
    return {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      nickname: body.nickname,
      timezone: body.timezone,
    };
  }

  public async validate(input: RegisterInput): Promise<void> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ApiError(400, issue?.message ?? 'Invalid registration payload', 'VALIDATION_ERROR', {
        issues: parsed.error.issues,
      });
    }
    await assertEmailIsFree(parsed.data.email);
    await assertNicknameIsFree(parsed.data.nickname);
  }

  public async build(input: RegisterInput): Promise<User> {
    const passwordHash = await PasswordService.hash(input.password);
    const now = new Date();
    const status: User['status'] = env.EMAIL_VERIFICATION_ENABLED ? 'inactive' : 'active';
    return {
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      nickname: input.nickname.toLowerCase().trim(),
      status,
      // Always store a valid IANA timezone — 'auto' must never reach MongoDB
      timezone: resolveIanaTimezone(input.timezone),
      createdAt: now,
      updatedAt: now,
    };
  }

  public toResponse(doc: User & { _id: import('mongodb').ObjectId }): PublicUser {
    return {
      id: String(doc._id),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      nickname: doc.nickname,
      status: doc.status,
      timezone: doc.timezone,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. PROFILE MODEL (Settings / Updates)
// ---------------------------------------------------------------------------

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  nickname: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  email: z.string().email().max(120).optional(),
  timezone: z.string().max(100).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export class ProfileModel {
  public extractFromRequest(req: Request): ProfileUpdateInput {
    const body = req.body ?? {};
    return {
      firstName: body.firstName,
      lastName: body.lastName,
      nickname: body.nickname,
      email: body.email,
      timezone: body.timezone,
    };
  }

  public async validate(userId: import('mongodb').ObjectId, input: ProfileUpdateInput): Promise<void> {
    const parsed = profileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ApiError(400, issue?.message ?? 'Invalid profile update payload', 'VALIDATION_ERROR');
    }
    // Reject 'auto' and non-IANA timezone strings before they reach the DB
    if (input.timezone !== undefined) {
      const resolved = resolveIanaTimezone(input.timezone);
      // Mutate in place so ProfileController.updateProfile receives the clean value
      input.timezone = resolved;
    }
    if (input.email) {
      const existing = await collection<User>(Collections.Users).findOne({
        email: input.email.toLowerCase().trim(),
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ApiError(409, 'Email already registered by another account', 'EMAIL_TAKEN');
      }
    }
    if (input.nickname) {
      const existing = await collection<User>(Collections.Users).findOne({
        nickname: input.nickname.toLowerCase().trim(),
        _id: { $ne: userId },
      });
      if (existing) {
        throw new ApiError(409, 'Nickname already taken', 'NICKNAME_TAKEN');
      }
    }
  }

  public toResponse(doc: WithId<User>): PublicUser {
    return {
      id: doc._id.toHexString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      nickname: doc.nickname,
      status: doc.status,
      timezone: doc.timezone,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// 4. CHANGE PASSWORD MODEL
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export class ChangePasswordModel {
  public extractFromRequest(req: Request): ChangePasswordInput {
    const body = req.body ?? {};
    return {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    };
  }

  public validate(input: ChangePasswordInput): void {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ApiError(400, issue?.message ?? 'Invalid password change payload', 'VALIDATION_ERROR');
    }
  }

  public async execute(userId: import('mongodb').ObjectId, input: ChangePasswordInput): Promise<void> {
    this.validate(input);

    const users = collection<User>(Collections.Users);
    const user = await users.findOne({ _id: userId });
    if (!user) {
      throw new ApiError(404, 'User account not found', 'USER_NOT_FOUND');
    }

    const isValidCurrent = await PasswordService.compare(input.currentPassword, user.passwordHash);
    if (!isValidCurrent) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    const newHash = await PasswordService.hash(input.newPassword);
    await users.updateOne(
      { _id: userId },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );
  }
}

async function assertEmailIsFree(email: string): Promise<void> {
  const users = collection<User>(Collections.Users);
  const existing = await users.findOne(
    { email: email.toLowerCase().trim() },
    { projection: { _id: 1 } }
  );
  if (existing) {
    throw new ApiError(409, 'Email already registered', 'EMAIL_TAKEN');
  }
}

async function assertNicknameIsFree(nickname: string): Promise<void> {
  const users = collection<User>(Collections.Users);
  const existing = await users.findOne(
    { nickname: nickname.toLowerCase().trim() },
    { projection: { _id: 1 } }
  );
  if (existing) {
    throw new ApiError(409, 'Nickname already taken', 'NICKNAME_TAKEN');
  }
}

// ---------------------------------------------------------------------------
// 5. FORGOT PASSWORD MODEL
// ---------------------------------------------------------------------------

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').max(120).transform((v) => v.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export class ForgotPasswordModel {
  public extractFromRequest(req: Request): ForgotPasswordInput {
    return {
      email: req.body?.email,
    };
  }

  public validate(input: ForgotPasswordInput): ForgotPasswordInput {
    const result = forgotPasswordSchema.safeParse(input);
    if (!result.success) {
      throw new ApiError(400, 'Valid email is required', 'VALIDATION_ERROR');
    }
    return result.data;
  }
}

// ---------------------------------------------------------------------------
// 6. RESET PASSWORD MODEL
// ---------------------------------------------------------------------------

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export class ResetPasswordModel {
  public extractFromRequest(req: Request): ResetPasswordInput {
    return {
      token: req.body?.token,
      password: req.body?.password,
    };
  }

  public validate(input: ResetPasswordInput): ResetPasswordInput {
    const result = resetPasswordSchema.safeParse(input);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new ApiError(400, issue?.message ?? 'Invalid password reset payload', 'VALIDATION_ERROR');
    }
    return result.data;
  }
}
