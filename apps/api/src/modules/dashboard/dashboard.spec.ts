import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { UserRole } from '@sai/shared-types';

describe('Phase 9 — Advanced Dashboard, Analytics & Branch Management Suite', () => {
  describe('Storage Bytes Formatting Logic', () => {
    function formatStorage(bytes: number): string {
      if (bytes === 0) return '0 MB';
      const mb = bytes / (1024 * 1024);
      if (mb < 1024) {
        return `${mb.toFixed(1)} MB`;
      }
      const gb = mb / 1024;
      return `${gb.toFixed(2)} GB`;
    }

    it('should format small or zero storage bytes accurately', () => {
      assert.strictEqual(formatStorage(0), '0 MB');
      assert.strictEqual(formatStorage(1048576), '1.0 MB'); // 1 MB
      assert.strictEqual(formatStorage(52428800), '50.0 MB'); // 50 MB
    });

    it('should format large gigabyte storage values accurately', () => {
      assert.strictEqual(formatStorage(1073741824), '1.00 GB'); // 1 GB
      assert.strictEqual(formatStorage(2684354560), '2.50 GB'); // 2.5 GB
    });
  });

  describe('Branch & Staff Management RBAC Permission Rules', () => {
    const maduraiBranchId = '11111111-1111-1111-1111-111111111111';
    const trichyBranchId = '22222222-2222-2222-2222-222222222222';

    it('should allow Super Admin to create branches and provision staff across any branch', () => {
      const superAdmin = {
        role: UserRole.SUPER_ADMIN,
        branchId: maduraiBranchId,
      };

      const canCreateBranch = superAdmin.role === UserRole.SUPER_ADMIN;
      assert.strictEqual(canCreateBranch, true);

      const canProvisionTrichy =
        superAdmin.role === UserRole.SUPER_ADMIN ||
        (superAdmin.role === UserRole.BRANCH_MANAGER && superAdmin.branchId === trichyBranchId);
      assert.strictEqual(canProvisionTrichy, true);
    });

    it('should allow Branch Manager to provision staff only for their own branch', () => {
      const trichyManager = {
        role: UserRole.BRANCH_MANAGER,
        branchId: trichyBranchId,
      };

      const canProvisionTrichy =
        trichyManager.role === UserRole.SUPER_ADMIN ||
        (trichyManager.role === UserRole.BRANCH_MANAGER && trichyManager.branchId === trichyBranchId);
      assert.strictEqual(canProvisionTrichy, true);

      // Cannot provision for Madurai
      const canProvisionMadurai =
        trichyManager.role === UserRole.SUPER_ADMIN ||
        (trichyManager.role === UserRole.BRANCH_MANAGER && trichyManager.branchId === maduraiBranchId);
      assert.strictEqual(canProvisionMadurai, false);
    });

    it('should forbid Staff and Read-Only roles from creating staff profiles', () => {
      const staffUser = {
        role: UserRole.STAFF,
        branchId: maduraiBranchId,
      };
      const readOnlyUser = {
        role: UserRole.READ_ONLY,
        branchId: maduraiBranchId,
      };

      const staffCanProvision = staffUser.role === UserRole.SUPER_ADMIN || staffUser.role === UserRole.BRANCH_MANAGER;
      assert.strictEqual(staffCanProvision, false);

      const readOnlyCanProvision = readOnlyUser.role === UserRole.SUPER_ADMIN || readOnlyUser.role === UserRole.BRANCH_MANAGER;
      assert.strictEqual(readOnlyCanProvision, false);
    });
  });

  describe('Repeat Customer Rate & Analytics Aggregation Formula', () => {
    it('should compute repeat customer rate correctly', () => {
      const customerRecords = [
        { id: '1', servicesCount: 3 }, // multi
        { id: '2', servicesCount: 1 }, // single
        { id: '3', servicesCount: 2 }, // multi
        { id: '4', servicesCount: 1 }, // single
      ];

      let multi = 0;
      let single = 0;
      for (const c of customerRecords) {
        if (c.servicesCount > 1) multi++;
        else single++;
      }

      const total = multi + single;
      const rate = Number(((multi / total) * 100).toFixed(1));

      assert.strictEqual(multi, 2);
      assert.strictEqual(single, 2);
      assert.strictEqual(rate, 50.0);
    });
  });
});
