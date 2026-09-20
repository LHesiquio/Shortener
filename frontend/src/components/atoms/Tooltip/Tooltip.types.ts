import type React from 'react';

export type TooltipVertical = 'above' | 'below';

export interface TooltipCoordinates {
  top: number;
  left: number;
  vertical: TooltipVertical;
}

export interface UseTooltipOptions {
  /** Text shown inside the bubble. */
  label: string;
  /** Preferred side; the bubble flips automatically when it would overflow. */
  preferred?: 'top' | 'bottom';
}

export interface TooltipAnchorProps<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface TooltipBubbleProps {
  label: string;
  visible: boolean;
  coordinates: TooltipCoordinates;
  bubbleRef: React.RefObject<HTMLSpanElement | null>;
}

export interface UseTooltipResult<T extends HTMLElement> {
  anchorProps: TooltipAnchorProps<T>;
  tooltipProps: TooltipBubbleProps;
}
