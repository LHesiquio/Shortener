import { getFeatureDefinition } from '../config/featureConfig';
import type { FeatureCapability } from '../types/FeatureConfig.types';

export const FeatureHelper = {
  hasFeature(featureKey: string, capability: FeatureCapability): boolean {
    const def = getFeatureDefinition(featureKey);
    if (!def) return false;
    return Boolean(def.supportedFeatures[capability]);
  },

  getSearchFields(featureKey: string): string[] {
    const def = getFeatureDefinition(featureKey);
    return def?.searchFields ?? [];
  },

  getDefaultPageSize(featureKey: string, fallback = 10): number {
    const def = getFeatureDefinition(featureKey);
    return def?.defaultPageSize ?? fallback;
  },
};
