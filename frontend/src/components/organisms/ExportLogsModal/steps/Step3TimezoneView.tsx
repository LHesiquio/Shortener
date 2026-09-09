import { Icon } from '@/components/atoms/Icon/Icon';
import type { TimezoneOption, Step3Props } from '../ExportLogsModal.types';

function TimezonePreviewBox({ text }: { text: string }) {
  return (
    <div className="export-modal-timezone-preview">
      <Icon name="schedule" className="export-modal-tz-preview-icon" />
      <div className="export-modal-tz-preview-text">
        <span className="export-modal-tz-preview-title">Timestamp Preview</span>
        <span className="export-modal-tz-preview-val">{text}</span>
      </div>
    </div>
  );
}

function TimezoneSearchInput({ search, onChange }: { search: string; onChange: (v: string) => void }) {
  return (
    <div className="export-modal-search-wrapper">
      <Icon name="search" className="export-modal-search-icon" />
      <input
        type="text"
        className="export-modal-search-input"
        placeholder="Search timezones, cities or offsets..."
        value={search}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TimezoneCardItem({
  timezone,
  isSelected,
  onSelect,
}: {
  timezone: TimezoneOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`export-modal-card-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="export-modal-item-left">
        <div className="export-modal-item-icon">
          <Icon name="public" />
        </div>
        <div className="export-modal-item-text">
          <span className="export-modal-item-title">
            {timezone.city} ({timezone.id})
          </span>
          <span className="export-modal-item-sub">{timezone.label}</span>
        </div>
      </div>
      <span className="export-modal-tz-badge">{timezone.offset}</span>
    </div>
  );
}

export function Step3TimezoneView({
  timezones,
  search,
  onSearchChange,
  selectedTimezone,
  onSelect,
  previewText,
}: Step3Props) {
  return (
    <>
      <TimezonePreviewBox text={previewText} />
      <TimezoneSearchInput search={search} onChange={onSearchChange} />
      <div className="export-modal-list-container">
        {timezones.map((tz) => (
          <TimezoneCardItem
            key={tz.id}
            timezone={tz}
            isSelected={selectedTimezone === tz.id}
            onSelect={() => onSelect(tz.id)}
          />
        ))}
      </div>
    </>
  );
}
