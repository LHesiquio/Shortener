import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/apiClient';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const performLogin = async () => {
    setLoading(true);
    setError(null);
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
      const msg = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void performLogin();
  };

  return { email, setEmail, password, setPassword, remember, setRemember, loading, error, handleLogin };
}
