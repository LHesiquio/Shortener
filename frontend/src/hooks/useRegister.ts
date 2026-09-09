import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { RegisterResponsePayload } from '@/types/auth.types';
import { getRegistrationValidationError } from '@/utils/authValidation.utils';

function buildNickname(email: string): string {
  const clean = email.trim().split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
  const base = clean.length >= 3 ? clean : `${clean}_user`;
  return base.slice(0, 30);
}

function useRegisterFields() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  return {
    firstName, setFirstName, lastName, setLastName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword,
  };
}

function mapValidationError(valErr: string): Record<string, string> {
  if (valErr.toLowerCase().includes('email')) return { email: valErr };
  if (valErr.toLowerCase().includes('match')) return { confirmPassword: valErr };
  if (valErr.toLowerCase().includes('password')) return { password: valErr };
  return { general: valErr };
}

function mapApiError(msg: string): Record<string, string> {
  if (msg.toLowerCase().includes('email')) return { email: msg };
  return { general: msg };
}

function useRegisterStatus() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  return {
    currentStep, setCurrentStep, loading, setLoading, fieldErrors, setFieldErrors,
    isSuccess, setIsSuccess, isPendingVerification, setIsPendingVerification, verificationMessage, setVerificationMessage,
  };
}

function useRegisterResend(email: string) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    setResendError(null);
    try {
      await authService.resendVerification(email);
      setResendSuccess(true);
    } catch (err: unknown) {
      setResendError(err instanceof ApiError ? err.message : 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return { resending, resendSuccess, resendError, handleResend };
}

export function useRegister() {
  const f = useRegisterFields();
  const st = useRegisterStatus();
  const resend = useRegisterResend(f.email);
  const queryClient = useQueryClient();

  const executeApiCall = async () => {
    const data = await apiClient.post<RegisterResponsePayload>('/api/auth/register', {
      firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), password: f.password, nickname: buildNickname(f.email),
    });
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        queryClient.setQueryData(['auth-me'], data.user);
      }
      st.setIsSuccess(true);
    } else {
      st.setIsPendingVerification(true);
      st.setVerificationMessage(data?.message ?? 'Verification link sent to your email.');
    }
  };

  const submitRegistration = async () => {
    const valErr = getRegistrationValidationError(f.email, f.password, f.confirmPassword);
    if (valErr) return st.setFieldErrors(mapValidationError(valErr));
    st.setLoading(true);
    st.setFieldErrors({});
    try { await executeApiCall(); }
    catch (e: unknown) { st.setFieldErrors(mapApiError(e instanceof ApiError ? e.message : 'Failed to create account.')); }
    finally { st.setLoading(false); }
  };

  return {
    currentStep: st.currentStep, totalSteps: 3, isSuccess: st.isSuccess, isPendingVerification: st.isPendingVerification,
    verificationMessage: st.verificationMessage, email: f.email, loading: st.loading, error: st.fieldErrors.general ?? null,
    fieldErrors: st.fieldErrors, formData: f,
    resending: resend.resending, resendSuccess: resend.resendSuccess, resendError: resend.resendError,
    handleResend: resend.handleResend,
    handleNext: () => { st.setFieldErrors({}); if (st.currentStep < 3) st.setCurrentStep(st.currentStep + 1); else void submitRegistration(); },
    handleBack: () => { st.setFieldErrors({}); if (st.currentStep > 1) st.setCurrentStep(st.currentStep - 1); },
  };
}
