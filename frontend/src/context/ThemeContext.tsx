import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  COLOR_PALETTES,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_THEME_MODE,
  type ColorPaletteId,
  type ThemeMode,
} from '@/config/theme.config';

export type { ThemeMode, ColorPaletteId };

interface ThemeContextValue {
  theme: ThemeMode;
  palette: ColorPaletteId;
  setTheme: (theme: ThemeMode) => void;
  setPalette: (palette: ColorPaletteId) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const VALID_PALETTES = new Set<string>(COLOR_PALETTES.map((p) => p.id));

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore localStorage errors in restricted environments
  }
  return DEFAULT_THEME_MODE;
}

function getInitialPalette(): ColorPaletteId {
  try {
    const saved = localStorage.getItem('color-palette');
    if (saved && VALID_PALETTES.has(saved)) return saved as ColorPaletteId;
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_COLOR_PALETTE;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [palette, setPaletteState] = useState<ColorPaletteId>(getInitialPalette);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    try {
      localStorage.setItem('color-palette', palette);
    } catch {
      // Ignore localStorage errors
    }
  }, [palette]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const setPalette = useCallback((newPalette: ColorPaletteId) => {
    setPaletteState(newPalette);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const contextValue = useMemo(
    () => ({ theme, palette, setTheme, setPalette, toggleTheme }),
    [theme, palette, setTheme, setPalette, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}
