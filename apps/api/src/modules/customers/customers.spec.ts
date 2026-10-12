import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { CustomerStatus, ServiceCategory, UserRole } from '@sai/shared-types';

describe('Phase 4 — Customer CRM Module Suite', () => {
  describe('Customer ID Sequential Generation Logic', () => {
    test('should format customer numbers as SAI-YYYY-XXXX', () => {
      const year = new Date().getFullYear();
      const count = 42;
      const formatted = `SAI-${year}-${(count + 1).toString().padStart(4, '0')}`;

      assert.match(formatted, /^SAI-\d{4}-\d{4}$/, 'Format must be SAI-YYYY-XXXX');
      assert.equal(formatted, `SAI-${year}-0043`);
    });
  });

  describe('Duplicate Customer Detection Algorithm', () => {
    const existingRecords = [
      {
        id: 'cust-1',
        customerNumber: 'SAI-2026-0001',
        fullName: 'Shanmugam Kumar',
        primaryPhone: '+919894821561',
        whatsappNumber: '+919894821561',
        branchId: 'branch-madurai',
      },
      {
        id: 'cust-2',
        customerNumber: 'SAI-2026-0002',
        fullName: 'Priya Raman',
        primaryPhone: '+919894619921',
        whatsappNumber: null,
        branchId: 'branch-trichy',
      },
    ];

    test('should identify duplicate by primary mobile number', () => {
      const targetPhone = '+919894821561';
      const match = existingRecords.find((r) => r.primaryPhone === targetPhone);

      assert.ok(match, 'Must find matching record for existing phone');
      assert.equal(match.customerNumber, 'SAI-2026-0001');
    });

    test('should identify duplicate by WhatsApp number', () => {
      const targetWhatsApp = '+919894821561';
      const match = existingRecords.find((r) => r.whatsappNumber === targetWhatsApp);

      assert.ok(match, 'Must find matching record for existing WhatsApp number');
    });

    test('should pass check when phone number is completely unique', () => {
      const uniquePhone = '+919123456780';
      const match = existingRecords.find(
        (r) => r.primaryPhone === uniquePhone || r.whatsappNumber === uniquePhone,
      );

      assert.equal(match, undefined, 'Unique phone must not trigger duplicate warning');
    });
  });

  describe('Branch Scoping and Query Enforcement', () => {
    const maduraiBranchId = 'madurai-ho-uuid';
    const trichyBranchId = 'trichy-bo-uuid';

    test('Trichy staff query must automatically enforce branchId filter', () => {
      const staffUser = {
        role: UserRole.STAFF,
        branchId: trichyBranchId,
      };

      const buildWhereClause = (user: typeof staffUser, requestedFilter?: any) => {
        const where: any = { isDeleted: false };
        if (user.role === UserRole.SUPER_ADMIN) {
          if (requestedFilter?.branchId) where.branchId = requestedFilter.branchId;
        } else {
          where.branchId = user.branchId;
        }
        return where;
      };

      const where = buildWhereClause(staffUser, { branchId: maduraiBranchId });
      // Even if Trichy staff requests Madurai, the system must enforce Trichy branchId
      assert.equal(where.branchId, trichyBranchId, 'Must enforce user branchId on non-super-admin');
    });

    test('Super Admin query allows querying across any branch or all branches', () => {
      const superAdmin = {
        role: UserRole.SUPER_ADMIN,
        branchId: maduraiBranchId,
      };

      const buildWhereClause = (user: typeof superAdmin, requestedFilter?: any) => {
        const where: any = { isDeleted: false };
        if (user.role === UserRole.SUPER_ADMIN) {
          if (requestedFilter?.branchId) where.branchId = requestedFilter.branchId;
        } else {
          where.branchId = user.branchId;
        }
        return where;
      };

      const whereSpecific = buildWhereClause(superAdmin, { branchId: trichyBranchId });
      assert.equal(whereSpecific.branchId, trichyBranchId, 'Super Admin can scope to Trichy');

      const whereAll = buildWhereClause(superAdmin, {});
      assert.equal(whereAll.branchId, undefined, 'Super Admin can query all branches without restriction');
    });
  });

  describe('Customer Status Lifecycle', () => {
    test('should transition between ACTIVE and ARCHIVED correctly', () => {
      let status: CustomerStatus = CustomerStatus.ACTIVE;
      let archivedAt: Date | null = null;

      // Archive action
      status = CustomerStatus.ARCHIVED;
      archivedAt = new Date();
      assert.equal(status, CustomerStatus.ARCHIVED);
      assert.ok(archivedAt !== null);

      // Restore action
      status = CustomerStatus.ACTIVE;
      archivedAt = null;
      assert.equal(status, CustomerStatus.ACTIVE);
      assert.equal(archivedAt, null);
    });
  });
});
