import { createContext, useContext } from 'react';
import { useExportJobsController } from '@/hooks/useExportJobsController';
import type { ExportJobsContextValue } from '@/context/ExportJobsContext.types';

const ExportJobsContext = createContext<ExportJobsContextValue | null>(null);

export function ExportJobsProvider({ children }: { children: React.ReactNode }) {
  const value = useExportJobsController();
  return <ExportJobsContext.Provider value={value}>{children}</ExportJobsContext.Provider>;
}

export function useExportJobs(): ExportJobsContextValue {
  const ctx = useContext(ExportJobsContext);
  if (!ctx) throw new Error('useExportJobs must be used inside <ExportJobsProvider>');
  return ctx;
}
