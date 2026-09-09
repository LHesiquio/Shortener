import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { shortlinkService } from '@/services/shortlinkService';
import { useToast } from '@/context/ToastContext';
import { NewLinkDrawer } from '@/components/organisms/NewLinkDrawer/NewLinkDrawer';
import type { PublicShortlink } from '@/types/shortlink.types';
import type { DrawerFormData } from '@/components/organisms/NewLinkDrawer/NewLinkDrawer.types';

export interface OpenDrawerOptions {
  initialUrl?: string;
  editTarget?: PublicShortlink | null;
  defaultProjectId?: string;
  onCreated?: () => void;
}

interface NewLinkDrawerContextType {
  openNewLinkDrawer: (options?: OpenDrawerOptions) => void;
  closeNewLinkDrawer: () => void;
}

const NewLinkDrawerContext = createContext<NewLinkDrawerContextType | null>(null);

export function NewLinkDrawerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PublicShortlink | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | undefined>(undefined);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const openNewLinkDrawer = useCallback((options?: OpenDrawerOptions) => {
    setEditTarget(options?.editTarget ?? null);
    setInitialUrl(options?.initialUrl);
    setDefaultProjectId(options?.defaultProjectId);
    setError(null);
    setOnSuccessCallback(() => (options?.onCreated ? options.onCreated : null));
    setIsOpen(true);
  }, []);

  const closeNewLinkDrawer = useCallback(() => {
    setIsOpen(false);
    setEditTarget(null);
    setInitialUrl(undefined);
    setDefaultProjectId(undefined);
    setError(null);
    setOnSuccessCallback(null);
  }, []);

  const handleSave = async (formData: DrawerFormData) => {
    setSaving(true);
    setError(null);
    try {
      if (editTarget) {
        await shortlinkService.update(editTarget.id, {
          url: formData.url,
          title: formData.title || undefined,
          projectId: formData.projectId || undefined,
          activeFrom: formData.activeFrom,
          activeTo: formData.activeTo,
        });
        toast.push('Shortlink updated successfully', 'success');
      } else {
        await shortlinkService.create({
          url: formData.url,
          title: formData.title || undefined,
          slug: formData.slug || undefined,
          projectId: formData.projectId || undefined,
          activeFrom: formData.activeFrom,
          activeTo: formData.activeTo,
        });
        toast.push('Shortlink created successfully', 'success');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shortlinks'] }),
        queryClient.invalidateQueries({ queryKey: ['project-shortlinks'] }),
        queryClient.invalidateQueries({ queryKey: ['projects-list'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);

      if (onSuccessCallback) {
        onSuccessCallback();
      }
      closeNewLinkDrawer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save shortlink';
      setError(msg);
      toast.push(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const contextValue = useMemo(
    () => ({ openNewLinkDrawer, closeNewLinkDrawer }),
    [openNewLinkDrawer, closeNewLinkDrawer]
  );

  return (
    <NewLinkDrawerContext.Provider value={contextValue}>
      {children}
      <NewLinkDrawer
        isOpen={isOpen}
        editTarget={editTarget}
        initialUrl={initialUrl}
        defaultProjectId={defaultProjectId}
        saving={saving}
        error={error}
        onClose={closeNewLinkDrawer}
        onSave={handleSave}
      />
    </NewLinkDrawerContext.Provider>
  );
}

export function useNewLinkDrawer() {
  const ctx = useContext(NewLinkDrawerContext);
  if (!ctx) {
    throw new Error('useNewLinkDrawer must be used within a NewLinkDrawerProvider');
  }
  return ctx;
}
