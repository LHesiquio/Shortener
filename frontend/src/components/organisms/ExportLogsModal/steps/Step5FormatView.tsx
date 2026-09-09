import { Icon } from '@/components/atoms/Icon/Icon';
import { FORMAT_OPTIONS } from '../ExportLogsModal.utils';
import type { ExportFormat, Step5Props } from '../ExportLogsModal.types';

function FormatGrid({
  selectedFormat,
  onSelect,
}: {
  selectedFormat: ExportFormat;
  onSelect: (fmt: ExportFormat) => void;
}) {
  return (
    <div className="export-modal-formats-grid">
      {FORMAT_OPTIONS.map((f) => {
        const isSelected = selectedFormat === f.format;
        return (
          <div
            key={f.format}
            className={`export-modal-format-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(f.format)}
          >
            <div className="export-modal-format-top">
              <div className="export-modal-format-icon">
                <Icon name={f.icon} />
              </div>
              <span className="export-modal-format-badge">{f.ext}</span>
            </div>
            <span className="export-modal-format-title">{f.title}</span>
            <span className="export-modal-format-desc">{f.description}</span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="export-modal-summary-row">
      <span>{label}:</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryBox({
  projectName,
  slug,
  shortlinkTitle,
  timezone,
  format,
  fieldsCount,
}: {
  projectName: string;
  slug: string;
  shortlinkTitle: string;
  timezone: string;
  format: string;
  fieldsCount: number;
}) {
  return (
    <div className="export-modal-summary-box">
      <span className="export-modal-summary-title">Export Summary</span>
      <SummaryRow label="Project" value={projectName} />
      <SummaryRow label="Shortlink" value={`/${slug} (${shortlinkTitle})`} />
      <SummaryRow label="Timezone" value={timezone} />
      <SummaryRow label="Fields" value={`${fieldsCount} selected`} />
      <SummaryRow label="Format" value={format.toUpperCase()} />
    </div>
  );
}

export function Step5FormatView({
  selectedFormat,
  onSelectFormat,
  projectName,
  slug,
  shortlinkTitle,
  timezone,
  selectedFieldsCount,
}: Step5Props) {
  return (
    <>
      <FormatGrid selectedFormat={selectedFormat} onSelect={onSelectFormat} />
      <SummaryBox
        projectName={projectName}
        slug={slug}
        shortlinkTitle={shortlinkTitle}
        timezone={timezone}
        format={selectedFormat}
        fieldsCount={selectedFieldsCount}
      />
    </>
  );
}
