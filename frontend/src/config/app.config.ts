export const APP_CONFIG = {
  name: 'LinkTracker',
  version: '2.4.1',
  releaseStage: 'Alpha',
  tagline: 'Digital Garden',
} as const;

export type AppConfig = typeof APP_CONFIG;
export type AppReleaseStage = typeof APP_CONFIG.releaseStage;
