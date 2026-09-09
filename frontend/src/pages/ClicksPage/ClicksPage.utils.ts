const DEVICE_ICON_MAP: Record<string, string> = {
  mobile: 'smartphone',
  phone: 'smartphone',
  tablet: 'tablet',
  ipad: 'tablet',
  bot: 'bot',
  spider: 'bot',
  crawler: 'bot',
  laptop: 'laptop',
  desktop: 'monitor',
};

export function getClicksDeviceIcon(type?: string): string {
  const normalized = (type || '').toLowerCase();
  for (const [key, icon] of Object.entries(DEVICE_ICON_MAP)) {
    if (normalized.includes(key)) return icon;
  }
  return 'monitor';
}

export interface RefererBadgeInfo {
  label: string;
  variant: 'direct' | 'search' | 'social' | 'external';
  icon: string;
}

const SEARCH_REGEX = /google|bing|duckduckgo|yahoo|ecosia|baidu/i;
const SOCIAL_REGEX = /twitter|t\.co|facebook|instagram|reddit|linkedin|youtube|twitch|tiktok/i;
const DIRECT_SET = new Set(['', 'direct', 'unknown', 'none']);

export function getRefererBadgeInfo(referer?: string): RefererBadgeInfo {
  const ref = (referer || '').trim();
  if (DIRECT_SET.has(ref.toLowerCase())) {
    return { label: 'Direct', variant: 'direct', icon: 'send' };
  }
  if (SEARCH_REGEX.test(ref)) {
    return { label: ref, variant: 'search', icon: 'search' };
  }
  if (SOCIAL_REGEX.test(ref)) {
    return { label: ref, variant: 'social', icon: 'sparkles' };
  }
  return { label: ref, variant: 'external', icon: 'link' };
}
