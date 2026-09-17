import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { env } from '@config/env';
import { ApiError } from '@utils/ApiError';

/**
 * Configure otplib with a 1-step time drift tolerance (30 seconds before/after).
 */
authenticator.options = { window: 1 };

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Derives a 32-byte key from the configured encryption key.
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(env.TWO_FACTOR_ENCRYPTION_KEY).digest();
}

/**
 * Formats a plain 8-character string into XXXX-XXXX format.
 */
function formatBackupCode(raw: string): string {
  const upper = raw.toUpperCase();
  return `${upper.slice(0, 4)}-${upper.slice(4, 8)}`;
}

export const TwoFactorService = {
  /**
   * Generates a new Base32 TOTP secret and its corresponding otpauth URI.
   */
  generateSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userEmail, env.TWO_FACTOR_APP_NAME, secret);
    return { secret, otpauthUrl };
  },

  /**
   * Generates a PNG Data URL for an otpauth URI.
   */
  async generateQrCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl, {
        margin: 2,
        width: 256,
        color: {
          dark: '#1B1C18',
          light: '#FFFFFF',
        },
      });
    } catch {
      throw new ApiError(500, 'Failed to generate 2FA QR code', 'INTERNAL_ERROR');
    }
  },

  /**
   * Encrypts a plain TOTP secret using AES-256-GCM.
   */
  encryptSecret(plainSecret: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  },

  /**
   * Decrypts an AES-256-GCM encrypted TOTP secret.
   */
  decryptSecret(cipherText: string): string {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new ApiError(500, 'Invalid encrypted 2FA secret format', 'INTERNAL_ERROR');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  },

  /**
   * Verifies a 6-digit TOTP code against a plain secret.
   */
  verifyTotp(plainSecret: string, code: string): boolean {
    const sanitized = code.replace(/\s+/g, '');
    return authenticator.check(sanitized, plainSecret);
  },

  /**
   * Hashes a backup code for secure storage (SHA-256).
   */
  hashBackupCode(code: string): string {
    const normalized = code.replace(/[-\s]/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  },

  /**
   * Generates a batch of unique random backup codes and their SHA-256 hashes.
   */
  generateBackupCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const raw = crypto.randomBytes(4).toString('hex');
      const formatted = formatBackupCode(raw);
      plainCodes.push(formatted);
      hashedCodes.push(TwoFactorService.hashBackupCode(formatted));
    }

    return { plainCodes, hashedCodes };
  },
};
