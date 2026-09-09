import { FormField } from '@/components/molecules/FormField/FormField';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { RegisterFormData } from '@/types/register';
import { isMinPasswordLength, hasSpecialCharacter } from '@/utils/authValidation.utils';

interface RegisterStep3Props {
  formData: RegisterFormData;
  fieldErrors?: Record<string, string>;
}

function PasswordRequirements({ password }: { password: string }) {
  const hasMinLength = isMinPasswordLength(password, 8);
  const hasSpecialChar = hasSpecialCharacter(password);

  return (
    <div className="requirements-list">
      <div className={`requirement-item ${hasMinLength ? 'valid' : ''}`}>
        <Icon name="check_circle" className="req-icon" />
        <span>At least 8 characters</span>
      </div>
      <div className={`requirement-item ${hasSpecialChar ? 'valid' : ''}`}>
        <Icon name="check_circle" className="req-icon" />
        <span>Includes a special character</span>
      </div>
    </div>
  );
}

export function RegisterStep3({ formData, fieldErrors }: RegisterStep3Props) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">Secure your seeds</h2>
        <p className="step-subtitle">Create a strong password to protect your links.</p>
      </div>
      <div className="step-fields">
        <FormField
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          iconName="lock"
          value={formData.password}
          onChange={(e) => formData.setPassword(e.target.value)}
          errorMessage={fieldErrors?.password}
          required
        />
        <FormField
          label="Confirm Password"
          id="confirm_password"
          type="password"
          placeholder="••••••••"
          iconName="verified_user"
          value={formData.confirmPassword}
          onChange={(e) => formData.setConfirmPassword(e.target.value)}
          errorMessage={fieldErrors?.confirmPassword}
          required
        />
        <PasswordRequirements password={formData.password} />
      </div>
    </div>
  );
}
