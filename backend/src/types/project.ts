import { Document, ObjectId } from 'mongodb';

export interface Project extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  slug: string;
  description?: string;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicProject = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
};
