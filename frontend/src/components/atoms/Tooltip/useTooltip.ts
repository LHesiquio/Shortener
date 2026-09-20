import { useCallback, useEffect, useRef, useState } from 'react';
import { computeTooltipCoordinates } from './Tooltip.utils';
import type { TooltipCoordinates, UseTooltipOptions, UseTooltipResult } from './Tooltip.types';

const INITIAL: TooltipCoordinates = { top: 0, left: 0, vertical: 'above' };

function useViewportSync(active: boolean, update: () => void): void {
  useEffect(() => {
    if (!active) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, update]);
}

/**
 * Agnostic tooltip primitive: attach `anchorProps` to any element and render
 * `<TooltipBubble {...tooltipProps} />`. The bubble is positioned in viewport
 * coordinates (rendered through a portal) so it is never clipped by ancestors.
 */
export function useTooltip<T extends HTMLElement = HTMLElement>(
  options: UseTooltipOptions
): UseTooltipResult<T> {
  const { label, preferred = 'top' } = options;
  const anchorRef = useRef<T>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<TooltipCoordinates>(INITIAL);

  const update = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    if (!anchor) return;
    const bubble = bubbleRef.current?.getBoundingClientRect();
    setCoordinates(
      computeTooltipCoordinates(anchor, bubble?.width ?? 0, bubble?.height ?? 0, preferred)
    );
  }, [preferred]);

  const show = useCallback(() => {
    update();
    setVisible(true);
  }, [update]);

  const hide = useCallback(() => setVisible(false), []);

  useViewportSync(visible, update);

  return {
    anchorProps: {
      ref: anchorRef,
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
    },
    tooltipProps: { label, visible, coordinates, bubbleRef },
  };
}
