import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class TotpService {
  private readonly stepSeconds = 30;
  private readonly digits = 6;

  /**
   * Generates a random RFC 3548 Base32 secret for TOTP.
   */
  generateSecret(length = 20): string {
    const buffer = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
      result += BASE32_ALPHABET[buffer[i] % 32];
    }
    return result;
  }

  /**
   * Generates an otpauth:// URL suitable for Google Authenticator / Microsoft Authenticator.
   */
  generateKeyUri(email: string, secret: string, issuer = 'SAI Tours & Travels'): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.digits}&period=${this.stepSeconds}`;
  }

  /**
   * Generates current 6-digit TOTP code for a secret at a specific Unix timestamp.
   */
  generateToken(secret: string, timestampMs = Date.now()): string {
    const counter = Math.floor(timestampMs / 1000 / this.stepSeconds);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter), 0);

    const secretBuffer = this.base32ToBuffer(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = (code % Math.pow(10, this.digits)).toString();
    return otp.padStart(this.digits, '0');
  }

  /**
   * Verifies a 6-digit code with window tolerance (window: 1 = ±30s).
   */
  verifyToken(secret: string, token: string, window = 1): boolean {
    if (!token || token.length !== this.digits) return false;
    const currentCounter = Math.floor(Date.now() / 1000 / this.stepSeconds);

    for (let i = -window; i <= window; i++) {
      const checkTimestamp = (currentCounter + i) * this.stepSeconds * 1000;
      const expectedToken = this.generateToken(secret, checkTimestamp);
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return true;
      }
    }

    return false;
  }

  private base32ToBuffer(base32: string): Buffer {
    const clean = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < clean.length; i++) {
      const val = BASE32_ALPHABET.indexOf(clean[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }
}
