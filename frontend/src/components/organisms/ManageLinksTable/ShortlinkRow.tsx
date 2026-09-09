import { memo } from 'react';
import { Icon } from '@/components/atoms/Icon/Icon';
import { IconButton } from '@/components/atoms/IconButton/IconButton';
import { StatusToggle } from '@/components/atoms/StatusToggle/StatusToggle';
import { TableRow, TableCell } from '@/components/atoms/Table';
import { formatLocalizedDate } from '@/utils/date.utils';
import type { PublicShortlink } from '@/types/shortlink.types';

interface ShortlinkRowProps {
  shortlink: PublicShortlink;
  onEdit: (sl: PublicShortlink) => void;
  onDelete: (sl: PublicShortlink) => void;
  onToggleActive: (sl: PublicShortlink) => void;
  onViewClicks?: (sl: PublicShortlink) => void;
  copyToClipboard: (slug: string) => void;
  copiedSlug: string | null;
}

function ProjectCell({ project }: { project?: { name: string } | string }) {
  const name = typeof project === 'object' ? project?.name : project;
  return (
    <TableCell className="sl-col-project">
      {name ? (
        <span className="sl-project-pill">{name}</span>
      ) : (
        <span className="sl-project-pill sl-project-pill--none">General</span>
      )}
    </TableCell>
  );
}

function DestinationUrlCell({ url, title }: { url: string; title?: string }) {
  return (
    <TableCell className="sl-col-url">
      <div className="sl-url-container">
        <div className="sl-favicon-wrap">
          <Icon name="globe" size={16} />
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="sl-url-link" title={url}>
          {url}
        </a>
        {title && title !== url && (
          <span className="sl-url-title-badge" title={title}>
            {title}
          </span>
        )}
      </div>
    </TableCell>
  );
}

function SlugCell({ slug, isCopied, onCopy }: { slug: string; isCopied: boolean; onCopy: () => void }) {
  return (
    <TableCell className="sl-col-slug">
      <button
        type="button"
        className={`sl-slug-text-btn ${isCopied ? 'copied' : ''}`}
        onClick={onCopy}
        title={isCopied ? 'Copied!' : 'Click to copy shortlink'}
      >
        <span className="sl-slug-name">{slug}</span>
        <Icon name={isCopied ? 'check' : 'copy'} size={15} className="sl-copy-icon" />
      </button>
    </TableCell>
  );
}

function ClicksCell({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <TableCell className="sl-col-clicks">
      <button
        type="button"
        className="sl-clicks-pill-btn"
        onClick={onClick}
        title="View clicks history"
      >
        <Icon name="ads_click" size={14} className="sl-clicks-icon" />
        <span className="sl-clicks-count">{count}</span>
      </button>
    </TableCell>
  );
}

function StatusCell({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <TableCell className="sl-col-status">
      <StatusToggle active={active} onToggle={onToggle} />
    </TableCell>
  );
}

function ActionsCell({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableCell align="right" className="sl-col-actions">
      <div className="sl-actions-group">
        <IconButton icon="edit" onClick={onEdit} title="Edit link" />
        <IconButton icon="delete" onClick={onDelete} title="Delete link" />
      </div>
    </TableCell>
  );
}

export const ShortlinkRow = memo(function ShortlinkRow({
  shortlink,
  onEdit,
  onDelete,
  onToggleActive,
  onViewClicks,
  copyToClipboard,
  copiedSlug,
}: ShortlinkRowProps) {
  const isCopied = copiedSlug === shortlink.slug;
  const count = shortlink.clicksCount ?? 0;
  const handleClicksClick = onViewClicks ? () => onViewClicks(shortlink) : undefined;
  const expiresText = shortlink.activeTo ? formatLocalizedDate(shortlink.activeTo) : 'Never';

  return (
    <TableRow>
      <ProjectCell project={shortlink.project} />
      <DestinationUrlCell url={shortlink.url} title={shortlink.title} />
      <SlugCell slug={shortlink.slug} isCopied={isCopied} onCopy={() => copyToClipboard(shortlink.slug)} />
      <ClicksCell count={count} onClick={handleClicksClick} />
      <TableCell className="sl-col-expires"><span className="sl-date-text">{expiresText}</span></TableCell>
      <StatusCell active={shortlink.active} onToggle={() => onToggleActive(shortlink)} />
      <ActionsCell
        onEdit={() => onEdit(shortlink)}
        onDelete={() => onDelete(shortlink)}
      />
    </TableRow>
  );
});
