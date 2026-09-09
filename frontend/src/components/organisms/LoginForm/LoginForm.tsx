import { Checkbox } from '@/components/atoms/Checkbox/Checkbox';
import { FormField } from '@/components/molecules/FormField/FormField';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { LoginFormProps } from './LoginForm.types';
import './LoginForm.css';

function RememberCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="options-row">
      <Checkbox
        id="remember"
        checked={checked}
        onChange={onChange}
        label="Remember this device"
      />
    </div>
  );
}

function LoginErrorDisplay({
  error,
  isInactive,
  onResend,
  resending,
  resendSuccess,
}: {
  error: string;
  isInactive?: boolean;
  onResend?: () => void;
  resending?: boolean;
  resendSuccess?: boolean;
}) {
  return (
    <div className="login-error-container">
      <div className="error-message">{error}</div>
      {isInactive && onResend ? (
        <div className="resend-unverified-row">
          <button
            type="button"
            className="resend-unverified-btn"
            onClick={onResend}
            disabled={resending || resendSuccess}
          >
            <Icon name={resendSuccess ? 'check' : 'mark_email_read'} size={18} />
            {resendSuccess
              ? 'Verification email sent!'
              : resending
              ? 'Sending…'
              : 'Resend Verification Email'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <form className="login-form" onSubmit={props.onSubmit}>
      {props.error && (
        <LoginErrorDisplay
          error={props.error}
          isInactive={props.isInactive}
          onResend={props.onResendVerification}
          resending={props.resending}
          resendSuccess={props.resendSuccess}
        />
      )}

      <FormField
        label="Email Address"
        id="email"
        type="email"
        placeholder="hello@example.com"
        iconName="mail"
        value={props.email}
        onChange={(e) => props.setEmail(e.target.value)}
        required
      />

      <div className="password-section">
        <div className="password-header">
          <span className="form-label">Password</span>
          <button
            type="button"
            className="forgot-link-btn"
            onClick={props.onForgotPassword}
          >
            Forgot?
          </button>
        </div>
        <FormField
          label=""
          id="password"
          type="password"
          placeholder="••••••••"
          iconName="lock"
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          required
        />
      </div>

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
