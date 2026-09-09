import { env } from '@config/env';
import { VerificationEmailContent } from '@appTypes/email';
import { ObjectId } from 'mongodb';

/**
 * Email delivery abstraction.
 *
 * Two transports are wired today:
 *  - 'console' (default in dev): logs the email to stdout. Great for
 *    local development and for the smoke tests — no SMTP required.
 *  - 'smtp' (prod): a stub. When you wire Nodemailer/Resend/etc., the
 *    only change is inside the smtp transport below; the rest of the
 *    codebase keeps calling `EmailService.send()`.
 */
export interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
}

const consoleTransport: EmailService = {
  async sendVerificationEmail(to, token) {
    const link = buildVerificationLink(token);
    const body = renderVerificationEmail(to, link);
    // eslint-disable-next-line no-console
    console.log('\n📧 [EmailService/console] verification email:');
    // eslint-disable-next-line no-console
    console.log(`   to:      ${body.to}`);
    // eslint-disable-next-line no-console
    console.log(`   subject: ${body.subject}`);
    // eslint-disable-next-line no-console
    console.log(`   link:    ${link}\n`);
  },
};

const smtpTransport: EmailService = {
  async sendVerificationEmail(to, token) {
    // Stub: when you wire Nodemailer, replace this body with a real
    // transporter.sendMail call. The interface stays the same.
    const link = buildVerificationLink(token);
    const body = renderVerificationEmail(to, link);
    // eslint-disable-next-line no-console
    console.warn(
      `[EmailService/smtp] STUB — would send to ${body.to} with subject "${body.subject}". ` +
        `Configure SMTP_HOST/SMTP_USER/SMTP_PASS and replace this stub. Link: ${link}`
    );
  },
};

function buildVerificationLink(token: string): string {
  const base = env.FRONTEND_BASE_URL.replace(/\/$/, '');
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

function renderVerificationEmail(to: string, link: string): VerificationEmailContent {
  return {
    to,
    subject: 'Verify your Shortlinks account',
    text: `Welcome to Shortlinks! Open this link to verify your email:\n\n${link}\n\nThis link expires in ${env.EMAIL_VERIFICATION_TTL}.`,
    html: `<p>Welcome to <b>Shortlinks</b>!</p>
<p>Open this link to verify your email:</p>
<p><a href="${link}">${link}</a></p>
<p>This link expires in ${env.EMAIL_VERIFICATION_TTL}.</p>`,
  };
}

/**
 * Singleton picked at boot based on `MAIL_TRANSPORT`. Exposed as a
 * plain object so callers do `EmailService.sendVerificationEmail(...)`.
 */
export const EmailService: EmailService =
  env.MAIL_TRANSPORT === 'smtp' ? smtpTransport : consoleTransport;

// Re-exported for tests that want to assert the link.
export const __testing = { buildVerificationLink };

// Helps the linter ignore the unused import warning when we re-export
// ObjectId (it is exposed for future email templates that may need it).
void ObjectId;
