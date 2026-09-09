export type ThemeMode = 'light' | 'dark';

export type ColorPaletteId =
  | 'creamy-gray'
  | 'creamy-yellow'
  | 'creamy-red'
  | 'creamy-blue'
  | 'creamy-purple'
  | 'creamy-matcha'
  | 'creamy-peach'
  | 'creamy-mocha'
  | 'creamy-coral'
  | 'creamy-mint';

/**
 * Single-line configuration for default application appearance:
 * Change this line to change the default color palette across the entire app.
 */
export const DEFAULT_COLOR_PALETTE: ColorPaletteId = 'creamy-gray';
export const DEFAULT_THEME_MODE: ThemeMode = 'light';

export interface ColorPaletteMetadata {
  id: ColorPaletteId;
  name: string;
  subtitle: string;
  tag?: string;
  preview: {
    primary: string;
    container: string;
    surface: string;
    accent: string;
  };
  previewDark: {
    primary: string;
    container: string;
    surface: string;
    accent: string;
  };
}

export const COLOR_PALETTES: readonly ColorPaletteMetadata[] = [
  {
    id: 'creamy-gray',
    name: 'Creamy Gray',
    subtitle: 'Sleek slate gray & cool ambient pastel',
    tag: 'Default',
    preview: {
      primary: '#0067c0',
      container: '#e6edf5',
      surface: '#f3f3f3',
      accent: '#d0e1f9',
    },
    previewDark: {
      primary: '#60cdff',
      container: '#2d2d2d',
      surface: '#202020',
      accent: '#383838',
    },
  },
  {
    id: 'creamy-yellow',
    name: 'Creamy Yellow',
    subtitle: 'Warm olive & creamy golden pastel',
    preview: {
      primary: '#636037',
      container: '#fff9c4',
      surface: '#fafaf3',
      accent: '#e0eb78',
    },
    previewDark: {
      primary: '#cdc897',
      container: '#4b4822',
      surface: '#1b1c18',
      accent: '#c3ce5f',
    },
  },
  {
    id: 'creamy-matcha',
    name: 'Creamy Matcha',
    subtitle: 'Organic sage & calming zen green',
    preview: {
      primary: '#3b693a',
      container: '#d9f3d7',
      surface: '#f5faf5',
      accent: '#b9f3b7',
    },
    previewDark: {
      primary: '#9ed79c',
      container: '#235024',
      surface: '#121812',
      accent: '#516350',
    },
  },
  {
    id: 'creamy-blue',
    name: 'Creamy Blue',
    subtitle: 'Calm sky & oceanic pastel breeze',
    preview: {
      primary: '#326578',
      container: '#dcf1ff',
      surface: '#f5f9fc',
      accent: '#b2e2f8',
    },
    previewDark: {
      primary: '#9ccee4',
      container: '#154d5f',
      surface: '#12181b',
      accent: '#599dbb',
    },
  },
  {
    id: 'creamy-peach',
    name: 'Creamy Peach',
    subtitle: 'Warm apricot & terracotta pastel',
    preview: {
      primary: '#8c4e2d',
      container: '#ffe8d9',
      surface: '#fdf7f3',
      accent: '#ffdccb',
    },
    previewDark: {
      primary: '#ffb592',
      container: '#5b2e15',
      surface: '#1a1411',
      accent: '#5a4034',
    },
  },
  {
    id: 'creamy-red',
    name: 'Creamy Red',
    subtitle: 'Velvety rose & soft berry pastel',
    preview: {
      primary: '#8c4a50',
      container: '#ffe5e7',
      surface: '#faf6f6',
      accent: '#f7bdc2',
    },
    previewDark: {
      primary: '#ffb3ba',
      container: '#5b2b31',
      surface: '#1d1516',
      accent: '#e28892',
    },
  },
  {
    id: 'creamy-purple',
    name: 'Creamy Purple',
    subtitle: 'Gentle lavender & royal lilac tone',
    preview: {
      primary: '#68548e',
      container: '#efe5ff',
      surface: '#f8f6fc',
      accent: '#d7c2ff',
    },
    previewDark: {
      primary: '#d1bcff',
      container: '#4f3c75',
      surface: '#18151f',
      accent: '#9a82c4',
    },
  },
  {
    id: 'creamy-coral',
    name: 'Creamy Coral',
    subtitle: 'Vibrant salmon & blossom pastel',
    preview: {
      primary: '#8e4249',
      container: '#ffe2e4',
      surface: '#fbf5f5',
      accent: '#ffd9db',
    },
    previewDark: {
      primary: '#ffb2b7',
      container: '#5e272d',
      surface: '#1b1314',
      accent: '#5c3f41',
    },
  },
  {
    id: 'creamy-mint',
    name: 'Creamy Mint',
    subtitle: 'Glacier ice teal & refreshing mint',
    preview: {
      primary: '#24685d',
      container: '#d5f6ee',
      surface: '#f3faf8',
      accent: '#a7f2e2',
    },
    previewDark: {
      primary: '#8cd5c6',
      container: '#034f45',
      surface: '#101716',
      accent: '#354c47',
    },
  },
  {
    id: 'creamy-mocha',
    name: 'Creamy Mocha',
    subtitle: 'Cozy espresso & hazelnut latte',
    preview: {
      primary: '#6e5540',
      container: '#f4e7db',
      surface: '#fbf7f4',
      accent: '#f7ded2',
    },
    previewDark: {
      primary: '#d8c1ab',
      container: '#453322',
      surface: '#161311',
      accent: '#54443b',
    },
  },
] as const;
