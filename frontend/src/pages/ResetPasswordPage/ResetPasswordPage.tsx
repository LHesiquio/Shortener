import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon/Icon';
import { FormField } from '@/components/molecules/FormField/FormField';
import { Button } from '@/components/atoms/Button/Button';
import { useResetPassword } from './useResetPassword';
import './ResetPasswordPage.css';

function ResetHeader() {
  return (
    <div className="reset-brand">
      <div className="reset-brand-icon">
        <Icon name="lock_reset" size={32} />
      </div>
      <h1 className="reset-brand-name">Reset Your Password</h1>
      <p className="reset-brand-tagline">Enter and confirm your new secure password.</p>
    </div>
  );
}

function ResetSuccessView({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="reset-success-view">
      <div className="reset-success-icon-wrapper">
        <Icon name="task_alt" size={36} />
      </div>
      <h2 className="reset-success-title">Password Reset Complete!</h2>
      <p className="reset-success-body">
        Your password has been successfully updated. You can now sign in using your new credentials.
      </p>
      <Button type="button" fullWidth onClick={onLogin}>
        Sign In Now
        <Icon name="arrow_forward" />
      </Button>
    </div>
  );
}

function ResetMissingTokenView() {
  return (
    <div className="reset-missing-token-view">
      <div className="reset-warning-icon-wrapper">
        <Icon name="warning" size={36} />
      </div>
      <h2 className="reset-success-title">Invalid Reset Link</h2>
      <p className="reset-success-body">
        This password reset link is missing a valid token or has expired. Please request a new password reset link.
      </p>
      <Link to="/login" className="reset-back-link">
        <Button type="button" fullWidth variant="secondary">
          Back to Sign In
        </Button>
      </Link>
    </div>
  );
}

function ResetForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  loading,
  onSubmit,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="reset-password-form" onSubmit={onSubmit}>
      {error && <div className="reset-password-error">{error}</div>}

      <FormField
        label="New Password"
        id="new-password"
        type="password"
        placeholder="••••••••"
        iconName="lock"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <FormField
        label="Confirm New Password"
        id="confirm-new-password"
        type="password"
        placeholder="••••••••"
        iconName="lock"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <div className="password-requirements">
        Must be at least 8 characters and include at least one special character.
      </div>

      <div className="reset-password-actions">
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Updating Password…' : 'Reset Password'}
          <Icon name="arrow_forward" />
        </Button>
      </div>

      <p className="reset-back-link">
        Remembered your password? <Link to="/login" className="link-accent">Sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordPage() {
  const reset = useResetPassword();
  const navigate = useNavigate();

  return (
    <div className="reset-password-page">
      <div className="reset-bg-orb reset-orb-top-left" />
      <div className="reset-bg-orb reset-orb-bottom-right" />

      <main className="reset-password-main">
        <div className="reset-password-card">
          <ResetHeader />

          {reset.isSuccess ? (
            <ResetSuccessView onLogin={() => navigate('/login')} />
          ) : !reset.hasToken ? (
            <ResetMissingTokenView />
          ) : (
            <ResetForm
              password={reset.password}
              setPassword={reset.setPassword}
              confirmPassword={reset.confirmPassword}
              setConfirmPassword={reset.setConfirmPassword}
              error={reset.error}
              loading={reset.loading}
              onSubmit={reset.handleSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
