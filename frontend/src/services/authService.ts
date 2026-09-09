import { apiClient } from '@/lib/apiClient';
import type { PublicUser } from '@/types/api';

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
};
