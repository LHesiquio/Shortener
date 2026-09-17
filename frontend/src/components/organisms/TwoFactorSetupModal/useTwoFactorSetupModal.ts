import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/lib/apiClient';
import type { TwoFactorSetupStep, TwoFactorSetupModalProps } from './TwoFactorSetupModal.types';

function triggerTxtDownload(codes: string[]) {
  const content = `LinkTracker Backup Codes\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'linktracker-backup-codes.txt';
  link.click();
  URL.revokeObjectURL(url);
}

async function copyWithTimeout(text: string, setCopied: (v: boolean) => void) {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

export function useTwoFactorSetupModal({ isOpen, onSuccess }: TwoFactorSetupModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<TwoFactorSetupStep>('scan');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const setupQuery = useQuery({ queryKey: ['2fa-setup'], queryFn: authService.setup2FA, enabled: isOpen, staleTime: 0 });
  const confirmMutation = useMutation({
    mutationFn: authService.confirm2FA,
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep('backup');
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      toast.push('2FA enabled!', 'success');
      onSuccess?.();
    },
    onError: (err: unknown) => toast.push(err instanceof ApiError ? err.message : 'Invalid code', 'error'),
  });

  return {
    step, setStep, code, setCode, backupCodes, copiedSecret, copiedCodes,
    setupData: setupQuery.data ?? null,
    loadingSetup: setupQuery.isLoading,
    confirming: confirmMutation.isPending,
    handleCopySecret: () => setupQuery.data?.secret && copyWithTimeout(setupQuery.data.secret, setCopiedSecret),
    handleCopyAllCodes: () => backupCodes.length && copyWithTimeout(backupCodes.join('\n'), setCopiedCodes),
    handleDownloadCodes: () => triggerTxtDownload(backupCodes),
    handleConfirmCode: () => (code.length < 6 ? toast.push('Enter 6 digits', 'warning') : confirmMutation.mutate(code)),
    handleReset: () => { setStep('scan'); setCode(''); setBackupCodes([]); },
  };
}
