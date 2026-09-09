import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@config/env';
import { VerificationEmailContent } from '@appTypes/email';
import { ObjectId } from 'mongodb';

/**
 * Email delivery abstraction.
 *
 * Two transports are wired today:
 *  - 'console' (default in dev): logs the email to stdout. Great for
 *    local development and for the smoke tests — no SMTP required.
 *  - 'smtp' (prod/mailtrap): sends real emails using nodemailer.
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

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 2525,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
}

const smtpTransport: EmailService = {
  async sendVerificationEmail(to, token) {
    const link = buildVerificationLink(token);
    const body = renderVerificationEmail(to, link);
    const transporter = getTransporter();
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });
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
