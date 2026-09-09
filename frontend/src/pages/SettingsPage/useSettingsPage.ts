import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { UpdateProfilePayload, ChangePasswordPayload } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { useTheme, type ColorPaletteId } from '@/context/ThemeContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { ApiError } from '@/lib/apiClient';
import type { ProfileFormData, SecuritySettingsData, PreferenceSettingsData } from './SettingsPage.types';

/**
 * Resolves the browser's current IANA timezone string.
 * Falls back to 'UTC' if the browser returns an empty or invalid value.
 */
function resolveClientTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!tz || tz.toLowerCase() === 'auto') return 'UTC';
  return tz;
}

export function useSettingsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, palette, setPalette } = useTheme();
  const { user, isLoading: loadingUser } = useUserProfile();

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    timezone: 'UTC',
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [securityData, setSecurityData] = useState<SecuritySettingsData>({
    twoFactorEnabled: false,
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    weeklyReport: true,
    securityAlerts: true,
  });

  const preferencesData: PreferenceSettingsData = {
    theme,
    palette,
    weeklyReport: notificationPreferences.weeklyReport,
    securityAlerts: notificationPreferences.securityAlerts,
  };

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Deactivate modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    if (user) {
      // If the stored timezone is missing, 'auto', or blank → fall back to browser detection
      const stored = user.timezone?.trim();
      const ianaTimezone = (stored && stored !== 'auto') ? stored : resolveClientTimezone();
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nickname: user.nickname || '',
        email: user.email || '',
        timezone: ianaTimezone,
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authService.updateProfile(payload),
    onSuccess: (updatedUser) => {
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.push('Profile settings saved successfully.', 'success');
      setProfileForm({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        nickname: updatedUser.nickname || '',
        email: updatedUser.email || '',
        timezone: updatedUser.timezone || 'UTC',
      });
      setIsEditingProfile(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile settings.';
      toast.push(msg, 'error');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
    onSuccess: () => {
      toast.push('Password updated successfully.', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to change password.';
      toast.push(msg, 'error');
    },
  });

  const deactivateAccountMutation = useMutation({
    mutationFn: () => authService.deactivateAccount(),
    onSuccess: () => {
      toast.push('Your account has been deactivated.', 'info');
      localStorage.clear();
      queryClient.clear();
      navigate('/login');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to deactivate account.';
      toast.push(msg, 'error');
    },
  });

  const handleStartEditing = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEditing = () => {
    if (user) {
      const stored = user.timezone?.trim();
      const ianaTimezone = (stored && stored !== 'auto') ? stored : resolveClientTimezone();
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nickname: user.nickname || '',
        email: user.email || '',
        timezone: ianaTimezone,
      });
    }
    setIsEditingProfile(false);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      nickname: profileForm.nickname,
      email: profileForm.email,
      timezone: profileForm.timezone,
    });
  };

  const handleAutoDetectTimezone = () => {
    // Resolve the real IANA timezone from the browser — never save 'auto'
    const detected = resolveClientTimezone();
    setProfileForm((prev) => ({ ...prev, timezone: detected }));
    toast.push(`Timezone set to: ${detected}`, 'info');
  };

  const handleSavePassword = () => {
    if (!passwordForm.currentPassword) {
      toast.push('Please enter your current password.', 'warning');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      toast.push('New password must be at least 8 characters.', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.push('New passwords do not match.', 'warning');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleConfirmDeactivate = () => {
    deactivateAccountMutation.mutate();
  };

  const handleToggleTwoFactor = () => {
    setSecurityData((prev) => {
      const next = !prev.twoFactorEnabled;
      toast.push(next ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled', 'info');
      return { twoFactorEnabled: next };
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.push(`Theme updated to ${newTheme} mode`, 'info');
  };

  const handlePaletteChange = (newPalette: ColorPaletteId) => {
    setPalette(newPalette);
    toast.push('Color palette updated successfully', 'info');
  };

  const handleToggleNotification = (key: 'weeklyReport' | 'securityAlerts') => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    user,
    loadingUser,
    savingProfile: updateProfileMutation.isPending,
    isEditingProfile,
    profileForm,
    setProfileForm,
    securityData,
    preferencesData,
    // Password state & handlers
    showPasswordModal,
    setShowPasswordModal,
    passwordForm,
    setPasswordForm,
    changingPassword: changePasswordMutation.isPending,
    handleSavePassword,
    // Deactivate state & handlers
    showDeactivateModal,
    setShowDeactivateModal,
    deactivating: deactivateAccountMutation.isPending,
    handleConfirmDeactivate,
    // General handlers
    handleStartEditing,
    handleCancelEditing,
    handleSaveProfile,
    handleAutoDetectTimezone,
    handleToggleTwoFactor,
    handleThemeChange,
    handlePaletteChange,
    handleToggleNotification,
  };
}

