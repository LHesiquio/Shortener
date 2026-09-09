import { Link } from 'react-router-dom';
import { useVerifyEmail } from '@/hooks/useVerifyEmail';
import { Icon } from '@/components/atoms/Icon/Icon';
import './VerifyEmailPage.css';

function VerifyingState() {
  return (
    <>
      <div className="verify-icon-wrapper loading">
        <Icon name="sync" className="verify-icon spin" size={36} />
      </div>
      <h1 className="verify-title">Verifying Your Email</h1>
      <p className="verify-body">Please wait while we confirm your email address...</p>
    </>
  );
}

function SuccessState({ alreadyActive }: { alreadyActive: boolean }) {
  return (
    <>
      <div className="verify-icon-wrapper success">
        <Icon name="check_circle" className="verify-icon" size={36} />
      </div>
      <h1 className="verify-title">
        {alreadyActive ? 'Email Already Verified' : 'Account Activated!'}
      </h1>
      <p className="verify-body">
        {alreadyActive
          ? 'Your email address is already verified. You can sign in to your account.'
          : 'Your account has been successfully verified! You are ready to tend your garden.'}
      </p>
      <Link to="/login" className="verify-action-btn">
        Proceed to Sign In
        <Icon name="arrow_forward" />
      </Link>
    </>
  );
}

type ResendFormProps = Pick<
  ReturnType<typeof useVerifyEmail>,
  'resendEmail' | 'setResendEmail' | 'resending' | 'resendSuccess' | 'resendError' | 'handleResend'
>;

function ResendForm(props: ResendFormProps) {
  return (
    <form className="resend-form" onSubmit={props.handleResend}>
      <input
        type="email"
        className="resend-input"
        placeholder="Enter your email to resend"
        value={props.resendEmail}
        onChange={(e) => props.setResendEmail(e.target.value)}
        required
      />
      <button type="submit" className="verify-action-btn" disabled={props.resending}>
        {props.resending ? 'Sending...' : 'Resend Verification Email'}
      </button>

      {props.resendSuccess ? (
        <p className="notice-status-msg success" style={{ marginTop: '1rem' }}>
          Verification email sent successfully!
        </p>
      ) : null}

      {props.resendError ? (
        <p className="notice-status-msg error" style={{ marginTop: '1rem' }}>
          {props.resendError}
        </p>
      ) : null}
    </form>
  );
}

function ErrorState(props: ReturnType<typeof useVerifyEmail>) {
  return (
    <>
      <div className="verify-icon-wrapper error">
        <Icon name="error" className="verify-icon" size={36} />
      </div>
      <h1 className="verify-title">Verification Failed</h1>
      <p className="verify-body">{props.error}</p>
      <ResendForm {...props} />
      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/login" className="link-accent">
          Back to Login
        </Link>
      </div>
    </>
  );
}

export function VerifyEmailPage() {
  const state = useVerifyEmail();
  const isDone = state.success || state.alreadyActive;

  if (state.verifying) {
    return (
      <div className="verify-page">
        <div className="verify-card"><VerifyingState /></div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="verify-page">
        <div className="verify-card"><SuccessState alreadyActive={state.alreadyActive} /></div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <div className="verify-card"><ErrorState {...state} /></div>
    </div>
  );
}
