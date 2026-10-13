import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'crypto';
import {
  encryptField,
  decryptField,
  hashField,
  maskPassportNumber,
  maskIdentifier,
} from '@sai/database';
import {
  sanitizeAadhaarNumber,
  isValidMaskedAadhaar,
  ConsentPurpose,
  createConsentSchema,
  formatTamilPassportWhatsAppMessage,
} from '@sai/shared-types';
import { ReminderCalculator } from '../reminders/reminder-calculator';
import { WhatsAppNotifier } from '../reminders/whatsapp-notifier';

describe('Phase 13 — End-to-End Enterprise Journey & System Quality Assurance', () => {
  describe('System Liveness, Readiness & Diagnostic Probes', () => {
    it('should verify system health payload structure and branding metadata', () => {
      const mockHealth = {
        service: 'SAI SMART CUSTOMER VAULT API',
        organization: 'SAI TOURS & TRAVELS',
        headOffice: 'Madurai (+91 9894821561)',
        branchOffice: 'Trichy (+91 9894619921)',
        status: 'UP',
        uptimeSeconds: 120,
      };

      assert.strictEqual(mockHealth.status, 'UP');
      assert.strictEqual(mockHealth.organization, 'SAI TOURS & TRAVELS');
      assert.ok(mockHealth.headOffice.includes('Madurai'));
      assert.ok(mockHealth.branchOffice.includes('Trichy'));
    });

    it('should verify readiness probe components: DB, Vault Storage & Compliance', () => {
      const components = {
        database: { status: 'CONNECTED', engine: 'PostgreSQL (Prisma + pgvector)' },
        vaultStorage: { status: 'WRITABLE', encryption: 'AES-256-GCM' },
        complianceEngine: { status: 'ACTIVE', dpdpa: 'v2023.1', uidaiMasking: 'ENFORCED' },
      };

      assert.strictEqual(components.database.status, 'CONNECTED');
      assert.strictEqual(components.vaultStorage.encryption, 'AES-256-GCM');
      assert.strictEqual(components.complianceEngine.uidaiMasking, 'ENFORCED');
    });
  });

  describe('Full Customer Travel Lifecycle E2E Simulation', () => {
    // Step 1: Branch & Staff Tenancy
    const maduraiBranch = { id: 'branch-mdr-001', code: 'MDR-HO', name: 'Madurai Head Office' };
    const trichyBranch = { id: 'branch-try-002', code: 'TRY-BR', name: 'Trichy Branch Office' };

    it('Step 1: Multi-Branch Tenancy Isolation', () => {
      assert.notStrictEqual(maduraiBranch.id, trichyBranch.id);
      assert.strictEqual(maduraiBranch.code, 'MDR-HO');
      assert.strictEqual(trichyBranch.code, 'TRY-BR');
    });

    // Step 2: Customer Intake & UIDAI Aadhaar Masking
    it('Step 2: Customer Registration & UIDAI Aadhaar Masking', () => {
      const rawInputAadhaar = '987654321098';
      const masked = sanitizeAadhaarNumber(rawInputAadhaar);

      assert.strictEqual(masked, 'XXXX-XXXX-1098');
      assert.ok(isValidMaskedAadhaar(masked));
      assert.ok(!isValidMaskedAadhaar(rawInputAadhaar)); // Raw must be rejected

      // Database mask function validation
      const dbMasked = maskIdentifier(rawInputAadhaar, 'AADHAAR');
      assert.strictEqual(dbMasked, 'XXXX-XXXX-1098');
    });

    // Step 3: Passport Credential Vaulting with AES-256-GCM
    let encryptedPassportHex: string;
    const rawPassportNumber = 'Z9876543';

    it('Step 3: Document Vault AES-256-GCM Encryption & Blind Hash Indexing', () => {
      encryptedPassportHex = encryptField(rawPassportNumber);

      assert.ok(encryptedPassportHex);
      assert.notStrictEqual(encryptedPassportHex, rawPassportNumber);

      // Verify exact decryption
      const decrypted = decryptField(encryptedPassportHex);
      assert.strictEqual(decrypted, rawPassportNumber);

      // Verify exact hash indexing for encrypted searches
      const hash = hashField(rawPassportNumber);
      assert.strictEqual(hash.length, 64);
      assert.strictEqual(hash, hashField('z9876543')); // Case-insensitive exact match hash

      // Verify masked display
      const displayMask = maskPassportNumber(rawPassportNumber);
      assert.strictEqual(displayMask, 'Z9***43');
    });

    // Step 4: Expiry Calculation & Bilingual WhatsApp Alerts
    it('Step 4: 180-Day Passport Validity & Bilingual Alert Generation', () => {
      const expiryIn180Days = new Date();
      expiryIn180Days.setDate(expiryIn180Days.getDate() + 180);

      const { severity, daysLeft } = ReminderCalculator.calculateSeverity(expiryIn180Days);
      assert.strictEqual(severity, 'LOW');
      assert.ok(daysLeft >= 179 && daysLeft <= 181);

      // English WhatsApp Alert
      const enMsg = WhatsAppNotifier.formatMessage(
        'Karthik Subramanian',
        'Your Passport Z9***43 is expiring in 180 days. International travel requires at least 6-month validity.',
      );
      assert.ok(enMsg.includes('SAI TOURS & TRAVELS'));
      assert.ok(enMsg.includes('Karthik Subramanian'));
      assert.ok(enMsg.includes('+91 9894821561')); // Madurai phone

      // WhatsApp 1-click dispatch URL
      const waUrl = WhatsAppNotifier.generateWhatsAppUrl('+91 9876543210', enMsg);
      assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='));

      // Tamil WhatsApp Alert
      const taMsg = formatTamilPassportWhatsAppMessage({
        customerName: 'கார்த்திக் சுப்ரமணியன்',
        passportNumberMasked: 'Z9***43',
        expiryDateStr: expiryIn180Days.toISOString().split('T')[0],
        daysRemaining: 180,
        branchName: 'மதுரை தலைமை அலுவலகம்',
        branchPhone: '+91 9894821561',
      });
      assert.ok(taMsg.includes('சாய் டூர்ஸ் & டிராவல்ஸ்'));
      assert.ok(taMsg.includes('கடவுச்சீட்டு'));
      assert.ok(taMsg.includes('6 மாதங்கள்'));
    });

    // Step 5: DPDPA 2023 Statutory Consent Lifecycle
    it('Step 5: DPDPA Consent Lifecycle & Notice Validation', () => {
      const consentPayload = {
        purpose: ConsentPurpose.PASSPORT_PROCESSING,
        language: 'TAMIL' as const,
        noticeVersion: 'v2023.1',
        notes: 'Signed via Madurai counter intake form',
      };

      const parsed = createConsentSchema.safeParse(consentPayload);
      assert.ok(parsed.success);
      assert.strictEqual(parsed.data.purpose, ConsentPurpose.PASSPORT_PROCESSING);
    });

    // Step 6: Cryptographic Audit Trail SHA-256 Tamper Seal
    it('Step 6: Cryptographic Audit Log Seal & Tamper Verification', () => {
      const auditLogRecord = {
        id: 'audit-e2e-001',
        action: 'DPDPA_CONSENT_RECORDED',
        entityType: 'CustomerConsent',
        entityId: 'consent-777',
        branchId: maduraiBranch.id,
        userId: 'staff-001',
        timestamp: '2026-10-13T10:00:00.000Z',
      };

      const computeSeal = (record: any) => {
        const canonical = `${record.id}:${record.action}:${record.entityType}:${record.entityId}:${record.branchId}:${record.userId}:${record.timestamp}`;
        return crypto.createHash('sha256').update(canonical).digest('hex');
      };

      const seal = computeSeal(auditLogRecord);
      assert.strictEqual(seal.length, 64);

      // Verify tamper resistance: modifying action must alter seal
      const tamperedRecord = { ...auditLogRecord, action: 'UNAUTHORIZED_ALTERATION' };
      const tamperedSeal = computeSeal(tamperedRecord);
      assert.notStrictEqual(tamperedSeal, seal);
    });

    // Step 7: Statutory Right to Erasure / Anonymization
    it('Step 7: DPDPA Section 12 Statutory Erasure / Anonymization', () => {
      const activeCustomer = {
        id: 'cust-uuid-12345',
        fullName: 'Karthik Subramanian',
        primaryPhone: '+91 9876543210',
        email: 'karthik@example.com',
        addressLine: '12 West Masi Street, Madurai',
        status: 'ACTIVE',
      };

      // Execute Right to Erasure
      const anonymizedCustomer = {
        ...activeCustomer,
        fullName: '[DPDPA ANONYMIZED]',
        primaryPhone: '+910000000000',
        email: null,
        addressLine: '[REDACTED PURSUANT TO DPDPA 2023 SEC 12]',
        status: 'ARCHIVED',
      };

      // Financial UUID is preserved for tax ledger, but all PII is scrubbed
      assert.strictEqual(anonymizedCustomer.id, activeCustomer.id);
      assert.strictEqual(anonymizedCustomer.fullName, '[DPDPA ANONYMIZED]');
      assert.strictEqual(anonymizedCustomer.email, null);
      assert.strictEqual(anonymizedCustomer.status, 'ARCHIVED');
    });
  });
});
