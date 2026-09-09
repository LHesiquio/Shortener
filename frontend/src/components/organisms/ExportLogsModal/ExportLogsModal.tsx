import { Modal } from '@/components/atoms/Modal/Modal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator';
import { Step1ProjectView } from './steps/Step1ProjectView';
import { Step2ShortlinkView } from './steps/Step2ShortlinkView';
import { Step3TimezoneView } from './steps/Step3TimezoneView';
import { Step4FieldsView } from './steps/Step4FieldsView';
import { Step5FormatView } from './steps/Step5FormatView';
import { ExportModalFooter } from './steps/ExportModalFooter';
import { useExportLogsModal } from './useExportLogsModal';
import { useModalMaximize } from './useModalMaximize';
import type { ExportLogsModalProps } from './ExportLogsModal.types';
import './ExportLogsModal.css';

const STEP_LABELS = ['Project', 'Shortlink', 'Timezone', 'Fields', 'Format'];

type HookReturn = ReturnType<typeof useExportLogsModal>;

function Step5Container({ hook }: { hook: HookReturn }) {
  const projectName = hook.selectedProject?.name || 'Selected Project';
  const slug = hook.selectedShortlink?.slug || 'slug';
  const title = hook.selectedShortlink?.title || 'Shortlink';
  const url = hook.selectedShortlink?.url || '';

  return (
    <Step5FormatView
      selectedFormat={hook.selectedFormat}
      onSelectFormat={hook.setSelectedFormat}
      projectName={projectName}
      slug={slug}
      shortlinkTitle={title}
      destinationUrl={url}
      timezone={hook.selectedTimezone}
      selectedFieldsCount={hook.selectedFields.length}
    />
  );
}

function renderStepsEarly(hook: HookReturn) {
  if (hook.step === 1) {
    return (
      <Step1ProjectView
        projects={hook.filteredProjects}
        isLoading={hook.isLoadingProjects}
        search={hook.projectSearch}
        onSearchChange={hook.setProjectSearch}
        selectedProject={hook.selectedProject}
        onSelect={hook.handleSelectProject}
      />
    );
  }
  return (
    <Step2ShortlinkView
      shortlinks={hook.filteredShortlinks}
      isLoading={hook.isLoadingShortlinks}
      search={hook.shortlinkSearch}
      onSearchChange={hook.setShortlinkSearch}
      selectedShortlink={hook.selectedShortlink}
      onSelect={hook.handleSelectShortlink}
    />
  );
}

function renderStepsLate(hook: HookReturn) {
  if (hook.step === 3) {
    return (
      <Step3TimezoneView
        timezones={hook.filteredTimezones}
        search={hook.timezoneSearch}
        onSearchChange={hook.setTimezoneSearch}
        selectedTimezone={hook.selectedTimezone}
        onSelect={hook.setSelectedTimezone}
        previewText={hook.previewTimezoneText}
      />
    );
  }
  if (hook.step === 4) {
    return (
      <Step4FieldsView
        selectedFields={hook.selectedFields}
        onToggleField={hook.handleToggleField}
        onSelectAll={hook.handleSelectAllFields}
        onDeselectAll={hook.handleDeselectAllFields}
      />
    );
  }
  return <Step5Container hook={hook} />;
}

function isStepValid(step: number, hook: HookReturn): boolean {
  if (step === 1) return !!hook.selectedProject;
  if (step === 2) return !!hook.selectedShortlink;
  if (step === 3) return !!hook.selectedTimezone;
  if (step === 4) return hook.selectedFields.length > 0;
  return true;
}

interface ExportModalHeaderProps {
  allowMaximize: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

function ExportModalHeader({
  allowMaximize,
  isMaximized,
  onToggleMaximize,
  onClose,
}: ExportModalHeaderProps) {
  return (
    <div className="export-modal-header">
      <div className="export-modal-header-info">
        <h2>Export Click Logs</h2>
        <p>Download filtered click logs audit data</p>
      </div>
      <div className="export-modal-header-actions">
        {allowMaximize && (
          <button
            type="button"
            className="export-modal-action-btn"
            onClick={onToggleMaximize}
            aria-label={isMaximized ? 'Exit full screen' : 'Maximize to full screen'}
            title={isMaximized ? 'Exit full screen' : 'Maximize to full screen'}
          >
            <Icon name={isMaximized ? 'fullscreen_exit' : 'fullscreen'} size={16} />
          </button>
        )}
        <button
          type="button"
          className="export-modal-action-btn"
          onClick={onClose}
          aria-label="Close modal"
          title="Close"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    </div>
  );
}

function ExportModalBody({ hook }: { hook: HookReturn }) {
  return (
    <div className="export-modal-body">
      {hook.step <= 2 ? renderStepsEarly(hook) : renderStepsLate(hook)}
    </div>
  );
}

export function ExportLogsModal(props: ExportLogsModalProps) {
  const { allowMaximize = true, defaultMaximized = false, persistMaximized = true, storageKey } = props;
  const { isMaximized, toggleMaximize } = useModalMaximize({
    allowMaximize,
    defaultMaximized,
    persistMaximized,
    storageKey,
  });

  const hook = useExportLogsModal(props);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={hook.handleCloseAndReset}
      cardClassName="export-modal-card"
      isMaximized={isMaximized}
    >
      <ExportModalHeader
        allowMaximize={allowMaximize}
        isMaximized={isMaximized}
        onToggleMaximize={toggleMaximize}
        onClose={hook.handleCloseAndReset}
      />
      <div className="export-modal-step-indicator">
        <StepIndicator currentStep={hook.step} totalSteps={5} labels={STEP_LABELS} />
      </div>
      <ExportModalBody hook={hook} />
      <ExportModalFooter
        step={hook.step}
        isExporting={hook.isExporting}
        canProceed={isStepValid(hook.step, hook)}
        onPrev={hook.handlePrevStep}
        onNext={hook.handleNextStep}
        onExport={hook.handleExecuteExport}
      />
    </Modal>
  );
}
