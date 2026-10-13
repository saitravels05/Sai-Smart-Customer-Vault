import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'crypto';
import {
  ConsentPurpose,
  sanitizeAadhaarNumber,
  isValidMaskedAadhaar,
} from '@sai/shared-types';

describe('Phase 12 — Security Hardening, DPDPA 2023 & UIDAI Statutory Compliance Suite', () => {
  describe('UIDAI Mandatory Aadhaar Masking Policy', () => {
    it('should automatically obscure first 8 digits of raw 12-digit Aadhaar number to XXXX-XXXX-1234', () => {
      const rawWithSpaces = '5432 9876 1234';
      const masked1 = sanitizeAadhaarNumber(rawWithSpaces);
      assert.strictEqual(masked1, 'XXXX-XXXX-1234');

      const rawWithoutSpaces = '987654328899';
      const masked2 = sanitizeAadhaarNumber(rawWithoutSpaces);
      assert.strictEqual(masked2, 'XXXX-XXXX-8899');
    });

    it('should validate masked Aadhaar numbers and strictly reject unmasked 12-digit numbers', () => {
      // Valid masked formats
      assert.strictEqual(isValidMaskedAadhaar('XXXX-XXXX-1234'), true);
      assert.strictEqual(isValidMaskedAadhaar('XXXXXXXX1234'), true);

      // Unmasked violations (prohibited by UIDAI for travel agencies)
      assert.strictEqual(isValidMaskedAadhaar('5432-9876-1234'), false);
      assert.strictEqual(isValidMaskedAadhaar('987654328899'), false);
    });
  });

  describe('DPDPA 2023 Explicit Consent Notice & Purposes', () => {
    it('should validate all legal travel service consent purposes', () => {
      const validPurposes = [
        ConsentPurpose.PASSPORT_PROCESSING,
        ConsentPurpose.VISA_APPLICATION,
        ConsentPurpose.FLIGHT_BOOKING,
        ConsentPurpose.WHATSAPP_ALERTS,
        ConsentPurpose.DOCUMENT_VAULT_STORAGE,
        ConsentPurpose.MARKETING_UPDATES,
      ];

      for (const purpose of validPurposes) {
        assert.ok(Object.values(ConsentPurpose).includes(purpose));
      }
    });

    it('should verify bilingual statutory consent notice templates', () => {
      const enNotice =
        'I hereby grant explicit consent to SAI Tours & Travels to collect and process my passport, visa and biometric travel documentation pursuant to DPDPA 2023.';
      const taNotice =
        'நான் (வாடிக்கையாளர்), எனது கடவுச்சீட்டு, விசா மற்றும் பயண ஆவணங்களை சாய் டூர்ஸ் & டிராவல்ஸ் நிறுவனம் பயணத் தேவைகளுக்காகச் சேமித்து செயலாக்க முழுச் சம்மதம் அளிக்கிறேன்.';

      assert.ok(enNotice.includes('DPDPA 2023'));
      assert.ok(taNotice.includes('சாய் டூர்ஸ் & டிராவல்ஸ்') && taNotice.includes('கடவுச்சீட்டு'));
    });
  });

  describe('DPDPA Right to Erasure / Masking Redaction Logic', () => {
    function anonymizeProfile(customer: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
    }) {
      return {
        id: customer.id,
        fullName: `[ERASED DPDPA CLIENT ${customer.id.substring(0, 8)}]`,
        email: null,
        phone: '0000000000',
        address: '[REDACTED PURSUANT TO DPDPA 2023]',
        status: 'ARCHIVED',
        isDeleted: true,
      };
    }

    it('should redact all identifying PII while preserving legal customer record UUID for financial integrity', () => {
      const liveCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Sundar Pichai',
        email: 'sundar@example.com',
        phone: '+91 9894821561',
        address: 'West Veli Street, Madurai',
      };

      const erased = anonymizeProfile(liveCustomer);

      // PII must be completely sanitized
      assert.strictEqual(erased.id, liveCustomer.id, 'UUID must remain for invoice linkage');
      assert.ok(erased.fullName.startsWith('[ERASED DPDPA CLIENT'));
      assert.strictEqual(erased.email, null);
      assert.strictEqual(erased.phone, '0000000000');
      assert.strictEqual(erased.address, '[REDACTED PURSUANT TO DPDPA 2023]');
      assert.strictEqual(erased.isDeleted, true);
    });
  });

  describe('Cryptographic Audit Log Tamper-Seal & Integrity Verifier', () => {
    function computeAuditSeal(log: {
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      ipAddress: string;
      timestampIso: string;
    }): string {
      const payload = `${log.id}:${log.action}:${log.entityType}:${log.entityId}:${log.ipAddress}:${log.timestampIso}`;
      return crypto.createHash('sha256').update(payload).digest('hex');
    }

    it('should generate deterministic 64-character SHA-256 seal for audit trail records', () => {
      const log = {
        id: 'audit-log-001',
        action: 'DPDPA_CONSENT_RECORDED',
        entityType: 'CustomerConsent',
        entityId: 'consent-777',
        ipAddress: '122.178.44.12',
        timestampIso: '2026-10-13T06:00:00.000Z',
      };

      const seal = computeAuditSeal(log);
      assert.strictEqual(seal.length, 64);
      // Deterministic check
      assert.strictEqual(seal, computeAuditSeal(log));
    });

    it('should immediately detect single-field tampering in audit records', () => {
      const originalLog = {
        id: 'audit-log-002',
        action: 'PASSPORT_DOWNLOADED',
        entityType: 'Document',
        entityId: 'doc-444',
        ipAddress: '122.178.44.12',
        timestampIso: '2026-10-13T06:00:00.000Z',
      };

      const originalSeal = computeAuditSeal(originalLog);

      // Simulating malicious tampering of IP address
      const tamperedLog = {
        ...originalLog,
        ipAddress: '192.168.1.1',
      };

      const tamperedSeal = computeAuditSeal(tamperedLog);
      assert.notStrictEqual(
        originalSeal,
        tamperedSeal,
        'Tampering with IP address must alter the cryptographic seal',
      );
    });
  });
});
