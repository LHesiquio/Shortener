import { Checkbox } from '@/components/atoms/Checkbox/Checkbox';
import { SidebarNav } from '@/components/organisms/SidebarNav/SidebarNav';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopAppBar } from '@/components/organisms/TopAppBar/TopAppBar';
import { Icon } from '@/components/atoms/Icon/Icon';
import { ReleaseBadge } from '@/components/atoms/ReleaseBadge/ReleaseBadge';
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton';
import { SelectInput } from '@/components/atoms/SelectInput/SelectInput';
import { DeactivateModal } from '@/components/molecules/DeactivateModal/DeactivateModal';
import { ChangePasswordModal } from '@/components/molecules/ChangePasswordModal/ChangePasswordModal';
import { PalettePicker } from '@/components/molecules/PalettePicker/PalettePicker';
import { APP_CONFIG } from '@/config/app.config';
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
  } = useSettingsPage();

  return (
    <div className="dashboard-layout">
      <SidebarNav />

      <main className="dashboard-main">
        <TopAppBar />

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

                  <div className="settings-field-group">
                    <label className="settings-label">Email Address</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={profileForm.email}
                      disabled
                      readOnly
                      title="Email address cannot be changed"
                      style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'var(--color-surface-container-highest, #e3e3dc)' }}
                    />
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

                {/* 2FA Option (Alpha disabled) */}
                <div className="settings-item-row disabled">
                  <div className="settings-item-info">
                    <Icon name="verified_user" style={{ color: 'var(--color-on-surface-variant)' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p className="settings-item-text-title">Two-Factor Authentication (2FA)</p>
                        <ReleaseBadge size="xs" variant="subtle" />
                      </div>
                      <p className="settings-item-text-sub">Protect your account with an extra verification layer (Coming Soon)</p>
                    </div>
                  </div>
                  <div className="settings-toggle-switch" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                    <div className="settings-toggle-thumb" />
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

            {/* Notifications Section (Alpha disabled) */}
            <section className="settings-section-card settings-disabled-card">
              <div className="settings-section-header">
                <div className="settings-section-header-info">
                  <div className="settings-icon-badge" style={{ background: 'var(--color-surface-container-highest, #e3e3dc)', color: 'var(--color-on-surface-variant, #49473c)' }}>
                    <Icon name="notifications" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 className="settings-section-title">Notifications</h3>
                      <ReleaseBadge size="xs" variant="subtle" />
                    </div>
                    <p className="settings-section-subtitle">Configure email and security notification preferences (Coming Soon).</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Checkbox
                  label="Weekly Analytics Summary"
                  description="Receive a weekly performance report of your shortlinks"
                  checked={preferencesData.weeklyReport}
                  disabled
                />
                <Checkbox
                  label="Security Alerts & Logins"
                  description="Get notified about new sign-ins from unrecognized devices"
                  checked={preferencesData.securityAlerts}
                  disabled
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
      </main>

      <MobileBottomNav />

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
    </div>
  );
}
