import type { TooltipCoordinates, TooltipVertical } from './Tooltip.types';

const VIEWPORT_MARGIN = 8;
const TOOLTIP_GAP = 6;

export function resolveTooltipClasses(vertical: TooltipVertical, visible: boolean): string {
  return `tooltip--${vertical}${visible ? ' is-visible' : ''}`;
}

/**
 * Computes a viewport-fixed position for the bubble, flipping vertically when
 * it would be clipped and clamping horizontally so it never leaves the screen.
 */
export function computeTooltipCoordinates(
  anchor: DOMRect,
  width: number,
  height: number,
  preferred: 'top' | 'bottom'
): TooltipCoordinates {
  const vertical = pickVertical(anchor, height, preferred);
  const top = vertical === 'above' ? anchor.top - TOOLTIP_GAP - height : anchor.bottom + TOOLTIP_GAP;
  const centered = anchor.left + anchor.width / 2 - width / 2;
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  return { top, left: clamp(centered, VIEWPORT_MARGIN, maxLeft), vertical };
}

function pickVertical(
  anchor: DOMRect,
  height: number,
  preferred: 'top' | 'bottom'
): TooltipVertical {
  const needed = height + TOOLTIP_GAP;
  const fitsAbove = anchor.top - VIEWPORT_MARGIN >= needed;
  const fitsBelow = window.innerHeight - VIEWPORT_MARGIN - anchor.bottom >= needed;
  const fits: Record<TooltipVertical, boolean> = { above: fitsAbove, below: fitsBelow };
  const order: TooltipVertical[] = preferred === 'top' ? ['above', 'below'] : ['below', 'above'];
  return order.find((side) => fits[side]) ?? 'above';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
