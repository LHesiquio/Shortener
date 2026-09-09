import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shortlinkService } from '@/services/shortlinkService';
import { projectService } from '@/services/projectService';
import { useTheme } from '@/context/ThemeContext';
import { useNewLinkDrawer } from '@/context/NewLinkDrawerContext';
import { useDebounce } from '@/hooks/useDebounce';
import type { CommandPaletteProps, CommandItem } from './CommandPalette.types';
import {
  buildDefaultActions,
  mapShortlinksToCommands,
  mapProjectsToCommands,
  filterCommandsByQuery,
} from './commandPalette.helpers';

function handleArrowNavigation(
  key: string,
  total: number,
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
) {
  if (key === 'ArrowDown') {
    setSelectedIndex((prev) => (prev + 1) % total);
  } else if (key === 'ArrowUp') {
    setSelectedIndex((prev) => (prev - 1 + total) % total);
  }
}

function handleActionKeys(
  e: React.KeyboardEvent<HTMLInputElement>,
  items: CommandItem[],
  selectedIndex: number,
  onClose: () => void
) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const target = items[selectedIndex];
    if (target) target.action();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    onClose();
  }
}

function isArrowKey(key: string): boolean {
  return key === 'ArrowDown' || key === 'ArrowUp';
}

function handleKeyNavigation(
  e: React.KeyboardEvent<HTMLInputElement>,
  items: CommandItem[],
  selectedIndex: number,
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
  onClose: () => void
) {
  if (items.length === 0) return;
  if (isArrowKey(e.key)) {
    e.preventDefault();
    handleArrowNavigation(e.key, items.length, setSelectedIndex);
    return;
  }
  handleActionKeys(e, items, selectedIndex, onClose);
}

function useCommandPaletteQueries(isOpen: boolean, query: string) {
  const debouncedQuery = useDebounce(query, 300);
  const { data: searchResults, isLoading: searchingShortlinks } = useQuery({
    queryKey: ['command-palette-shortlinks', debouncedQuery],
    queryFn: ({ signal }) => shortlinkService.listMine(6, 0, debouncedQuery.trim(), undefined, undefined, signal),
    enabled: isOpen && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 30,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list', '', false],
    queryFn: ({ signal }) => projectService.list(undefined, false, signal),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  return { searchResults, projectsData, searchingShortlinks };
}

export function useCommandPalette({ isOpen, onClose, onOpenCreateLink }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { openNewLinkDrawer } = useNewLinkDrawer();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleCreateLink = useCallback(
    () => (onOpenCreateLink ? onOpenCreateLink() : openNewLinkDrawer()),
    [onOpenCreateLink, openNewLinkDrawer]
  );

  const { searchResults, projectsData, searchingShortlinks } = useCommandPaletteQueries(isOpen, query);

  const allItems = useMemo<CommandItem[]>(() => {
    const defaultActions = buildDefaultActions({
      navigate,
      toggleTheme,
      currentTheme: theme,
      onOpenCreateLink: handleCreateLink,
      onClose,
    });

    const actionMatches = filterCommandsByQuery(defaultActions, query);
    const shortlinksMatches = searchResults?.items
      ? mapShortlinksToCommands(searchResults.items, navigate, onClose)
      : [];
    const projectMatches = projectsData
      ? mapProjectsToCommands(projectsData, navigate, onClose)
      : [];

    return [...actionMatches, ...shortlinksMatches, ...filterCommandsByQuery(projectMatches, query)];
  }, [query, theme, navigate, toggleTheme, handleCreateLink, onClose, searchResults, projectsData]);

  return {
    query,
    setQuery: (val: string) => { setQuery(val); setSelectedIndex(0); },
    selectedIndex,
    allItems,
    isLoading: searchingShortlinks,
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
      handleKeyNavigation(e, allItems, selectedIndex, setSelectedIndex, onClose),
  };
}
