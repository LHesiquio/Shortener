import type { PublicProject, PublicShortlink } from '@/types/shortlink.types';
import type { TimezoneOption, FormatOption, ExportFieldOption } from './ExportLogsModal.types';

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { id: 'America/Mexico_City', label: 'Central Time (Mexico)', city: 'Mexico City', offset: 'UTC-6' },
  { id: 'America/Ciudad_Juarez', label: 'Mountain Time (Border)', city: 'Ciudad Juárez', offset: 'UTC-6' },
  { id: 'America/Monterrey', label: 'Central Time (North)', city: 'Monterrey', offset: 'UTC-6' },
  { id: 'America/Tijuana', label: 'Pacific Time (Border)', city: 'Tijuana', offset: 'UTC-7' },
  { id: 'America/Bogota', label: 'Colombia Time', city: 'Bogotá', offset: 'UTC-5' },
  { id: 'America/Lima', label: 'Peru Time', city: 'Lima', offset: 'UTC-5' },
  { id: 'America/Santiago', label: 'Chile Time', city: 'Santiago', offset: 'UTC-4' },
  { id: 'America/Buenos_Aires', label: 'Argentina Time', city: 'Buenos Aires', offset: 'UTC-3' },
  { id: 'America/Sao_Paulo', label: 'Brasilia Time', city: 'São Paulo', offset: 'UTC-3' },
  { id: 'America/New_York', label: 'Eastern Time (US)', city: 'New York', offset: 'UTC-4' },
  { id: 'America/Chicago', label: 'Central Time (US)', city: 'Chicago', offset: 'UTC-5' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (US)', city: 'Los Angeles', offset: 'UTC-7' },
  { id: 'Europe/Madrid', label: 'Central European Time', city: 'Madrid', offset: 'UTC+2' },
  { id: 'Europe/London', label: 'Greenwich Mean Time', city: 'London', offset: 'UTC+1' },
  { id: 'UTC', label: 'Universal Coordinated Time', city: 'UTC Standard', offset: 'UTC+0' },
];

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'csv',
    title: 'CSV Spreadsheet',
    ext: '.csv',
    description: 'Comma-separated values compatible with Excel, Google Sheets, Numbers.',
    icon: 'table',
    badge: 'Universal',
  },
  {
    format: 'xlsx',
    title: 'Microsoft Excel',
    ext: '.xlsx',
    description: 'Formatted workbook with styled header rows, custom widths, and cell borders.',
    icon: 'grid_view',
    badge: 'Spreadsheet',
  },
  {
    format: 'pdf',
    title: 'PDF Document',
    ext: '.pdf',
    description: 'Printable executive audit report with LinkTracker header and paginated records.',
    icon: 'description',
    badge: 'Document',
  },
  {
    format: 'json',
    title: 'JSON Dataset',
    ext: '.json',
    description: 'Raw structured JSON with audit metadata for developers and API pipelines.',
    icon: 'code',
    badge: 'Raw Data',
  },
];

export const AVAILABLE_FIELDS: ExportFieldOption[] = [
  { id: 'timestamp', label: 'Timestamp', description: 'Formatted date & time in chosen timezone', icon: 'schedule' },
  { id: 'slug', label: 'Slug', description: 'Shortlink identifier code (/{slug})', icon: 'link' },
  { id: 'country', label: 'Country', description: 'Origin country name', icon: 'public' },
  { id: 'region', label: 'Region / State', description: 'Geographic state or province', icon: 'map' },
  { id: 'city', label: 'City', description: 'Origin city name', icon: 'location_city' },
  { id: 'referer', label: 'Referrer URL', description: 'HTTP referrer header or Direct', icon: 'arrow_outward' },
  { id: 'deviceType', label: 'Device Type', description: 'Desktop, mobile, tablet or bot class', icon: 'smartphone' },
  { id: 'deviceModel', label: 'Device Model', description: 'Hardware model (e.g. iPhone, Pixel, iPad)', icon: 'devices' },
  { id: 'deviceOs', label: 'Device OS', description: 'Operating system (iOS, Windows, macOS, Android)', icon: 'laptop' },
  { id: 'deviceBrowser', label: 'Device Browser', description: 'Web browser (Chrome, Safari, Firefox, Edge)', icon: 'web' },
  { id: 'userAgent', label: 'User Agent', description: 'Full HTTP User-Agent client identifier', icon: 'code' },
];

export const ALL_FIELD_IDS = AVAILABLE_FIELDS.map((f) => f.id);

export function filterProjects(projects: PublicProject[], search: string): PublicProject[] {
  const query = search.trim().toLowerCase();
  if (!query) return projects;
  return projects.filter((p) => {
    const matchName = p.name.toLowerCase().includes(query);
    const matchDesc = p.description ? p.description.toLowerCase().includes(query) : false;
    return matchName || matchDesc;
  });
}

export function filterShortlinks(shortlinks: PublicShortlink[], search: string): PublicShortlink[] {
  const query = search.trim().toLowerCase();
  if (!query) return shortlinks;
  return shortlinks.filter((s) => {
    const matchSlug = s.slug.toLowerCase().includes(query);
    const matchUrl = s.url.toLowerCase().includes(query);
    const matchTitle = s.title ? s.title.toLowerCase().includes(query) : false;
    return matchSlug || matchUrl || matchTitle;
  });
}

export function filterTimezones(timezones: TimezoneOption[], search: string): TimezoneOption[] {
  const query = search.trim().toLowerCase();
  if (!query) return timezones;
  return timezones.filter((tz) => {
    const matchId = tz.id.toLowerCase().includes(query);
    const matchCity = tz.city.toLowerCase().includes(query);
    const matchLabel = tz.label.toLowerCase().includes(query);
    return matchId || matchCity || matchLabel;
  });
}

export function formatTimezonePreview(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    return formatter.format(now);
  } catch {
    return 'Invalid timezone';
  }
}
