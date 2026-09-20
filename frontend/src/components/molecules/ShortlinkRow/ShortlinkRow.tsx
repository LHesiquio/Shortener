import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Icon } from '@/components/atoms/Icon/Icon';
import { TooltipBubble } from '@/components/atoms/Tooltip/TooltipBubble';
import { useTooltip } from '@/components/atoms/Tooltip/useTooltip';
import { formatLocalizedDate } from '@/utils/date.utils';
import { useUserProfile } from '@/context/UserProfileContext';
import type { PublicShortlink } from '@/types/shortlink.types';
import type { ShortlinkRowProps } from './ShortlinkRow.types';
import './ShortlinkRow.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5001';
const SHORT_BASE = API_BASE_URL.replace('/api', '');

interface SlugCellProps {
  slug: string;
  fullUrl: string;
  copied: boolean;
  onCopy: () => void;
}

function SlugCell({ slug, fullUrl, copied, onCopy }: SlugCellProps) {
  const slugTooltip = useTooltip<HTMLSpanElement>({ label: fullUrl });
  const copyTooltip = useTooltip<HTMLButtonElement>({ label: `Copy: ${fullUrl}` });

  return (
    <div className="sl-short-link">
      <span {...slugTooltip.anchorProps}>{slug}</span>
      <button type="button" className="sl-copy-btn" onClick={onCopy} {...copyTooltip.anchorProps}>
        <Icon name={copied ? 'check' : 'content_copy'} />
      </button>
      <TooltipBubble {...slugTooltip.tooltipProps} />
      <TooltipBubble {...copyTooltip.tooltipProps} />
    </div>
  );
}

function UrlCell({ url }: { url: string }) {
  const urlTooltip = useTooltip<HTMLDivElement>({ label: url });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className="sl-url-icon">
        <Icon name="public" />
      </div>
      <div className="sl-url-text" {...urlTooltip.anchorProps}>{url}</div>
      <TooltipBubble {...urlTooltip.tooltipProps} />
    </div>
  );
}

function StatusBadge({ active }: { active?: boolean }) {
  return (
    <Badge variant={active ? 'secondary' : 'neutral'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function resolveExpiryText(activeTo?: string, timezone?: string): string {
  if (!activeTo) return 'Never';
  return formatLocalizedDate(activeTo, timezone);
}

interface ActionsCellProps {
  shortlink: PublicShortlink;
  onEdit: (link: PublicShortlink) => void;
  onDelete: (link: PublicShortlink) => void;
  onToggleActive: (link: PublicShortlink) => void;
}

function ActionsCell({ shortlink, onEdit, onDelete, onToggleActive }: ActionsCellProps) {
  return (
    <div className="sl-actions">
      <IconButton icon="edit" variant="primary" title="Edit" onClick={() => onEdit(shortlink)} />
      <IconButton
        icon={shortlink.active ? 'toggle_on' : 'toggle_off'}
        variant={shortlink.active ? 'success' : 'danger-active'}
        title={shortlink.active ? 'Disable' : 'Enable'}
        onClick={() => onToggleActive(shortlink)}
      />
      <IconButton icon="delete" variant="danger" title="Delete" onClick={() => onDelete(shortlink)} />
    </div>
  );
}

function ClicksCell({ count, onClick }: { count: number; onClick: () => void }) {
  const tooltip = useTooltip<HTMLButtonElement>({ label: 'View click logs' });
  return (
    <button type="button" className="sl-clicks-badge-btn" onClick={onClick} {...tooltip.anchorProps}>
      <Icon name="ads_click" />
      <span>{count}</span>
      <TooltipBubble {...tooltip.tooltipProps} />
    </button>
  );
}

export function ShortlinkRow({
  shortlink,
  onEdit,
  onDelete,
  onToggleActive,
  onViewClicks,
  copyToClipboard,
  copiedSlug,
}: ShortlinkRowProps) {
  const { user } = useUserProfile();
  const isCopied = copiedSlug === shortlink.slug;
  const projectName = shortlink.project?.name || 'General';
  const expiryText = resolveExpiryText(shortlink.activeTo, user?.timezone);
  const fullUrl = `${SHORT_BASE}/r/${shortlink.slug}`;

  return (
    <tr className="sl-row">
      <td className="sl-cell sl-col-project"><Badge variant="primary">{projectName}</Badge></td>
      <td className="sl-cell sl-col-url"><UrlCell url={shortlink.url} /></td>
      <td className="sl-cell sl-col-title"><Badge variant="neutral">{shortlink.title || 'No title'}</Badge></td>
      <td className="sl-cell sl-col-slug">
        <SlugCell slug={shortlink.slug} fullUrl={fullUrl} copied={isCopied} onCopy={() => copyToClipboard(fullUrl)} />
      </td>
      <td className="sl-cell sl-col-clicks">
        <ClicksCell count={shortlink.clicksCount || 0} onClick={() => onViewClicks?.(shortlink)} />
      </td>
      <td className="sl-cell sl-col-expires">
        <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant, #49473c)' }}>{expiryText}</span>
      </td>
      <td className="sl-cell sl-col-status">
        <StatusBadge active={shortlink.active} />
      </td>
      <td className="sl-cell sl-col-actions">
        <ActionsCell shortlink={shortlink} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} />
      </td>
    </tr>
  );
}
