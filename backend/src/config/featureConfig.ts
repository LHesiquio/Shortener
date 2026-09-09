import featureConfigJson from './feature_config.json';
import type { FeatureConfigMap, FeatureDefinition } from '../types/FeatureConfig.types';

export const featureConfig = featureConfigJson as FeatureConfigMap;

export function getFeatureDefinition(featureKey: string): FeatureDefinition | undefined {
  return featureConfig[featureKey];
}
