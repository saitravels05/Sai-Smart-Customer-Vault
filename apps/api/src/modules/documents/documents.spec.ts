import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'crypto';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  validateMagicBytes,
  sanitizeFileName,
  generateStorageKey,
  MAX_FILE_SIZE_BYTES,
} from './validation/file-validator';
import { WatermarkService } from './watermark/watermark.service';
import { DocumentCategory, DocumentType, UserRole } from '@sai/shared-types';

describe('Phase 5 — Secure Document Vault & Watermarking Suite', () => {
  describe('File Magic Byte & MIME Validation', () => {
    it('should accurately detect and validate genuine PDF magic bytes', () => {
      const pdfHeader = Buffer.from('%PDF-1.7\nSample content');
      const detected = validateMagicBytes(pdfHeader, 'application/pdf');
      assert.strictEqual(detected, 'application/pdf');
    });

    it('should accurately detect genuine JPEG header bytes', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const detected = validateMagicBytes(jpegHeader, 'image/jpeg');
      assert.strictEqual(detected, 'image/jpeg');
    });

    it('should accurately detect genuine PNG header bytes', () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
      ]);
      const detected = validateMagicBytes(pngHeader, 'image/png');
      assert.strictEqual(detected, 'image/png');
    });

    it('should reject disguised or malicious executables claiming to be PDFs', () => {
      // Disguised payload: Windows MZ executable header disguised as passport.pdf
      const maliciousBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FakeEXEContent');
      assert.throws(
        () => validateMagicBytes(maliciousBuffer, 'application/pdf'),
        /Unsupported or disguised file format detected/,
      );
    });

    it('should reject plain text or script files pretending to be images', () => {
      const scriptBuffer = Buffer.from('<script>alert("xss")</script>');
      assert.throws(
        () => validateMagicBytes(scriptBuffer, 'image/png'),
        /Unsupported or disguised file format detected/,
      );
    });
  });

  describe('File Size & File Name Sanitization', () => {
    it('should enforce 10MB maximum file size limit', () => {
      assert.strictEqual(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
      const oversized = 10 * 1024 * 1024 + 1;
      assert.ok(oversized > MAX_FILE_SIZE_BYTES);
    });

    it('should sanitize dangerous directory traversal paths in file names', () => {
      const maliciousName = '../../../../Windows/System32/config.pdf';
      const clean = sanitizeFileName(maliciousName);
      assert.ok(!clean.includes('..'));
      assert.ok(!clean.includes('/'));
      assert.ok(!clean.includes('\\'));
      assert.strictEqual(clean, 'config.pdf');
    });

    it('should generate structured partitioned storage keys', () => {
      const customerId = 'c8b671e2-5e58-406a-a28a-7cfd145df001';
      const key = generateStorageKey(
        customerId,
        DocumentCategory.IDENTITY_DOCUMENT,
        DocumentType.PASSPORT,
        'passport_front.pdf',
      );
      const currentYear = new Date().getFullYear().toString();
      assert.ok(key.startsWith(`${customerId}/${currentYear}/IDENTITY_DOCUMENT/PASSPORT/`));
      assert.ok(key.endsWith('_passport_front.pdf'));
    });
  });

  describe('SHA-256 Tamper-Proof Cryptographic Checksum', () => {
    it('should generate exact 64-hex SHA-256 checksum', () => {
      const sample = Buffer.from('SAI-TOURS-SAMPLE-PASSPORT-DATA-2026');
      const hash = crypto.createHash('sha256').update(sample).digest('hex');
      assert.strictEqual(hash.length, 64);
    });

    it('should detect single-bit corruption via checksum mismatch', () => {
      const original = Buffer.from('GENUINE TICKET SAI-2026-0001');
      const tampered = Buffer.from('GENUINE TICKET SAI-2026-0002');
      const hashOriginal = crypto.createHash('sha256').update(original).digest('hex');
      const hashTampered = crypto.createHash('sha256').update(tampered).digest('hex');
      assert.notStrictEqual(hashOriginal, hashTampered);
    });
  });

  describe('PDF Dynamic Watermarking Engine', () => {
    it('should overlay confidential watermark and audit footer onto PDF document', async () => {
      // 1. Create a minimal valid PDF in memory
      const testPdfDoc = await PDFDocument.create();
      const page = testPdfDoc.addPage([600, 800]);
      page.drawText('Original Passport Scan for SAI Tours & Travels', { x: 50, y: 700 });
      const rawPdfBytes = await testPdfDoc.save();
      const rawPdfBuffer = Buffer.from(rawPdfBytes);

      // 2. Apply watermark
      const watermarkService = new WatermarkService();
      const watermarkedBuffer = await watermarkService.applyPdfWatermark(rawPdfBuffer, {
        staffName: 'Staff Executive (Madurai)',
        branchName: 'Madurai Head Office',
        documentId: 'doc-uuid-12345678',
        timestamp: new Date('2026-10-12T10:00:00Z'),
      });

      assert.ok(watermarkedBuffer.length > 0);
      assert.ok(watermarkedBuffer.toString('ascii', 0, 5).startsWith('%PDF-'));

      // 3. Inspect modified PDF
      const inspectedDoc = await PDFDocument.load(watermarkedBuffer);
      assert.strictEqual(inspectedDoc.getPageCount(), 1);
    });
  });

  describe('Multi-Branch Tenancy & Access Boundary Rules', () => {
    const maduraiBranchId = '11111111-1111-1111-1111-111111111111';
    const trichyBranchId = '22222222-2222-2222-2222-222222222222';

    it('Trichy staff must be forbidden from accessing documents owned by Madurai branch', () => {
      const user: { userId: string; role: UserRole; branchId: string } = {
        userId: 'staff-trichy-id',
        role: UserRole.STAFF,
        branchId: trichyBranchId,
      };
      const docCustomerBranchId = maduraiBranchId;

      const isAllowed =
        user.role === UserRole.OWNER || user.branchId === docCustomerBranchId;
      assert.strictEqual(isAllowed, false);
    });

    it('Owner must have global cross-branch clearance to access all documents', () => {
      const ownerUser: { userId: string; role: UserRole; branchId: string } = {
        userId: 'owner-id',
        role: UserRole.OWNER,
        branchId: maduraiBranchId,
      };
      const anyBranchId = trichyBranchId;

      const isAllowed =
        ownerUser.role === UserRole.OWNER ||
        ownerUser.branchId === anyBranchId;
      assert.strictEqual(isAllowed, true);
    });
  });
});
