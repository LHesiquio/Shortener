import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { ApiError } from '@/lib/apiClient';
import { isValidEmail } from '@/utils/authValidation.utils';

export function useForgotPasswordModal(isOpen: boolean, initialEmail?: string, onClose?: () => void) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail ?? '');
      setError(null);
      setIsSent(false);
      setLoading(false);
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email.trim());
      setIsSent(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsSent(false);
    onClose?.();
  };

  return {
    email,
    setEmail,
    loading,
    error,
    isSent,
    handleSubmit,
    handleClose,
  };
}
