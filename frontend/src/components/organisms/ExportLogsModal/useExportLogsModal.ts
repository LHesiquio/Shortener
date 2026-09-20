import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { shortlinkService } from '@/services/shortlinkService';
import { useUserProfile } from '@/context/UserProfileContext';
import { useExportJobs } from '@/context/ExportJobsContext';
import type { PublicProject, PublicShortlink } from '@/types/shortlink.types';
import type { CreateExportJobPayload } from '@/types/exportJob.types';
import type { ExportFormat } from './ExportLogsModal.types';
import {
  ALL_FIELD_IDS,
  POPULAR_TIMEZONES,
  filterProjects,
  filterShortlinks,
  filterTimezones,
  formatTimezonePreview,
} from './ExportLogsModal.utils';

function useWizardData(isOpen: boolean, selectedProjectId?: string) {
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects-list', '', false],
    queryFn: ({ signal }) => projectService.list(undefined, false, signal),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
  });

  const { data: shortlinksData, isLoading: isLoadingShortlinks } = useQuery({
    queryKey: ['export-wizard-shortlinks', selectedProjectId],
    queryFn: ({ signal }) => shortlinkService.listMine(100, 0, undefined, selectedProjectId, undefined, signal),
    enabled: isOpen && !!selectedProjectId,
  });

  return {
    projects,
    isLoadingProjects,
    shortlinks: shortlinksData?.items || [],
    isLoadingShortlinks,
  };
}

function useWizardState(userTimezone?: string) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedShortlink, setSelectedShortlink] = useState<PublicShortlink | null>(null);
  const [shortlinkSearch, setShortlinkSearch] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(userTimezone || 'America/Mexico_City');
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([...ALL_FIELD_IDS]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  return {
    step,
    setStep,
    selectedProject,
    setSelectedProject,
    projectSearch,
    setProjectSearch,
    selectedShortlink,
    setSelectedShortlink,
    shortlinkSearch,
    setShortlinkSearch,
    selectedTimezone,
    setSelectedTimezone,
    timezoneSearch,
    setTimezoneSearch,
    selectedFields,
    setSelectedFields,
    selectedFormat,
    setSelectedFormat,
    isExporting,
    setIsExporting,
  };
}

type WizardState = ReturnType<typeof useWizardState>;

async function performExport(
  shortlink: PublicShortlink,
  projectName: string | undefined,
  tz: string,
  fields: string[],
  fmt: ExportFormat,
  createJob: (payload: CreateExportJobPayload) => Promise<void>
) {
  await createJob({
    slug: shortlink.slug,
    shortlinkId: shortlink.id,
    projectName,
    timezone: tz,
    fields,
    format: fmt,
  });
}

function createFieldActions(state: WizardState) {
  return {
    handleToggleField: (f: string) => {
      state.setSelectedFields((prev) =>
        prev.includes(f) ? prev.filter((id) => id !== f) : [...prev, f]
      );
    },
    handleSelectAllFields: () => state.setSelectedFields([...ALL_FIELD_IDS]),
    handleDeselectAllFields: () => state.setSelectedFields([]),
  };
}

function createNavigationActions(state: WizardState) {
  return {
    handleSelectProject: (p: PublicProject) => {
      state.setSelectedProject(p);
      state.setSelectedShortlink(null);
      state.setStep(2);
    },
    handleSelectShortlink: (s: PublicShortlink) => {
      state.setSelectedShortlink(s);
      state.setStep(3);
    },
    handleNextStep: () => state.step < 5 && state.setStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5),
    handlePrevStep: () => state.step > 1 && state.setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5),
  };
}

function useWizardHandlers(
  state: WizardState,
  onClose: () => void,
  createJob: (payload: CreateExportJobPayload) => Promise<void>
) {
  const reset = () => {
    state.setStep(1);
    state.setSelectedProject(null);
    state.setSelectedShortlink(null);
    state.setProjectSearch('');
    state.setShortlinkSearch('');
    state.setSelectedFields([...ALL_FIELD_IDS]);
    onClose();
  };

  const handleExecuteExport = async () => {
    if (!state.selectedShortlink) return;
    state.setIsExporting(true);
    try {
      await performExport(
        state.selectedShortlink,
        state.selectedProject?.name,
        state.selectedTimezone,
        state.selectedFields,
        state.selectedFormat,
        createJob
      );
      reset();
    } catch {
      // The failure toast is surfaced by ExportJobsProvider.
    } finally {
      state.setIsExporting(false);
    }
  };

  return {
    handleCloseAndReset: reset,
    handleExecuteExport,
    ...createNavigationActions(state),
    ...createFieldActions(state),
  };
}

export function useExportLogsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userTimezone } = useUserProfile();
  const { createJob } = useExportJobs();
  const state = useWizardState(userTimezone);
  const data = useWizardData(isOpen, state.selectedProject?.id);
  const handlers = useWizardHandlers(state, onClose, createJob);

  return {
    step: state.step,
    selectedProject: state.selectedProject,
    projectSearch: state.projectSearch,
    setProjectSearch: state.setProjectSearch,
    filteredProjects: filterProjects(data.projects, state.projectSearch),
    isLoadingProjects: data.isLoadingProjects,
    selectedShortlink: state.selectedShortlink,
    shortlinkSearch: state.shortlinkSearch,
    setShortlinkSearch: state.setShortlinkSearch,
    filteredShortlinks: filterShortlinks(data.shortlinks, state.shortlinkSearch),
    isLoadingShortlinks: data.isLoadingShortlinks,
    selectedTimezone: state.selectedTimezone,
    setSelectedTimezone: state.setSelectedTimezone,
    timezoneSearch: state.timezoneSearch,
    setTimezoneSearch: state.setTimezoneSearch,
    filteredTimezones: filterTimezones(POPULAR_TIMEZONES, state.timezoneSearch),
    previewTimezoneText: formatTimezonePreview(state.selectedTimezone),
    selectedFields: state.selectedFields,
    selectedFormat: state.selectedFormat,
    setSelectedFormat: state.setSelectedFormat,
    isExporting: state.isExporting,
    ...handlers,
  };
}
