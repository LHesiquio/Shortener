import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@config/env';
import { VerificationEmailContent, PasswordResetEmailContent } from '@appTypes/email';
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
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
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

  async sendPasswordResetEmail(to, token) {
    const link = buildPasswordResetLink(token);
    const body = renderPasswordResetEmail(to, link);
    // eslint-disable-next-line no-console
    console.log('\n🔑 [EmailService/console] password reset email:');
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

  async sendPasswordResetEmail(to, token) {
    const link = buildPasswordResetLink(token);
    const body = renderPasswordResetEmail(to, link);
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

function buildPasswordResetLink(token: string): string {
  const base = env.FRONTEND_BASE_URL.replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

function renderPasswordResetEmail(to: string, link: string): PasswordResetEmailContent {
  return {
    to,
    subject: 'Reset your Shortlinks password',
    text: `You requested to reset your password. Open this link to set a new password:\n\n${link}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
    html: `<p>Hello,</p>
<p>You recently requested to reset your password for your <b>Shortlinks</b> account.</p>
<p>Click the link below to set a new password:</p>
<p><a href="${link}">Reset Password</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>${link}</p>
<p>This link expires in 1 hour. If you did not request this password reset, please ignore this email.</p>`,
  };
}

/**
 * Singleton picked at boot based on `MAIL_TRANSPORT`. Exposed as a
 * plain object so callers do `EmailService.sendVerificationEmail(...)`.
 */
export const EmailService: EmailService =
  env.MAIL_TRANSPORT === 'smtp' ? smtpTransport : consoleTransport;

// Re-exported for tests that want to assert the link.
export const __testing = { buildVerificationLink, buildPasswordResetLink };

// Helps the linter ignore the unused import warning when we re-export
// ObjectId (it is exposed for future email templates that may need it).
void ObjectId;
