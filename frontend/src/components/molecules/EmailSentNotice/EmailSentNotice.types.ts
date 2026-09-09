export interface EmailSentNoticeProps {
  email: string;
  message?: string;
  onResend?: () => void;
  resending?: boolean;
  resendSuccess?: boolean;
  resendError?: string | null;
}
