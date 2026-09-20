import { Collection, MongoClient, Db, Document } from 'mongodb';
import { env } from '@config/env';
import { RefreshTokenRecord } from '@appTypes/jwt';
import { User } from '@appTypes/user';
import { Shortlink, ShortlinkClick } from '@appTypes/shortlink';
import { ExportJob } from '@appTypes/exportJob';
import { slugify } from '@utils/slug';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  client = await MongoClient.connect(env.MONGO_URL, {
    serverSelectionTimeoutMS: 3000,
  });
  db = client.db(env.MONGO_DB);
  console.log(`[db] Connected to MongoDB at ${env.MONGO_URL}, db="${env.MONGO_DB}"`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connect() before getDb().');
  }
  return db;
}

export async function close(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

/** Convenience collection accessor with typing. */
export function collection<T extends Document = Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

/** Reserved collection names — single source of truth. */
export enum Collections {
  Users = 'users',
  RefreshTokens = 'refresh_tokens',
  Shortlinks = 'shortlinks',
  ShortlinkClicks = 'shortlink_clicks',
  Projects = 'projects',
  ExportJobs = 'export_jobs',
}

async function backfillProjectSlugs(database: Db): Promise<void> {
  const projectsColl = database.collection(Collections.Projects);
  const unslugged = await projectsColl.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  }).toArray();

  for (const doc of unslugged) {
    const baseSlug = slugify(doc.name || '') || 'project';
    let candidate = baseSlug;
    let counter = 1;
    while (await projectsColl.findOne({ userId: doc.userId, slug: candidate, _id: { $ne: doc._id } })) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
    await projectsColl.updateOne({ _id: doc._id }, { $set: { slug: candidate } });
  }
}

async function ensureUserAndTokenIndexes(database: Db): Promise<void> {
  await database.collection<User>(Collections.Users).createIndexes([
    { key: { email: 1 }, name: 'users_email_unique', unique: true },
    { key: { nickname: 1 }, name: 'users_nickname_unique', unique: true },
    { key: { email: 1, isVerified: 1 }, name: 'users_email_isVerified' },
    {
      key: { twoFactorEnabled: 1 },
      name: 'users_twoFactorEnabled_partial',
      partialFilterExpression: { twoFactorEnabled: true },
    },
    { key: { status: 1, twoFactorEnabled: 1 }, name: 'users_status_twoFactorEnabled' },
  ]);

  await database.collection<RefreshTokenRecord>(Collections.RefreshTokens).createIndexes([
    { key: { jti: 1 }, name: 'refresh_tokens_jti_unique', unique: true },
    { key: { expiresAt: 1 }, name: 'refresh_tokens_ttl', expireAfterSeconds: 0 },
    { key: { userId: 1 }, name: 'refresh_tokens_userId' },
  ]);
}

async function ensureShortlinkAndProjectIndexes(database: Db): Promise<void> {
  await database.collection<Shortlink>(Collections.Shortlinks).createIndexes([
    { key: { slug: 1 }, name: 'shortlinks_slug_unique', unique: true },
    { key: { userId: 1, createdAt: -1 }, name: 'shortlinks_userId_createdAt' },
    { key: { userId: 1, active: 1, createdAt: -1 }, name: 'shortlinks_userId_active_createdAt' },
    { key: { userId: 1, isArchived: 1, createdAt: -1 }, name: 'shortlinks_userId_isArchived_createdAt' },
    { key: { userId: 1, projectId: 1, isArchived: 1, createdAt: -1 }, name: 'shortlinks_userId_projectId_isArchived_createdAt' },
    { key: { userId: 1, clicksCount: -1 }, name: 'shortlinks_userId_clicksCount' },
    { key: { userId: 1, projectId: 1 }, name: 'shortlinks_userId_projectId' },
    { key: { projectId: 1 }, name: 'shortlinks_projectId' },
  ]);

  await database.collection(Collections.Projects).createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: 'projects_userId_createdAt' },
    { key: { userId: 1, isArchived: 1, createdAt: -1 }, name: 'projects_userId_isArchived_createdAt' },
    { key: { userId: 1, name: 1 }, name: 'projects_userId_name_unique', unique: true },
    { key: { userId: 1, slug: 1 }, name: 'projects_userId_slug_unique', unique: true },
    { key: { slug: 1 }, name: 'projects_slug' },
  ]);
}

async function ensureClickIndexes(database: Db): Promise<void> {
  const clickIndexes: Array<{ key: Record<string, 1 | -1>; name: string; expireAfterSeconds?: number }> = [
    { key: { shortlinkId: 1, timestamp: -1 }, name: 'shortlink_clicks_shortlinkId_timestamp' },
    { key: { shortlinkId: 1, timestamp: -1, 'device.type': 1 }, name: 'shortlink_clicks_analytics_composite' },
    { key: { timestamp: -1 }, name: 'shortlink_clicks_timestamp' },
  ];
  if (env.SHORTLINK_CLICK_TTL_MS > 0) {
    const seconds = Math.floor(env.SHORTLINK_CLICK_TTL_MS / 1000);
    clickIndexes.push({ key: { timestamp: 1 }, name: 'shortlink_clicks_ttl', expireAfterSeconds: seconds });
  }
  await database.collection<ShortlinkClick>(Collections.ShortlinkClicks).createIndexes(clickIndexes);
}

async function ensureExportJobIndexes(database: Db): Promise<void> {
  await database.collection<ExportJob>(Collections.ExportJobs).createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: 'export_jobs_userId_createdAt' },
    { key: { userId: 1, status: 1, createdAt: -1 }, name: 'export_jobs_userId_status_createdAt' },
    { key: { expiresAt: 1 }, name: 'export_jobs_expiresAt' },
  ]);
}

export async function ensureIndexes(): Promise<void> {
  const database = getDb();
  await ensureUserAndTokenIndexes(database);
  await backfillProjectSlugs(database);
  await ensureShortlinkAndProjectIndexes(database);
  await ensureClickIndexes(database);
  await ensureExportJobIndexes(database);
  console.log('[db] Indexes ensured');
}
