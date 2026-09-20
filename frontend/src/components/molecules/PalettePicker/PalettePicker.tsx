import { memo } from 'react';
import { COLOR_PALETTES, type ColorPaletteMetadata } from '@/config/theme.config';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/atoms/Icon/Icon';
import { TooltipBubble } from '@/components/atoms/Tooltip/TooltipBubble';
import { useTooltip } from '@/components/atoms/Tooltip/useTooltip';
import type { PalettePickerProps } from './PalettePicker.types';
import './PalettePicker.css';

interface SwatchProps {
  primary: string;
  container: string;
  accent: string;
}

function PaletteSwatches({ primary, container, accent }: SwatchProps) {
  const primaryTooltip = useTooltip<HTMLSpanElement>({ label: 'Primary Accent' });
  const containerTooltip = useTooltip<HTMLSpanElement>({ label: 'Container Tint' });
  const accentTooltip = useTooltip<HTMLSpanElement>({ label: 'Secondary Accent' });

  return (
    <div className="palette-swatches">
      <span className="palette-swatch-dot" style={{ backgroundColor: primary }} {...primaryTooltip.anchorProps} />
      <span className="palette-swatch-dot" style={{ backgroundColor: container }} {...containerTooltip.anchorProps} />
      <span className="palette-swatch-dot" style={{ backgroundColor: accent }} {...accentTooltip.anchorProps} />
      <TooltipBubble {...primaryTooltip.tooltipProps} />
      <TooltipBubble {...containerTooltip.tooltipProps} />
      <TooltipBubble {...accentTooltip.tooltipProps} />
    </div>
  );
}

interface PaletteCardProps {
  palette: ColorPaletteMetadata;
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
}

const PaletteCard = memo(function PaletteCard({ palette, isSelected, isDark, onSelect }: PaletteCardProps) {
  const preview = isDark ? palette.previewDark : palette.preview;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      className={`palette-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="palette-card-header">
        <PaletteSwatches {...preview} />
        {isSelected ? (
          <div className="palette-check-indicator" aria-hidden="true">
            <Icon name="check" />
          </div>
        ) : palette.tag ? (
          <span className="palette-card-badge">{palette.tag}</span>
        ) : null}
      </div>

      <div className="palette-card-title">{palette.name}</div>
      <div className="palette-card-subtitle">{palette.subtitle}</div>
    </button>
  );
});

export const PalettePicker = memo(function PalettePicker({ selectedPalette, onSelectPalette, className = '' }: PalettePickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      role="radiogroup"
      aria-label="Color Palette Selection"
      className={`palette-picker-grid ${className}`.trim()}
    >
      {COLOR_PALETTES.map((palette) => (
        <PaletteCard
          key={palette.id}
          palette={palette}
          isSelected={palette.id === selectedPalette}
          isDark={isDark}
          onSelect={() => onSelectPalette(palette.id)}
        />
      ))}
    </div>
  );
});
