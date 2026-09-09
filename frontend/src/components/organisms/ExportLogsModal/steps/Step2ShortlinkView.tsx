import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import type { PublicShortlink } from '@/types/shortlink.types';
import type { Step2Props } from '../ExportLogsModal.types';

function ShortlinkSearchInput({ search, onChange }: { search: string; onChange: (v: string) => void }) {
  return (
    <div className="export-modal-search-wrapper">
      <Icon name="search" className="export-modal-search-icon" />
      <input
        type="text"
        className="export-modal-search-input"
        placeholder="Search by title, URL or slug..."
        value={search}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ShortlinkCardItem({
  shortlink,
  isSelected,
  onSelect,
}: {
  shortlink: PublicShortlink;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`export-modal-card-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="export-modal-item-left">
        <span className="export-modal-slug-pill">/{shortlink.slug}</span>
        <div className="export-modal-item-text">
          <span className="export-modal-item-title">{shortlink.title || shortlink.slug}</span>
          <span className="export-modal-item-sub">{shortlink.url}</span>
        </div>
      </div>
      <div className="export-modal-item-radio">{isSelected && <div className="export-modal-radio-dot" />}</div>
    </div>
  );
}

function ShortlinkListState({ isLoading, count }: { isLoading: boolean; count: number }) {
  if (isLoading) {
    return (
      <>
        <Skeleton width="100%" height="56px" borderRadius="16px" />
        <Skeleton width="100%" height="56px" borderRadius="16px" />
      </>
    );
  }
  if (count === 0) {
    return (
      <div className="export-modal-empty-state">
        <Icon name="link_off" size={32} />
        <p>No shortlinks found in this project.</p>
      </div>
    );
  }
  return null;
}

export function Step2ShortlinkView({
  shortlinks,
  isLoading,
  search,
  onSearchChange,
  selectedShortlink,
  onSelect,
}: Step2Props) {
  return (
    <>
      <ShortlinkSearchInput search={search} onChange={onSearchChange} />
      <div className="export-modal-list-container">
        <ShortlinkListState isLoading={isLoading} count={shortlinks.length} />
        {!isLoading &&
          shortlinks.map((s) => (
            <ShortlinkCardItem
              key={s.id}
              shortlink={s}
              isSelected={selectedShortlink?.id === s.id}
              onSelect={() => onSelect(s)}
            />
          ))}
      </div>
    </>
  );
}
