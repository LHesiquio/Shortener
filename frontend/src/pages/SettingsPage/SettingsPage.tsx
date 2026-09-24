import { Icon } from '@/components/atoms/Icon/Icon';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import { SelectInput } from '@/components/atoms/SelectInput/SelectInput';
import { DeactivateModal } from '@/components/molecules/DeactivateModal/DeactivateModal';
import { ChangePasswordModal } from '@/components/molecules/ChangePasswordModal/ChangePasswordModal';
import { PalettePicker } from '@/components/molecules/PalettePicker/PalettePicker';
import { TwoFactorSetupModal } from '@/components/organisms/TwoFactorSetupModal/TwoFactorSetupModal';
import { TwoFactorDisableModal } from '@/components/organisms/TwoFactorDisableModal/TwoFactorDisableModal';
import { TwoFactorBackupCodesModal } from '@/components/organisms/TwoFactorBackupCodesModal/TwoFactorBackupCodesModal';
import { APP_CONFIG } from '@/config/app.config';
import { TooltipBubble } from '@/components/atoms/Tooltip/TooltipBubble';
import { useTooltip } from '@/components/atoms/Tooltip/useTooltip';
import { useSettingsPage } from './useSettingsPage';
import { TIMEZONE_OPTIONS } from './SettingsPage.types';
import './SettingsPage.css';

export function SettingsPage() {
  const {
    loadingUser,
    isEditingProfile,
    profileForm,
    setProfileForm,
    savingProfile,
    preferencesData,
    handleStartEditing,
    handleCancelEditing,
    handleSaveProfile,
    handleAutoDetectTimezone,
    handleThemeChange,
    handlePaletteChange,
    // Password state & handlers
    showPasswordModal,
    setShowPasswordModal,
    passwordForm,
    setPasswordForm,
    changingPassword,
    handleSavePassword,
    // Deactivate state & handlers
    showDeactivateModal,
    setShowDeactivateModal,
    deactivating,
    handleConfirmDeactivate,
    // 2FA state & handlers
    user,
    showTwoFactorSetupModal,
    setShowTwoFactorSetupModal,
    showTwoFactorDisableModal,
    setShowTwoFactorDisableModal,
    showTwoFactorBackupCodesModal,
    setShowTwoFactorBackupCodesModal,
    handleToggleTwoFactor,
  } = useSettingsPage();

  const emailTooltip = useTooltip<HTMLDivElement>({ label: 'Email address cannot be changed' });

  return (
    <>
      <div className="dashboard-canvas">
        <div className="settings-page-container">
            {/* Header */}
            <div className="settings-header">
              <h2 className="settings-title">Settings</h2>
              <p className="settings-subtitle">Manage your account preferences, timezone, and security settings.</p>
            </div>

            {/* Profile & Timezone Settings */}
            <section className={`settings-section-card ${isEditingProfile ? 'is-editing' : ''}`}>
              <div className="settings-section-header">
                <div className="settings-section-header-info">
                  <div className="settings-icon-badge">
                    <Icon name="person" />
                  </div>
                  <div>
                    <h3 className="settings-section-title">Profile & Timezone</h3>
                    <p className="settings-section-subtitle">
                      {isEditingProfile
                        ? 'Edit your public identity and analytics timezone preference.'
                        : 'View your public identity and analytics timezone preference.'}
                    </p>
                  </div>
                </div>

                {!loadingUser && (
                  <button
                    type="button"
                    className={`settings-btn-secondary settings-edit-toggle-btn ${isEditingProfile ? 'active' : ''}`}
                    onClick={isEditingProfile ? handleCancelEditing : handleStartEditing}
                    title={isEditingProfile ? "Cancel editing" : "Edit profile"}
                  >
                    <Icon name={isEditingProfile ? "close" : "edit"} />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
                  </button>
                )}
              </div>

              {loadingUser ? (
                <div className="settings-grid-2col">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="settings-field-group">
                      <Skeleton width="80px" height="0.85rem" style={{ marginBottom: '0.4rem' }} />
                      <Skeleton width="100%" height="2.5rem" borderRadius="0.5rem" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="settings-grid-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">First Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      disabled={!isEditingProfile}
                      readOnly={!isEditingProfile}
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">Last Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      disabled={!isEditingProfile}
                      readOnly={!isEditingProfile}
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">Nickname / Handle</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profileForm.nickname}
                      onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                      disabled={!isEditingProfile}
                      readOnly={!isEditingProfile}
                    />
                  </div>

                  <div className="settings-field-group" {...emailTooltip.anchorProps}>
                    <label className="settings-label">Email Address</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={profileForm.email}
                      disabled
                      readOnly
                      style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'var(--color-surface-container-highest, #e3e3dc)' }}
                    />
                    <TooltipBubble {...emailTooltip.tooltipProps} />
                  </div>

                  <div className="settings-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label">Analytics Timezone Preference</label>
                    <div className="settings-row-inline">
                      <SelectInput
                        options={TIMEZONE_OPTIONS}
                        value={profileForm.timezone}
                        onChange={(val) => setProfileForm({ ...profileForm, timezone: val })}
                        placeholder="Select a timezone..."
                        iconName="schedule"
                        disabled={!isEditingProfile}
                      />
                      {isEditingProfile && (
                        <button
                          type="button"
                          className="settings-btn-secondary settings-autodetect-btn"
                          onClick={handleAutoDetectTimezone}
                        >
                          <Icon name="refresh" size={16} />
                          <span>Auto-Detect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={`settings-action-bar-wrapper ${isEditingProfile ? 'expanded' : ''}`}>
                <div className="settings-action-bar-inner">
                  <div className="settings-action-bar">
                    <button
                      type="button"
                      className="settings-btn-primary"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="settings-section-card">
              <div className="settings-section-header">
                <div className="settings-section-header-info">
                  <div className="settings-icon-badge" style={{ background: 'var(--color-secondary-container, #e0eb78)', color: 'var(--color-on-secondary-container, #616a00)' }}>
                    <Icon name="security" />
                  </div>
                  <div>
                    <h3 className="settings-section-title">Security</h3>
                    <p className="settings-section-subtitle">Ensure your account remains safe and protected.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Change Password row */}
                <div className="settings-item-row">
                  <div className="settings-item-info">
                    <Icon name="password" style={{ color: 'var(--color-on-surface-variant)' }} />
                    <div>
                      <p className="settings-item-text-title">Password</p>
                      <p className="settings-item-text-sub">Manage your account authentication credentials</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="settings-btn-secondary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </button>
                </div>

                {/* 2FA Option */}
                <div className="settings-item-row">
                  <div className="settings-item-info">
                    <Icon
                      name={user?.twoFactorEnabled ? 'verified_user' : 'shield'}
                      style={{
                        color: user?.twoFactorEnabled
                          ? 'var(--color-primary, #636037)'
                          : 'var(--color-on-surface-variant)',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p className="settings-item-text-title">Two-Factor Authentication (2FA)</p>
                        {user?.twoFactorEnabled && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: 'var(--color-secondary-container, #e0eb78)',
                              color: 'var(--color-on-secondary-container, #616a00)',
                            }}
                          >
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="settings-item-text-sub">
                        {user?.twoFactorEnabled
                          ? 'Your account is protected with time-based one-time password (TOTP) verification.'
                          : 'Protect your account with an extra verification layer using an authenticator app.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {user?.twoFactorEnabled && (
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => setShowTwoFactorBackupCodesModal(true)}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                      >
                        <Icon name="key" size={16} />
                        <span>Backup Codes</span>
                      </button>
                    )}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(user?.twoFactorEnabled)}
                      className={`settings-toggle-switch ${user?.twoFactorEnabled ? 'active' : ''}`}
                      onClick={handleToggleTwoFactor}
                      title={user?.twoFactorEnabled ? 'Click to disable 2FA' : 'Click to enable 2FA'}
                    >
                      <div className="settings-toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance & Color Themes Section */}
            <section className="settings-section-card">
              <div className="settings-section-header">
                <div className="settings-section-header-info">
                  <div className="settings-icon-badge" style={{ background: 'var(--color-tertiary-container, #bbe9ff)', color: 'var(--color-on-tertiary-container, #154d5f)' }}>
                    <Icon name="palette" />
                  </div>
                  <div>
                    <h3 className="settings-section-title">Appearance & Themes</h3>
                    <p className="settings-section-subtitle">Customize the interface color scheme and light/dark display mode.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="settings-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Interface Mode
                </label>
                <div className="settings-theme-group">
                  <button
                    type="button"
                    className={`settings-theme-btn ${preferencesData.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Icon name="light_mode" /> Light
                  </button>
                  <button
                    type="button"
                    className={`settings-theme-btn ${preferencesData.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Icon name="dark_mode" /> Dark
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label className="settings-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Color Palette
                </label>
                <p className="settings-section-subtitle" style={{ margin: '0 0 0.5rem 0' }}>
                  Choose a signature color tone for cards, highlights, buttons, and backgrounds.
                </p>
                <PalettePicker
                  selectedPalette={preferencesData.palette}
                  onSelectPalette={handlePaletteChange}
                />
              </div>
            </section>

            {/* Danger Zone */}
            <div className="settings-danger-zone">
              <button
                type="button"
                className="settings-btn-danger"
                onClick={() => setShowDeactivateModal(true)}
              >
                <Icon name="delete_forever" /> Deactivate Account
              </button>
              <p className="settings-version-tag">
                {APP_CONFIG.name} v{APP_CONFIG.version} ({APP_CONFIG.releaseStage}) • Made with care for your digital garden.
              </p>
            </div>
          </div>
        </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        changing={changingPassword}
        formData={passwordForm}
        onFormChange={setPasswordForm}
        onConfirm={handleSavePassword}
        onCancel={() => setShowPasswordModal(false)}
      />

      {/* Deactivate Account Confirmation Modal */}
      <DeactivateModal
        isOpen={showDeactivateModal}
        deactivating={deactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setShowDeactivateModal(false)}
      />

      {/* Two-Factor Authentication Modals */}
      <TwoFactorSetupModal
        isOpen={showTwoFactorSetupModal}
        onClose={() => setShowTwoFactorSetupModal(false)}
      />
      <TwoFactorDisableModal
        isOpen={showTwoFactorDisableModal}
        onClose={() => setShowTwoFactorDisableModal(false)}
      />
      <TwoFactorBackupCodesModal
        isOpen={showTwoFactorBackupCodesModal}
        onClose={() => setShowTwoFactorBackupCodesModal(false)}
      />
    </>
  );
}
