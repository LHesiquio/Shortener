import type { ColorPaletteId } from '@/config/theme.config';

export interface PalettePickerProps {
  /** The currently selected palette ID */
  selectedPalette: ColorPaletteId;
  /** Callback fired when a palette is chosen */
  onSelectPalette: (palette: ColorPaletteId) => void;
  /** Optional custom class name */
  className?: string;
}
