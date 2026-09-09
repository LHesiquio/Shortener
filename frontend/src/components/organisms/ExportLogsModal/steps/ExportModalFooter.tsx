import { Icon } from '@/components/atoms/Icon/Icon';

interface FooterProps {
  step: number;
  isExporting: boolean;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onExport: () => void;
}

function BackButton({ step, onPrev }: { step: number; onPrev: () => void }) {
  if (step <= 1) return <div />;
  return (
    <button type="button" className="export-modal-back-btn" onClick={onPrev}>
      <Icon name="arrow_back" /> Back
    </button>
  );
}

function NextButton({ canProceed, onNext }: { canProceed: boolean; onNext: () => void }) {
  return (
    <button
      type="button"
      className="export-modal-next-btn"
      disabled={!canProceed}
      onClick={onNext}
    >
      Continue <Icon name="arrow_forward" />
    </button>
  );
}

function ExportButton({ isExporting, onExport }: { isExporting: boolean; onExport: () => void }) {
  return (
    <button
      type="button"
      className="export-modal-next-btn"
      disabled={isExporting}
      onClick={onExport}
    >
      {isExporting ? 'Generating...' : <><Icon name="download" /> Export Report</>}
    </button>
  );
}

export function ExportModalFooter({
  step,
  isExporting,
  canProceed,
  onPrev,
  onNext,
  onExport,
}: FooterProps) {
  const isFinalStep = step >= 5;

  return (
    <div className="export-modal-footer">
      <BackButton step={step} onPrev={onPrev} />
      {!isFinalStep ? (
        <NextButton canProceed={canProceed} onNext={onNext} />
      ) : (
        <ExportButton isExporting={isExporting} onExport={onExport} />
      )}
    </div>
  );
}
