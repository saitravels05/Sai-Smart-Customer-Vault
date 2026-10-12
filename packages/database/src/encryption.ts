import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte key from the configured encryption key.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.FIELD_ENCRYPTION_KEY || 'default_dev_encryption_key_32bytes_!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive PII (e.g. passport number, PAN card, national ID) using AES-256-GCM.
 * Output format: [16 bytes IV][16 bytes AuthTag][Ciphertext] in hex format.
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText;
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('hex');
}

/**
 * Decrypts AES-256-GCM encrypted field.
 */
export function decryptField(cipherHex: string): string {
  if (!cipherHex) return cipherHex;
  try {
    const key = getDerivedKey();
    const data = Buffer.from(cipherHex, 'hex');

    if (data.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid cipher payload length');
    }

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encryptedText = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encryptedText) + decipher.final('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt field: invalid key or corrupted payload');
  }
}

/**
 * Computes deterministic SHA-256 hash for secure fast exact-match lookups
 * without exposing plaintext PII.
 */
export function hashField(plainText: string): string {
  if (!plainText) return '';
  return crypto.createHash('sha256').update(plainText.trim().toUpperCase()).digest('hex');
}

/**
 * Masks a document number for display to unauthorized or standard viewers.
 * Example: "V1234567" -> "V12***67"
 * Example Aadhaar: "123456789012" -> "XXXX-XXXX-9012"
 */
export function maskIdentifier(identifier: string, type: 'PASSPORT' | 'AADHAAR' | 'GENERIC' = 'GENERIC'): string {
  if (!identifier) return '';
  const clean = identifier.trim();

  if (type === 'AADHAAR') {
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }

  if (clean.length <= 4) {
    return '***' + clean.slice(-1);
  }

  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-2);
  return `${prefix}***${suffix}`;
}

export const hashSearchField = hashField;
export function maskPassportNumber(passportNumber: string): string {
  return maskIdentifier(passportNumber, 'PASSPORT');
}

