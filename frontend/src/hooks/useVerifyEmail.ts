import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { VerifyEmailResponsePayload, ResendVerificationResponsePayload } from '@/types/auth.types';

function useResendState() {
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resendEmail.trim()) return setResendError('Please enter your email address.');
    setResending(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      await apiClient.post<ResendVerificationResponsePayload>('/api/auth/resend-verification', { email: resendEmail.trim() });
      setResendSuccess(true);
    } catch (err: unknown) { setResendError(err instanceof ApiError ? err.message : 'Failed to resend verification email.'); }
    finally { setResending(false); }
  };

  return { resendEmail, setResendEmail, resending, resendSuccess, resendError, handleResend };
}

export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState<boolean>(() => Boolean(token));
  const [success, setSuccess] = useState(false);
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resendState = useResendState();

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    apiClient.post<VerifyEmailResponsePayload>('/api/auth/verify-email', { token })
      .then((d) => {
        if (!isMounted) return;
        if (d?.alreadyActive) setAlreadyActive(true);
        else setSuccess(true);
      })
      .catch((e: unknown) => { if (isMounted) setError(e instanceof ApiError ? e.message : 'Verification failed.'); })
      .finally(() => { if (isMounted) setVerifying(false); });
    return () => { isMounted = false; };
  }, [token]);

  return { token, verifying, success, alreadyActive, error, ...resendState };
}
