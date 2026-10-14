import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { encryptField, decryptField, hashField, maskIdentifier } from './encryption.js';
import { UserRole, Gender, ServiceCategory, DocumentType } from '@sai/shared-types';
import * as argon2 from 'argon2';

describe('Database Foundation & Field-Level Security Suite', () => {
  describe('AES-256-GCM Field Encryption', () => {
    test('should encrypt and decrypt passport numbers accurately', () => {
      const originalPassport = 'Z9876543';
      const encrypted = encryptField(originalPassport);

      assert.notEqual(encrypted, originalPassport, 'Encrypted value must not match plain text');
      assert.ok(encrypted.length > 64, 'Encrypted hex string must contain IV, tag, and ciphertext');

      const decrypted = decryptField(encrypted);
      assert.equal(decrypted, originalPassport, 'Decrypted value must match original plain text');
    });

    test('should fail decryption gracefully when ciphertext is corrupted', () => {
      const encrypted = encryptField('SECRET_ID_123');
      const corrupted = encrypted.slice(0, -4) + 'ffff';

      assert.throws(
        () => decryptField(corrupted),
        /Failed to decrypt field/,
        'Tampered cipher payload must fail authentication check',
      );
    });

    test('should generate consistent SHA-256 hash for fast exact-match lookup', () => {
      const passport1 = 'a1234567';
      const passport2 = '  A1234567  ';

      const hash1 = hashField(passport1);
      const hash2 = hashField(passport2);

      assert.equal(hash1, hash2, 'Hash must normalize whitespace and casing');
      assert.equal(hash1.length, 64, 'SHA-256 hex string must be 64 characters');
    });
  });

  describe('Statutory Privacy & Masking (DPDPA 2023 & UIDAI)', () => {
    test('should mask Aadhaar numbers to XXXX-XXXX-1234 format', () => {
      const rawAadhaar = '987654321234';
      const masked = maskIdentifier(rawAadhaar, 'AADHAAR');

      assert.equal(masked, 'XXXX-XXXX-1234', 'Aadhaar must mask the first 8 digits');
      assert.ok(!masked.includes('98765432'), 'Unmasked digits must not leak');
    });

    test('should mask Passport numbers to standard executive display', () => {
      const rawPassport = 'V1234567';
      const masked = maskIdentifier(rawPassport, 'PASSPORT');

      assert.equal(masked, 'V1***67', 'Passport must show only prefix and suffix');
    });
  });

  describe('Argon2id Password Security', () => {
    test('should hash passwords with Argon2id and verify correctly', async () => {
      const password = 'TestSecurePassword2026!';
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      assert.ok(hash.startsWith('$argon2id$'), 'Hash format must be argon2id');

      const isValid = await argon2.verify(hash, password);
      assert.ok(isValid, 'Argon2 verification must succeed with correct password');

      const isInvalid = await argon2.verify(hash, 'WrongPassword123');
      assert.ok(!isInvalid, 'Argon2 verification must fail with wrong password');
    });
  });

  describe('Domain Enums and Models Alignment', () => {
    test('should expose all required organizational and service categories', () => {
      assert.equal(UserRole.OWNER, 'OWNER');
      assert.equal(UserRole.ADMIN, 'ADMIN');
      assert.equal(UserRole.STAFF, 'STAFF');

      assert.ok(Object.values(ServiceCategory).includes(ServiceCategory.PASSPORT_SERVICES));
      assert.ok(Object.values(ServiceCategory).includes(ServiceCategory.TOURIST_VISA));
      assert.ok(Object.values(ServiceCategory).includes(ServiceCategory.FLIGHT_BOOKING));

      assert.ok(Object.values(DocumentType).includes(DocumentType.PASSPORT));
      assert.ok(Object.values(DocumentType).includes(DocumentType.AADHAAR_MASKED));
      assert.ok(Object.values(DocumentType).includes(DocumentType.FLIGHT_TICKET));
    });
  });
});
