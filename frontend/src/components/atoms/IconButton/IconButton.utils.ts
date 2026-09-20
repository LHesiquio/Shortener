export function resolveVariantClass(variant: string): string {
  return variant === 'default' ? '' : `icon-btn-${variant}`;
}
