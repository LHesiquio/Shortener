import type { ColorPaletteId, ThemeMode } from '@/config/theme.config';

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  timezone: string;
}

export interface SecuritySettingsData {
  twoFactorEnabled: boolean;
}

export interface PreferenceSettingsData {
  theme: ThemeMode;
  palette: ColorPaletteId;
  weeklyReport: boolean;
  securityAlerts: boolean;
}

export const TIMEZONE_OPTIONS = [
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  // Mexico & Border Timezones
  { label: 'America/Ciudad_Juarez (Juárez Time)', value: 'America/Ciudad_Juarez' },
  { label: 'America/Ojinaga (Ojinaga Border Time)', value: 'America/Ojinaga' },
  { label: 'America/Chihuahua (Chihuahua Time)', value: 'America/Chihuahua' },
  { label: 'America/Mexico_City (Central Standard Time UTC-6)', value: 'America/Mexico_City' },
  { label: 'America/Monterrey (Central Standard Time UTC-6)', value: 'America/Monterrey' },
  { label: 'America/Tijuana (Baja California / Pacific UTC-8)', value: 'America/Tijuana' },
  { label: 'America/Hermosillo (Sonora Standard Time UTC-7)', value: 'America/Hermosillo' },
  { label: 'America/Mazatlan (Pacific Standard Time UTC-7)', value: 'America/Mazatlan' },
  { label: 'America/Cancun (Eastern Standard Time UTC-5)', value: 'America/Cancun' },
  { label: 'America/Merida (Central Standard Time UTC-6)', value: 'America/Merida' },
  // United States & Canada
  { label: 'America/El_Paso (Mountain Time UTC-7)', value: 'America/El_Paso' },
  { label: 'America/Denver (Mountain Time UTC-7)', value: 'America/Denver' },
  { label: 'America/Chicago (Central Time UTC-6)', value: 'America/Chicago' },
  { label: 'America/New_York (Eastern Time UTC-5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (Pacific Time UTC-8)', value: 'America/Los_Angeles' },
  { label: 'America/Phoenix (Arizona Time UTC-7)', value: 'America/Phoenix' },
  // Central & South America
  { label: 'America/Bogota (Colombia Time UTC-5)', value: 'America/Bogota' },
  { label: 'America/Buenos_Aires (Argentina Time UTC-3)', value: 'America/Buenos_Aires' },
  { label: 'America/Santiago (Chile Time UTC-4)', value: 'America/Santiago' },
  { label: 'America/Lima (Peru Time UTC-5)', value: 'America/Lima' },
  { label: 'America/Caracas (Venezuela Time UTC-4)', value: 'America/Caracas' },
  { label: 'America/Sao_Paulo (Brazil Time UTC-3)', value: 'America/Sao_Paulo' },
  // Europe, Asia & Pacific
  { label: 'Europe/London (GMT/BST UTC+0)', value: 'Europe/London' },
  { label: 'Europe/Paris (Central European Time UTC+1)', value: 'Europe/Paris' },
  { label: 'Europe/Madrid (Central European Time UTC+1)', value: 'Europe/Madrid' },
  { label: 'Europe/Berlin (Central European Time UTC+1)', value: 'Europe/Berlin' },
  { label: 'Asia/Tokyo (Japan Standard Time UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Asia/Dubai (Gulf Standard Time UTC+4)', value: 'Asia/Dubai' },
  { label: 'Australia/Sydney (Australian Eastern Time UTC+10)', value: 'Australia/Sydney' },
];
