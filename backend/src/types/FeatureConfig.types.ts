export interface SupportedFeaturesMap {
  pagination: boolean;
  search: boolean;
  sorting: boolean;
  archiving: boolean;
  analytics: boolean;
}

export type FeatureCapability = keyof SupportedFeaturesMap;

export interface FeatureDefinition {
  key: string;
  name: string;
  endpoint: string;
  supportedFeatures: SupportedFeaturesMap;
  searchFields: string[];
  defaultPageSize: number;
}

export type FeatureConfigMap = Record<string, FeatureDefinition>;
