import type React from 'react';
import type { MfaChallengeState } from '@/hooks/useLogin';

export interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  isInactive?: boolean;
  onResendVerification?: () => void;
  resending?: boolean;
  resendSuccess?: boolean;
  onForgotPassword?: () => void;

  // 2FA Challenge props
  mfaChallenge?: MfaChallengeState | null;
  mfaCode?: string;
  setMfaCode?: (v: string) => void;
  backupCode?: string;
  setBackupCode?: (v: string) => void;
  useBackupCode?: boolean;
  setUseBackupCode?: (v: boolean) => void;
  onVerifyMfaSubmit?: (e: React.FormEvent) => void;
  onCancelMfa?: () => void;
}
