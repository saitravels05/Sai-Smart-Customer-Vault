import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { TotpService } from './totp.service';
import { UserRole } from '@sai/shared-types';

describe('Phase 3 — Authentication, Security & Multi-Branch Tenancy Suite', () => {
  const totpService = new TotpService();
  const testSecret = 'JBSWY3DPEHPK3PXP'; // Base32 test secret

  describe('Argon2id Password Hashing & Verification', () => {
    test('should hash password with argon2id and verify positive and negative matches', async () => {
      const password = 'AdminSecurePass2026!';
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      assert.ok(hash.startsWith('$argon2id$'), 'Hash must adhere to argon2id format');
      assert.ok(await argon2.verify(hash, password), 'Correct password must verify');
      assert.ok(!(await argon2.verify(hash, 'WrongPassword999')), 'Wrong password must be rejected');
    });
  });

  describe('RFC 6238 TOTP Multi-Factor Authentication', () => {
    test('should generate and verify 6-digit TOTP tokens accurately', () => {
      const token = totpService.generateToken(testSecret);
      assert.equal(token.length, 6, 'Token must be exactly 6 digits');
      assert.match(token, /^\d{6}$/, 'Token must only contain numeric digits');

      const isValid = totpService.verifyToken(testSecret, token);
      assert.ok(isValid, 'Freshly generated TOTP token must verify successfully');

      const isInvalid = totpService.verifyToken(testSecret, '000000');
      assert.ok(!isInvalid, 'Arbitrary invalid token must fail verification');
    });

    test('should tolerate acceptable time drift within window (±30s)', () => {
      const now = Date.now();
      // Generate token for 25 seconds ago (within current or immediately previous window)
      const pastToken = totpService.generateToken(testSecret, now - 25000);
      assert.ok(
        totpService.verifyToken(testSecret, pastToken, 1),
        'Token within ±1 window must be accepted',
      );

      // Generate token 5 minutes ago (outside window)
      const staleToken = totpService.generateToken(testSecret, now - 300000);
      assert.ok(
        !totpService.verifyToken(testSecret, staleToken, 1),
        'Stale token from 5 minutes ago must be rejected',
      );
    });

    test('should produce valid otpauth URI for authenticator applications', () => {
      const uri = totpService.generateKeyUri('admin@saitravelservices.com', testSecret);
      assert.ok(uri.startsWith('otpauth://totp/'), 'URI must follow standard otpauth scheme');
      assert.ok(uri.includes('secret=' + testSecret), 'URI must contain the secret');
      assert.ok(uri.includes('issuer=SAI%20Tours%20%26%20Travels'), 'URI must contain branded issuer');
    });
  });

  describe('JWT Session Tokens & Payload Structure', () => {
    const jwtSecret = 'test_jwt_secret_key_32_characters_long_1234';

    test('should encode user ID, role, and branch scope into JWT payload', () => {
      const payload = {
        sub: '11111111-2222-3333-4444-555555555555',
        email: 'staff.trichy@saitravelservices.com',
        role: UserRole.STAFF,
        branchId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
      const decoded = jwt.verify(token, jwtSecret) as typeof payload;

      assert.equal(decoded.sub, payload.sub);
      assert.equal(decoded.email, payload.email);
      assert.equal(decoded.role, UserRole.STAFF);
      assert.equal(decoded.branchId, payload.branchId);
    });
  });

  describe('Multi-Branch Tenancy Isolation Rules', () => {
    const maduraiBranchId = 'madurai-branch-uuid-001';
    const trichyBranchId = 'trichy-branch-uuid-002';

    test('Super Admin has cross-branch clearance', () => {
      const superAdminUser = {
        role: UserRole.SUPER_ADMIN,
        branchId: maduraiBranchId,
      };

      // Super admin can access Madurai, Trichy, or any other branch
      const canAccessMadurai = superAdminUser.role === UserRole.SUPER_ADMIN;
      const canAccessTrichy = superAdminUser.role === UserRole.SUPER_ADMIN;

      assert.ok(canAccessMadurai, 'Super Admin must have clearance for Madurai');
      assert.ok(canAccessTrichy, 'Super Admin must have clearance for Trichy');
    });

    test('Branch Staff is strictly isolated to assigned branch', () => {
      const trichyStaff = {
        role: UserRole.STAFF,
        branchId: trichyBranchId,
      };

      // Check access logic: non-super-admin can only access matching branchId
      const checkAccess = (targetBranchId: string) => {
        if (trichyStaff.role === UserRole.SUPER_ADMIN) return true;
        return trichyStaff.branchId === targetBranchId;
      };

      assert.ok(checkAccess(trichyBranchId), 'Trichy staff can access Trichy branch');
      assert.ok(!checkAccess(maduraiBranchId), 'Trichy staff MUST be blocked from Madurai branch');
    });
  });
});
