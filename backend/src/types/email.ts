/**
 * Shape of the JWT payload used for email verification links.
 *
 * `purpose` is included in every token we sign so we can reject tokens
 * minted for a different flow (access / refresh) before they ever reach
 * the verification handler.
 */
export interface VerificationTokenPayload {
  sub: string;
  purpose: 'email_verification';
}

export interface VerificationEmailContent {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface PasswordResetTokenPayload {
  sub: string;
  purpose: 'password_reset';
}

export interface PasswordResetEmailContent {
  to: string;
  subject: string;
  text: string;
  html: string;
}

