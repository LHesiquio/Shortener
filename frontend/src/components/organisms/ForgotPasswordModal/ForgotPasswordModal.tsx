import React from 'react';
import { Modal } from '@/components/atoms/Modal/Modal';
import { Icon } from '@/components/atoms/Icon/Icon';
import { FormField } from '@/components/molecules/FormField/FormField';
import { useForgotPasswordModal } from './useForgotPasswordModal';
import type { ForgotPasswordModalProps } from './ForgotPasswordModal.types';
import './ForgotPasswordModal.css';

function ModalHeader({ isSent }: { isSent: boolean }) {
  return (
    <>
      <div className={`forgot-modal-icon ${isSent ? 'success' : ''}`}>
        <Icon name={isSent ? 'mark_email_read' : 'lock_reset'} size={28} />
      </div>
      <h2 className="forgot-modal-title">
        {isSent ? 'Check Your Inbox' : 'Forgot Password'}
      </h2>
      <p className="forgot-modal-subtitle">
        {isSent
          ? 'If an account is associated with this email, we have dispatched a password reset link.'
          : "Enter your account's email address and we will send you a link to reset your password."}
      </p>
    </>
  );
}

function SuccessContent({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <div className="forgot-modal-success-box">
        Please check your email and click on the password reset link. The link is valid for 1 hour.
      </div>
      <div className="forgot-modal-actions">
        <button
          type="button"
          className="forgot-modal-btn forgot-modal-btn-primary"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function FormContent({
  email,
  setEmail,
  error,
  loading,
  onSubmit,
  onClose,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <form className="forgot-modal-form" onSubmit={onSubmit}>
      {error && <div className="forgot-modal-error">{error}</div>}

      <FormField
        label="Email Address"
        id="forgot-email"
        type="email"
        placeholder="hello@example.com"
        iconName="mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="forgot-modal-actions">
        <button
          type="button"
          className="forgot-modal-btn forgot-modal-btn-cancel"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="forgot-modal-btn forgot-modal-btn-primary"
          disabled={loading}
        >
          {loading ? 'Sending Link…' : 'Send Reset Link'}
          <Icon name="send" />
        </button>
      </div>
    </form>
  );
}

export function ForgotPasswordModal(props: ForgotPasswordModalProps) {
  const {
    email,
    setEmail,
    loading,
    error,
    isSent,
    handleSubmit,
    handleClose,
  } = useForgotPasswordModal(props.isOpen, props.initialEmail, props.onClose);

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} ariaLabel="Forgot password dialog">
      <ModalHeader isSent={isSent} />
      {isSent ? (
        <SuccessContent onClose={handleClose} />
      ) : (
        <FormContent
          email={email}
          setEmail={setEmail}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
}
