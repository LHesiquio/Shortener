import { Icon } from '@/components/atoms/Icon/Icon';
import type { EmailSentNoticeProps } from './EmailSentNotice.types';
import './EmailSentNotice.css';

function NoticeHeader() {
  return (
    <>
      <div className="email-notice-icon-wrapper">
        <Icon name="mark_email_read" className="email-notice-icon" size={32} />
      </div>
      <h2 className="email-notice-title">Check Your Inbox</h2>
    </>
  );
}

function NoticeBody({ email, message }: { email?: string; message?: string }) {
  return (
    <p className="email-notice-body">
      {message ?? 'We have sent a verification link to your email address:'}
      {email ? (
        <>
          <br />
          <span className="email-highlight">{email}</span>
        </>
      ) : null}
    </p>
  );
}

function NoticeStatus({ success, error }: { success?: boolean; error?: string | null }) {
  if (success) {
    return <p className="notice-status-msg success">A new link has been sent to your email!</p>;
  }
  if (error) {
    return <p className="notice-status-msg error">{error}</p>;
  }
  return null;
}

export function EmailSentNotice({
  email,
  message,
  onResend,
  resending,
  resendSuccess,
  resendError,
}: EmailSentNoticeProps) {
  return (
    <div className="email-notice-card">
      <NoticeHeader />
      <NoticeBody email={email} message={message} />
      <div className="email-notice-actions">
        {onResend && (
          <button type="button" className="resend-button" onClick={onResend} disabled={resending}>
            {resending ? 'Resending Link…' : 'Resend Verification Email'}
            <Icon name="send" />
          </button>
        )}
        <NoticeStatus success={resendSuccess} error={resendError} />
      </div>
    </div>
  );
}
