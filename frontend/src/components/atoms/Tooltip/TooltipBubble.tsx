import { createPortal } from 'react-dom';
import { resolveTooltipClasses } from './Tooltip.utils';
import type { TooltipBubbleProps } from './Tooltip.types';
import './Tooltip.css';

export function TooltipBubble({ label, visible, coordinates, bubbleRef }: TooltipBubbleProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <span
      ref={bubbleRef}
      className={`tooltip ${resolveTooltipClasses(coordinates.vertical, visible)}`}
      style={{ top: coordinates.top, left: coordinates.left }}
      role="tooltip"
    >
      {label}
    </span>,
    document.body
  );
}
