import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { LoginResponsePayload } from '@/types/auth.types';

function saveLoginSession(data: LoginResponsePayload) {
  if (data?.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const performLogin = async () => {
    setLoading(true);
    setError(null);
    setIsInactive(false);
    setResendSuccess(false);
    try {
      const data = await apiClient.post<LoginResponsePayload>('/api/auth/login', {
        email: email.trim(),
        password,
        remember,
      });
      saveLoginSession(data);
      if (data?.user) {
        queryClient.setQueryData(['auth-me'], data.user);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_INACTIVE') {
        setIsInactive(true);
        setError('Your account is not active yet. Please verify your email before signing in.');
      } else {
        setIsInactive(false);
        const msg = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await authService.resendVerification(email.trim());
      setResendSuccess(true);
    } catch {
      // keep existing message
    } finally {
      setResending(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void performLogin();
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    loading,
    error,
    isInactive,
    resending,
    resendSuccess,
    isForgotPasswordOpen,
    setIsForgotPasswordOpen,
    handleLogin,
    handleResendVerification,
  };
}
