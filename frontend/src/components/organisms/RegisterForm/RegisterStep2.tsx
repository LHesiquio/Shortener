import { FormField } from '@/components/molecules/FormField/FormField';
import { Icon } from '@/components/atoms/Icon/Icon';
import type { RegisterFormData } from '@/types/register';

interface RegisterStep2Props {
  formData: RegisterFormData;
  fieldErrors?: Record<string, string>;
}

export function RegisterStep2({ formData, fieldErrors }: RegisterStep2Props) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">Connect your account</h2>
        <p className="step-subtitle">We'll use this to keep your garden synced.</p>
      </div>
      <div className="step-fields">
        <FormField
          label="Email Address"
          id="email"
          type="email"
          placeholder="alex@example.com"
          iconName="mail"
          value={formData.email}
          onChange={(e) => formData.setEmail(e.target.value)}
          errorMessage={fieldErrors?.email}
          required
        />

        <div className="info-box">
          <Icon name="info" className="info-icon" />
          <p className="info-text">
            We'll send you a verification link after you finish creating your account.
          </p>
        </div>
      </div>
    </div>
  );
}
