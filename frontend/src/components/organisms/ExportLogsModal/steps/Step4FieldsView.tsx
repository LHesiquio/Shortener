import { Checkbox } from '@/components/atoms/Checkbox/Checkbox';
import { Icon } from '@/components/atoms/Icon/Icon';
import { AVAILABLE_FIELDS } from '../ExportLogsModal.utils';
import type { ExportFieldOption, Step4FieldsProps } from '../ExportLogsModal.types';

function FieldsToolbar({
  count,
  total,
  onSelectAll,
  onDeselectAll,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  return (
    <div className="export-modal-fields-toolbar">
      <span className="export-modal-fields-count">
        <strong>{count}</strong> of {total} fields selected
      </span>
      <div className="export-modal-fields-actions">
        <button type="button" className="export-modal-link-btn" onClick={onSelectAll}>
          Select All
        </button>
        <span className="export-modal-dot-sep">•</span>
        <button type="button" className="export-modal-link-btn" onClick={onDeselectAll}>
          Clear
        </button>
      </div>
    </div>
  );
}

function FieldItemCard({
  field,
  isSelected,
  onToggle,
}: {
  field: ExportFieldOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`export-modal-card-item export-modal-field-item ${isSelected ? 'selected' : ''}`}
      onClick={onToggle}
    >
      <div className="export-modal-item-left">
        <div className="export-modal-item-icon">
          <Icon name={field.icon} />
        </div>
        <div className="export-modal-item-text">
          <span className="export-modal-item-title">{field.label}</span>
          <span className="export-modal-item-sub">{field.description}</span>
        </div>
      </div>
      <Checkbox checked={isSelected} onChange={onToggle} />
    </div>
  );
}

export function Step4FieldsView({
  selectedFields,
  onToggleField,
  onSelectAll,
  onDeselectAll,
}: Step4FieldsProps) {
  return (
    <>
      <FieldsToolbar
        count={selectedFields.length}
        total={AVAILABLE_FIELDS.length}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
      <div className="export-modal-list-container export-modal-fields-grid">
        {AVAILABLE_FIELDS.map((f) => (
          <FieldItemCard
            key={f.id}
            field={f}
            isSelected={selectedFields.includes(f.id)}
            onToggle={() => onToggleField(f.id)}
          />
        ))}
      </div>
    </>
  );
}
