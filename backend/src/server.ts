import { createApp } from '@/app';
import { env } from '@config/env';
import { connect, close, ensureIndexes } from '@config/db';

async function bootstrap(): Promise<void> {
  const app = createApp();

  try {
    await connect();
    await ensureIndexes();
  } catch (error) {
    console.error('[bootstrap] Failed to connect to MongoDB:', error);
    // Continue without DB so /api/health is still reachable; controllers will
    // surface a clear 503 once they need the database.
  }

  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://127.0.0.1:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap();