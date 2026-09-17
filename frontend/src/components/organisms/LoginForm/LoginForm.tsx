import { Checkbox } from '@/components/atoms/Checkbox/Checkbox';
import { FormField } from '@/components/molecules/FormField/FormField';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { OtpInput } from '@/components/molecules/OtpInput/OtpInput';
import type { LoginFormProps } from './LoginForm.types';
import './LoginForm.css';

function RememberCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="options-row">
      <Checkbox id="remember" checked={checked} onChange={onChange} label="Remember this device" />
    </div>
  );
}

function ResendButton({ resending, resendSuccess, onResend }: { resending?: boolean; resendSuccess?: boolean; onResend: () => void }) {
  const label = resendSuccess ? 'Verification email sent!' : resending ? 'Sending…' : 'Resend Verification Email';
  return (
    <div className="resend-unverified-row">
      <button type="button" className="resend-unverified-btn" onClick={onResend} disabled={resending || resendSuccess}>
        <Icon name={resendSuccess ? 'check' : 'mark_email_read'} size={18} />
        {label}
      </button>
    </div>
  );
}

function LoginErrorDisplay({ error, isInactive, onResend, resending, resendSuccess }: {
  error: string; isInactive?: boolean; onResend?: () => void; resending?: boolean; resendSuccess?: boolean;
}) {
  return (
    <div className="login-error-container">
      <div className="error-message">{error}</div>
      {isInactive && onResend && <ResendButton resending={resending} resendSuccess={resendSuccess} onResend={onResend} />}
    </div>
  );
}

function MfaInputArea(props: LoginFormProps) {
  if (props.useBackupCode) {
    return (
      <FormField
        label="Recovery Backup Code"
        id="backupCode"
        type="text"
        placeholder="XXXX-XXXX"
        iconName="key"
        value={props.backupCode ?? ''}
        onChange={(e) => props.setBackupCode?.(e.target.value)}
        required
      />
    );
  }
  return (
    <div className="mfa-otp-section">
      <OtpInput value={props.mfaCode ?? ''} onChange={(val) => props.setMfaCode?.(val)} length={6} autoFocus disabled={props.loading} />
    </div>
  );
}

function MfaChallengeView(props: LoginFormProps) {
  const isBackup = Boolean(props.useBackupCode);
  return (
    <form className="login-form mfa-challenge-form" onSubmit={props.onVerifyMfaSubmit}>
      <div className="mfa-header">
        <div className="mfa-icon-badge"><Icon name="shield" size={26} /></div>
        <h2 className="mfa-title">Two-Factor Authentication</h2>
        <p className="mfa-subtitle">{isBackup ? 'Enter an 8-character recovery backup code.' : 'Enter the 6-digit code from your authenticator app.'}</p>
      </div>
      {props.error && <div className="login-error-container"><div className="error-message">{props.error}</div></div>}
      <MfaInputArea {...props} />
      <div className="mfa-toggle-row">
        <button type="button" className="mfa-toggle-btn" onClick={() => props.setUseBackupCode?.(!isBackup)}>
          {isBackup ? 'Use 6-digit authenticator code instead' : "Can't access your phone? Use a backup code"}
        </button>
      </div>
      <div className="action-row">
        <Button type="submit" fullWidth disabled={props.loading}>
          {props.loading ? 'Verifying…' : 'Verify & Sign In'}
          <Icon name="arrow_forward" />
        </Button>
      </div>
      <div className="mfa-back-row">
        <button type="button" className="mfa-cancel-btn" onClick={props.onCancelMfa} disabled={props.loading}>
          <Icon name="arrow_back" size={16} /><span>Back to sign in</span>
        </button>
      </div>
    </form>
  );
}

function PasswordField({ password, setPassword, onForgot }: { password: string; setPassword: (v: string) => void; onForgot?: () => void }) {
  return (
    <div className="password-section">
      <div className="password-header">
        <span className="form-label">Password</span>
        <button type="button" className="forgot-link-btn" onClick={onForgot}>Forgot?</button>
      </div>
      <FormField label="" id="password" type="password" placeholder="••••••••" iconName="lock" value={password} onChange={(e) => setPassword(e.target.value)} required />
    </div>
  );
}

export function LoginForm(props: LoginFormProps) {
  if (props.mfaChallenge) return <MfaChallengeView {...props} />;

  return (
    <form className="login-form" onSubmit={props.onSubmit}>
      {props.error && (
        <LoginErrorDisplay error={props.error} isInactive={props.isInactive} onResend={props.onResendVerification} resending={props.resending} resendSuccess={props.resendSuccess} />
      )}
      <FormField label="Email Address" id="email" type="email" placeholder="hello@example.com" iconName="mail" value={props.email} onChange={(e) => props.setEmail(e.target.value)} required />
      <PasswordField password={props.password} setPassword={props.setPassword} onForgot={props.onForgotPassword} />
      <RememberCheckbox checked={props.remember} onChange={props.setRemember} />
      <div className="action-row">
        <Button type="submit" fullWidth disabled={props.loading}>
          {props.loading ? 'Signing in…' : 'Sign In'}
          <Icon name="arrow_forward" />
        </Button>
      </div>
    </form>
  );
}
