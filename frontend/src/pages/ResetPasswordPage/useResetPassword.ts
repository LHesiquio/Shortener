import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';
import { ApiError } from '@/lib/apiClient';
import { getResetPasswordValidationError } from '@/utils/authValidation.utils';

export function useResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing password reset token. Please request a new link.');
      return;
    }

    const valErr = getResetPasswordValidationError(password, confirmPassword);
    if (valErr) {
      setError(valErr);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    hasToken: Boolean(token),
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    isSuccess,
    handleSubmit,
  };
}
