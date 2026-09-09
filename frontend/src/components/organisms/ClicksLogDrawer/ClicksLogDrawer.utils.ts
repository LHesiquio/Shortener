const DEVICE_ICON_MAP: [RegExp, string][] = [
  [/mobile|phone/i, 'smartphone'],
  [/tablet|ipad/i, 'tablet'],
  [/bot|spider|crawler/i, 'bot'],
  [/laptop/i, 'laptop'],
];

export function getClicksLogDeviceIcon(type?: string): string {
  if (!type) return 'desktop';
  const match = DEVICE_ICON_MAP.find(([pattern]) => pattern.test(type));
  return match ? match[1] : 'desktop';
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
