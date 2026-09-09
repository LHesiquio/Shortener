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
  createdAt: Date;
  updatedAt: Date;
}

/** Public projection of a user — never includes `passwordHash`. */
export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  status: User['status'];
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
};