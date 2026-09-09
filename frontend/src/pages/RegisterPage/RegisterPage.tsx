import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/components/organisms/RegisterForm/RegisterForm';
import { StepIndicator } from '@/components/molecules/StepIndicator/StepIndicator';
import { EmailSentNotice } from '@/components/molecules/EmailSentNotice/EmailSentNotice';
import { Icon } from '@/components/atoms/Icon/Icon';
import { ReleaseBadge } from '@/components/atoms/ReleaseBadge/ReleaseBadge';
import { useRegister } from '@/hooks/useRegister';
import './RegisterPage.css';

const STEP_LABELS = ['Identity', 'Contact', 'Security'];

function RegisterBrand() {
  return (
    <div className="register-brand">
      <div className="register-brand-icon">
        <Icon name="forest" className="register-brand-symbol" />
      </div>
      <div className="register-brand-title-row">
        <h1 className="register-brand-name">LinkTracker</h1>
        <ReleaseBadge size="sm" />
      </div>
      <p className="register-brand-tagline">Cultivate your digital garden.</p>
    </div>
  );
}

function SuccessView({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="success-view">
      <div className="success-icon-wrapper">
        <Icon name="task_alt" className="success-icon" />
      </div>
      <h2 className="success-title">Garden Established!</h2>
      <p className="success-body">Welcome aboard! Your digital garden is ready for its first link.</p>
      <button type="button" className="success-btn" onClick={onEnter}>Enter LinkTracker</button>
    </div>
  );
}

function PendingVerificationView({
  email,
  message,
  onResend,
  resending,
  resendSuccess,
  resendError,
}: {
  email: string;
  message: string;
  onResend: () => void;
  resending: boolean;
  resendSuccess: boolean;
  resendError: string | null;
}) {
  return (
    <div className="register-page">
      <main className="register-main">
        <EmailSentNotice
          email={email}
          message={message}
          onResend={onResend}
          resending={resending}
          resendSuccess={resendSuccess}
          resendError={resendError}
        />
        <p className="register-login-link" style={{ marginTop: '1.5rem' }}>
          Back to <Link to="/login" className="link-accent">Sign in</Link>
        </p>
      </main>
    </div>
  );
}

export function RegisterPage() {
  const reg = useRegister();
  const navigate = useNavigate();

  if (reg.isPendingVerification) {
    return (
      <PendingVerificationView
        email={reg.email}
        message={reg.verificationMessage}
        onResend={reg.handleResend}
        resending={reg.resending}
        resendSuccess={reg.resendSuccess}
        resendError={reg.resendError}
      />
    );
  }
  if (reg.isSuccess) {
    return <SuccessView onEnter={() => navigate('/')} />;
  }

  return (
    <div className="register-page">
      <div className="register-bg-orb orb-bottom-left" />
      <div className="register-bg-orb orb-top-right" />
      <main className="register-main">
        <RegisterBrand />
        <StepIndicator currentStep={reg.currentStep} totalSteps={reg.totalSteps} labels={STEP_LABELS} />
        <div className="register-card" key={reg.currentStep}>
          <RegisterForm
            currentStep={reg.currentStep}
            totalSteps={reg.totalSteps}
            formData={reg.formData}
            onNext={reg.handleNext}
            onBack={reg.handleBack}
            error={reg.error}
            fieldErrors={reg.fieldErrors}
            loading={reg.loading}
          />
        </div>
        <p className="register-login-link">Already have an account? <Link to="/login" className="link-accent">Sign in</Link></p>
      </main>
    </div>
  );
}
