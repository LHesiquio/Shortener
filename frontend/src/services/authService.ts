import { apiClient } from '@/lib/apiClient';
import type {
  PublicUser,
  TwoFactorSetupResponse,
  TwoFactorConfirmResponse,
  TwoFactorChallengeResponse,
} from '@/types/api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  timezone?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface DisableTwoFactorPayload {
  currentPassword: string;
  code?: string;
}

export interface VerifyTwoFactorChallengePayload {
  mfaToken: string;
  code?: string;
  backupCode?: string;
}

export const authService = {
  async getMe(signal?: AbortSignal): Promise<PublicUser> {
    return apiClient.get<PublicUser>('/api/auth/me', { signal });
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<PublicUser> {
    return apiClient.patch<PublicUser>('/api/auth/profile', payload);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ ok: boolean; message: string }> {
    return apiClient.post<{ ok: boolean; message: string }>('/api/auth/change-password', payload);
  },

  async deactivateAccount(): Promise<{ ok: boolean; message: string }> {
    return apiClient.post<{ ok: boolean; message: string }>('/api/auth/deactivate', {});
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/resend-verification', { email });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/reset-password', { token, password });
  },

  async setup2FA(): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>('/api/auth/2fa/setup', {});
  },

  async confirm2FA(code: string): Promise<TwoFactorConfirmResponse> {
    return apiClient.post<TwoFactorConfirmResponse>('/api/auth/2fa/confirm', { code });
  },

  async disable2FA(payload: DisableTwoFactorPayload): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/2fa/disable', payload);
  },

  async verify2FAChallenge(payload: VerifyTwoFactorChallengePayload): Promise<TwoFactorChallengeResponse> {
    return apiClient.post<TwoFactorChallengeResponse>('/api/auth/2fa/challenge', payload);
  },

  async regenerateBackupCodes(currentPassword: string): Promise<TwoFactorConfirmResponse> {
    return apiClient.post<TwoFactorConfirmResponse>('/api/auth/2fa/backup-codes/regenerate', { currentPassword });
  },
};
