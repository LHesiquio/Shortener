import { FormField } from '@/components/molecules/FormField/FormField';
import type { RegisterFormData } from '@/types/register';

interface RegisterStep1Props {
  formData: RegisterFormData;
  fieldErrors?: Record<string, string>;
}

export function RegisterStep1({ formData, fieldErrors }: RegisterStep1Props) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">Who are you?</h2>
        <p className="step-subtitle">Start your journey with your basic details.</p>
      </div>
      <div className="step-fields">
        <FormField
          label="First Name"
          id="first_name"
          placeholder="e.g., Alex"
          value={formData.firstName}
          onChange={(e) => formData.setFirstName(e.target.value)}
          errorMessage={fieldErrors?.firstName}
          required
        />
        <FormField
          label="Last Name"
          id="last_name"
          placeholder="e.g., Rivera"
          value={formData.lastName}
          onChange={(e) => formData.setLastName(e.target.value)}
          errorMessage={fieldErrors?.lastName}
          required
        />
      </div>
    </div>
  );
}
