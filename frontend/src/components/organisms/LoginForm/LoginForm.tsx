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

export function LoginForm(props: LoginFormProps) {
  return (
    <form className="login-form" onSubmit={props.onSubmit}>
      {props.error && <div className="error-message">{props.error}</div>}

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
          <a href="#" className="forgot-link">Forgot?</a>
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
