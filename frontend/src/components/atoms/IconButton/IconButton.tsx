import { Icon } from '@/components/atoms/Icon/Icon';
import { TooltipBubble } from '@/components/atoms/Tooltip/TooltipBubble';
import { useTooltip } from '@/components/atoms/Tooltip/useTooltip';
import { resolveVariantClass } from './IconButton.utils';
import type { IconButtonProps } from './IconButton.types';
import './IconButton.css';

export function IconButton({
  icon,
  variant = 'default',
  className = '',
  title,
  tooltipPosition = 'top',
  ...props
}: IconButtonProps) {
  const variantClass = resolveVariantClass(variant);
  const { anchorProps, tooltipProps } = useTooltip<HTMLButtonElement>({
    label: title ?? '',
    preferred: tooltipPosition,
  });

  return (
    <>
      <button
        type="button"
        className={`icon-btn-root ${variantClass} ${className}`}
        aria-label={title || props['aria-label']}
        {...anchorProps}
        {...props}
      >
        <Icon name={icon} />
      </button>
      {title && <TooltipBubble {...tooltipProps} />}
    </>
  );
}
