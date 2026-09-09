import type { NavigateFunction } from 'react-router-dom';
import type { PublicShortlink, PublicProject } from '@/types/shortlink.types';
import type { CommandItem } from './CommandPalette.types';

export interface ActionHandlers {
  navigate: NavigateFunction;
  toggleTheme: () => void;
  currentTheme: 'light' | 'dark';
  onOpenCreateLink?: () => void;
  onClose: () => void;
}

const NAV_CONFIGS = [
  { path: '/dashboard', title: 'Go to Dashboard', subtitle: 'Manage all shortlinks and quick stats', icon: 'dashboard' },
  { path: '/projects', title: 'Go to Projects', subtitle: 'View and manage all your link projects', icon: 'folder' },
  { path: '/analytics', title: 'Go to Analytics', subtitle: 'View traffic, device and geographical reports', icon: 'analytics' },
  { path: '/settings', title: 'Go to Settings', subtitle: 'Manage profile, security and timezone preferences', icon: 'settings' },
];

function buildNavigationActions(navigate: NavigateFunction, onClose: () => void): CommandItem[] {
  return NAV_CONFIGS.map((item) => ({
    id: `action-go-${item.path.slice(1)}`,
    category: 'action',
    title: item.title,
    subtitle: item.subtitle,
    iconName: item.icon,
    badgeText: 'Navigation',
    action: () => {
      onClose();
      navigate(item.path);
    },
  }));
}

function buildSpecialActions(
  currentTheme: 'light' | 'dark',
  toggleTheme: () => void,
  onOpenCreateLink: (() => void) | undefined,
  onClose: () => void
): CommandItem[] {
  return [
    {
      id: 'action-create-link',
      category: 'action',
      title: 'Create Shortlink',
      subtitle: 'Open shortlink creation drawer',
      iconName: 'add_link',
      badgeText: 'Action',
      action: () => {
        onClose();
        if (onOpenCreateLink) onOpenCreateLink();
      },
    },
    {
      id: 'action-toggle-theme',
      category: 'action',
      title: `Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} Mode`,
      subtitle: 'Toggle global color palette theme',
      iconName: currentTheme === 'light' ? 'dark_mode' : 'light_mode',
      badgeText: 'Theme',
      action: () => {
        onClose();
        toggleTheme();
      },
    },
  ];
}

export function buildDefaultActions({
  navigate,
  toggleTheme,
  currentTheme,
  onOpenCreateLink,
  onClose,
}: ActionHandlers): CommandItem[] {
  const specials = buildSpecialActions(currentTheme, toggleTheme, onOpenCreateLink, onClose);
  const navs = buildNavigationActions(navigate, onClose);
  return [specials[0], ...navs, specials[1]];
}

export function mapShortlinksToCommands(
  shortlinks: PublicShortlink[],
  navigate: NavigateFunction,
  onClose: () => void
): CommandItem[] {
  return shortlinks.map((link) => ({
    id: `shortlink-${link.id}`,
    category: 'shortlink',
    title: `/${link.slug}`,
    subtitle: link.url,
    iconName: 'link',
    badgeText: `${link.clicksCount ?? 0} clicks`,
    shortlink: link,
    action: () => {
      onClose();
      navigate(`/clicks?search=${encodeURIComponent(link.slug)}`);
    },
  }));
}

export function mapProjectsToCommands(
  projects: PublicProject[],
  navigate: NavigateFunction,
  onClose: () => void
): CommandItem[] {
  return projects.map((proj) => ({
    id: `project-${proj.id}`,
    category: 'project',
    title: proj.name,
    subtitle: proj.description || 'Project collection',
    iconName: 'folder',
    badgeText: 'Project',
    project: proj,
    action: () => {
      onClose();
      navigate(`/projects/${proj.id}`);
    },
  }));
}

export function filterCommandsByQuery(commands: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
  );
}
