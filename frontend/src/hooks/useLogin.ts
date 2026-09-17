import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { LoginResponsePayload } from '@/types/auth.types';

export interface MfaChallengeState {
  mfaToken: string;
  email: string;
}

function saveSessionAndNavigate(data: { accessToken?: string; user?: unknown }, qc: QueryClient, nav: (p: string) => void) {
  if (data?.accessToken) localStorage.setItem('accessToken', data.accessToken);
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
    qc.setQueryData(['auth-me'], data.user);
  }
  nav('/dashboard');
}

function parseLoginError(err: unknown): { inactive: boolean; msg: string } {
  if (err instanceof ApiError && err.code === 'ACCOUNT_INACTIVE') {
    return { inactive: true, msg: 'Account inactive. Verify email first.' };
  }
  if (err instanceof ApiError) return { inactive: false, msg: err.message };
  return { inactive: false, msg: 'An unexpected error occurred.' };
}

function useCredentials() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  return { email, setEmail, password, setPassword, remember, setRemember };
}

function useMfaState() {
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  return {
    mfaChallenge, setMfaChallenge, mfaCode, setMfaCode, backupCode, setBackupCode, useBackupCode, setUseBackupCode,
    resetMfa: () => { setMfaChallenge(null); setMfaCode(''); setBackupCode(''); setUseBackupCode(false); },
  };
}

function useVerification(email: string) {
  const [isInactive, setIsInactive] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try { await authService.resendVerification(email.trim()); setResendSuccess(true); } catch { /* ignore */ } finally { setResending(false); }
  };
  return { isInactive, setIsInactive, resending, resendSuccess, handleResend };
}

export function useLogin() {
  const creds = useCredentials();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const mfa = useMfaState();
  const ver = useVerification(creds.email);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const performLogin = async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient.post<LoginResponsePayload>('/api/auth/login', { email: creds.email.trim(), password: creds.password, remember: creds.remember });
      if (data?.mfaRequired && data.mfaToken) return mfa.setMfaChallenge({ mfaToken: data.mfaToken, email: data.email ?? creds.email });
      saveSessionAndNavigate(data, qc, navigate);
    } catch (err) {
      const p = parseLoginError(err);
      ver.setIsInactive(p.inactive); setError(p.msg);
    } finally { setLoading(false); }
  };

  const performVerifyMfa = async () => {
    if (!mfa.mfaChallenge) return;
    setLoading(true); setError(null);
    try {
      const payload = mfa.useBackupCode ? { mfaToken: mfa.mfaChallenge.mfaToken, backupCode: mfa.backupCode.trim() } : { mfaToken: mfa.mfaChallenge.mfaToken, code: mfa.mfaCode.trim() };
      const data = await authService.verify2FAChallenge(payload);
      saveSessionAndNavigate(data, qc, navigate);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Invalid code'); } finally { setLoading(false); }
  };

  return {
    ...creds, loading, error, isForgotPasswordOpen, setIsForgotPasswordOpen,
    isInactive: ver.isInactive, resending: ver.resending, resendSuccess: ver.resendSuccess, handleResendVerification: ver.handleResend,
    ...mfa,
    handleVerifyMfaSubmit: (e: React.FormEvent) => { e.preventDefault(); void performVerifyMfa(); },
    handleCancelMfa: () => { mfa.resetMfa(); setError(null); },
    handleLogin: (e: React.FormEvent) => { e.preventDefault(); void performLogin(); },
  };
}
