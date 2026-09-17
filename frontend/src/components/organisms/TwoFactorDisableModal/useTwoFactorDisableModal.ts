import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/lib/apiClient';
import type { TwoFactorDisableModalProps } from './TwoFactorDisableModal.types';

export function useTwoFactorDisableModal({ onClose, onSuccess }: TwoFactorDisableModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');

  const disableMutation = useMutation({
    mutationFn: () => authService.disable2FA({ currentPassword: password }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      toast.push('Two-factor authentication has been disabled', 'info');
      setPassword('');
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to disable 2FA. Check your password.';
      toast.push(msg, 'error');
    },
  });

  const handleConfirm = () => {
    if (!password) {
      toast.push('Please enter your current password', 'warning');
      return;
    }
    disableMutation.mutate();
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  return {
    password,
    setPassword,
    disabling: disableMutation.isPending,
    handleConfirm,
    handleCancel,
  };
}
