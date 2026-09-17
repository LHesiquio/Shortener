import { Document, ObjectId } from 'mongodb';

/**
 * The shape of a user document as it lives in MongoDB.
 *
 * `_id` is optional in the type because Mongo assigns it at insertion time
 * (the `WithId<User>` flavour is what `findOne` returns).
 */
export interface User extends Document {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  nickname: string;
  /** 'active' once verified (or always, if email verification is disabled). */
  status: 'active' | 'inactive';
  timezone?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorTempSecret?: string | null;
  twoFactorBackupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Public projection of a user — never includes `passwordHash` or 2FA secrets. */
export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  status: User['status'];
  timezone?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};