/* eslint-disable no-console */
/**
 * Quick smoke test for the Phase 2 services.
 * Run with: npx ts-node src/scripts/smoke-phase2.ts
 */
import { MongoClient, ObjectId } from 'mongodb';
import { PasswordService } from '@services/PasswordService';
import { TokenService } from '@services/TokenService';
import { env } from '@config/env';
import { connect, close } from '@config/db';

async function exerciseAuth(userId: ObjectId): Promise<void> {
  await exercisePassword();
  await exerciseAccessToken(userId);
  await exerciseRefreshFlow(userId);
}

async function exercisePassword(): Promise<void> {
  const hash = await PasswordService.hash('super-secret-123');
  console.log('Hash:', hash.slice(0, 20), '...');
  console.log('Compare correct password:', await PasswordService.compare('super-secret-123', hash));
  console.log('Compare wrong password:', await PasswordService.compare('wrong', hash));
}

async function exerciseAccessToken(userId: ObjectId): Promise<void> {
  const access = TokenService.issueAccessToken(userId);
  console.log('Access token (first 30):', access.slice(0, 30) + '...');
  console.log('Decoded access sub:', TokenService.verifyAccessToken(access).sub);
}

async function exerciseRefreshFlow(userId: ObjectId): Promise<void> {
  const ctx = { userAgent: 'smoke-test', ip: '127.0.0.1' };
  const refresh = await TokenService.issueRefreshToken({ userId, ...ctx });
  console.log('Refresh raw (first 30):', refresh.rawToken.slice(0, 30) + '...');
  console.log('Verified refresh jti:', (await TokenService.verifyRefreshToken(refresh.rawToken)).jti);

  const rotated = await TokenService.rotateRefreshToken(refresh.rawToken, ctx);
  console.log('Rotated access (first 30):', rotated.accessToken.slice(0, 30) + '...');

  await expectRejection(
    () => TokenService.verifyRefreshToken(refresh.rawToken),
    'Old refresh after rotation correctly rejected'
  );

  await TokenService.revokeAllForUser(userId);
  await expectRejection(
    () => TokenService.verifyRefreshToken(rotated.refreshToken),
    'Revoked refresh correctly rejected'
  );
}

async function expectRejection(action: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await action();
    console.log(`ERROR: ${label} — expected rejection`);
  } catch (err) {
    console.log(`${label}:`, (err as Error).message);
  }
}

async function main(): Promise<void> {
  await connect();
  const cleanupClient = await MongoClient.connect(env.MONGO_URL, { serverSelectionTimeoutMS: 3000 });
  const db = cleanupClient.db(env.MONGO_DB);
  const userId = new ObjectId();
  console.log('User id:', userId.toHexString());

  await exerciseAuth(userId);

  const count = await db.collection('refresh_tokens').countDocuments({ userId });
  console.log('Persisted records for user:', count, '(expected 2, both revoked, cleaned by TTL)');

  await cleanupClient.close();
  await close();
  console.log('OK');
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err);
  process.exit(1);
});