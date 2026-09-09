import type { FeatureConfigMap, FeatureCapability, FeatureDefinition } from '@/types/featureConfig.types';

export const FEATURE_CONFIG: FeatureConfigMap = {
  shortlinks: {
    key: 'shortlinks',
    name: 'Shortlinks',
    endpoint: '/api/shortlinks',
    supportedFeatures: {
      pagination: true,
      search: true,
      sorting: true,
      archiving: true,
      analytics: true,
    },
    searchFields: ['slug', 'url', 'title'],
    defaultPageSize: 10,
  },
  projects: {
    key: 'projects',
    name: 'Projects',
    endpoint: '/api/projects',
    supportedFeatures: {
      pagination: true,
      search: true,
      sorting: true,
      archiving: false,
      analytics: false,
    },
    searchFields: ['name', 'description'],
    defaultPageSize: 10,
  },
  clicks: {
    key: 'clicks',
    name: 'Clicks Log',
    endpoint: '/api/clicks',
    supportedFeatures: {
      pagination: true,
      search: true,
      sorting: true,
      archiving: false,
      analytics: true,
    },
    searchFields: ['slug', 'ip', 'referer', 'userAgent', 'geo.city', 'geo.country'],
    defaultPageSize: 10,
  },
};

export function getFeatureDefinition(featureKey: string): FeatureDefinition | undefined {
  return FEATURE_CONFIG[featureKey];
}

export function getFeatureEndpoint(featureKey: string, fallback: string): string {
  return FEATURE_CONFIG[featureKey]?.endpoint ?? fallback;
}

export function getFeaturePageSize(featureKey: string, fallback = 10): number {
  return FEATURE_CONFIG[featureKey]?.defaultPageSize ?? fallback;
}

export function isFeatureSupported(featureKey: string, capability: FeatureCapability): boolean {
  return Boolean(FEATURE_CONFIG[featureKey]?.supportedFeatures?.[capability]);
}
