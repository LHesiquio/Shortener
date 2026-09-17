import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/lib/apiClient';
import type { TwoFactorBackupCodesModalProps } from './TwoFactorBackupCodesModal.types';

function downloadCodesFile(codes: string[]) {
  const content = `LinkTracker Backup Codes\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'linktracker-backup-codes.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export function useTwoFactorBackupCodesModal({ onClose }: TwoFactorBackupCodesModalProps) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.regenerateBackupCodes(password),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setPassword('');
      toast.push('New backup codes generated', 'success');
    },
    onError: (err: unknown) => {
      toast.push(err instanceof ApiError ? err.message : 'Failed to generate codes', 'error');
    },
  });

  const handleCopyAll = async () => {
    if (!backupCodes.length) return;
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    toast.push('Backup codes copied', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    password, setPassword, backupCodes, copied, generating: mutation.isPending,
    handleRegenerate: () => (password ? mutation.mutate() : toast.push('Enter password', 'warning')),
    handleCopyAll,
    handleDownload: () => downloadCodesFile(backupCodes),
    handleClose: () => { setPassword(''); setBackupCodes([]); onClose(); },
  };
}
