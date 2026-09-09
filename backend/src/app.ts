import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@config/env';
import { errorHandler } from '@middlewares/errorHandler';
import { noSanitize } from '@middlewares/noSanitize';
import { authRouter } from '@/routes/auth.routes';
import { shortlinksRouter } from '@/routes/shortlinks.routes';
import { redirectRouter } from '@/routes/redirect.routes';
import { projectRouter } from '@/routes/project.routes';
import { slugRouter } from '@/routes/slug.routes';
import analyticsRouter from '@/routes/analytics.routes';
import { authMiddleware } from '@middlewares/authMiddleware';

/**
 * Builds the Express application.
 *
 * This factory keeps the Express setup independent of the bootstrap file so
 * we can spin up multiple app instances in tests without spawning listeners.
 */
export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('ngrok-free.app') || origin.includes('ngrok.io')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(noSanitize);

  // Health check kept here so smoke tests have something to hit during
  // the infra phases (before any feature routes are wired up).
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, status: 'up' });
  });

  app.use('/api/auth', authRouter);

  // Public shortlink redirect at /r/:slug (no auth).
  app.use('/r', redirectRouter);

  // Protected CRUD for shortlinks, projects, analytics, and slugs.
  app.use('/api/shortlinks', authMiddleware, shortlinksRouter);
  app.use('/api/projects', authMiddleware, projectRouter);
  app.use('/api/analytics', authMiddleware, analyticsRouter);
  app.use('/api/slugs', authMiddleware, slugRouter);

  // Final error handler must be last.
  app.use(errorHandler);

  return app;
}