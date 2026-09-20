/**
 * browserNotification.service.ts
 *
 * Thin wrapper around the Web Notifications API. Isolated here so components
 * never touch `window.Notification` directly and permission handling stays in
 * one place. Falls back silently when unsupported or not granted.
 */

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface BrowserNotificationPayload {
  title: string;
  body: string;
  tag?: string;
}

function getApi(): typeof Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return window.Notification;
}

export const browserNotificationService = {
  isSupported(): boolean {
    return getApi() !== null;
  },

  getPermission(): NotificationPermissionState {
    const api = getApi();
    return api ? (api.permission as NotificationPermissionState) : 'unsupported';
  },

  async requestPermission(): Promise<NotificationPermissionState> {
    const api = getApi();
    if (!api) return 'unsupported';
    const result = await api.requestPermission();
    return result as NotificationPermissionState;
  },

  notify({ title, body, tag }: BrowserNotificationPayload): void {
    const api = getApi();
    if (!api || api.permission !== 'granted') return;
    try {
      new api(title, { body, tag, icon: '/favicon.ico' });
    } catch {
      // Some browsers reject notifications created outside a user gesture.
    }
  },
};
