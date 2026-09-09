import type { RegisterFormProps } from './RegisterForm.types';
import { RegisterStep1 } from './RegisterStep1';
import { RegisterStep2 } from './RegisterStep2';
import { RegisterStep3 } from './RegisterStep3';
import { useRegisterStepAnimation } from './useRegisterStepAnimation';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import './RegisterForm.css';

const STEP_COMPONENTS = [RegisterStep1, RegisterStep2, RegisterStep3];

function getButtonText(loading: boolean, isLastStep: boolean): string {
  if (loading) return 'Creating Account…';
  return isLastStep ? 'Create Account' : 'Next';
}

export function RegisterForm({ currentStep, totalSteps, formData, onNext, onBack, error, fieldErrors, loading = false }: RegisterFormProps) {
  const { direction, animationKey } = useRegisterStepAnimation(currentStep);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const StepComponent = STEP_COMPONENTS[currentStep - 1];
  const isLastStep = currentStep === totalSteps;
  const btnText = getButtonText(loading, isLastStep);

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}

      <div className="step-container">
        <div key={animationKey} className={`step-animated-wrapper ${direction}`}>
          <StepComponent formData={formData} fieldErrors={fieldErrors} />
        </div>
      </div>

      <div className="form-actions">
        {currentStep > 1 ? (
          <button type="button" className="back-btn" onClick={onBack} disabled={loading}>Back</button>
        ) : (
          <div />
        )}
        <Button type="submit" disabled={loading}>
          {btnText}
          <Icon name={loading ? 'sync' : 'arrow_forward'} />
        </Button>
      </div>
    </form>
  );
}
