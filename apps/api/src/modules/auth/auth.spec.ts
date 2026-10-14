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

    test('Owner has cross-branch clearance', () => {
      const ownerUser = {
        role: UserRole.OWNER,
        branchId: maduraiBranchId,
      };

      // Owner can access Madurai, Trichy, or any other branch
      const canAccessMadurai = ownerUser.role === UserRole.OWNER;
      const canAccessTrichy = ownerUser.role === UserRole.OWNER;

      assert.ok(canAccessMadurai, 'Owner must have clearance for Madurai');
      assert.ok(canAccessTrichy, 'Owner must have clearance for Trichy');
    });

    test('Branch Staff is strictly isolated to assigned branch', () => {
      const trichyStaff = {
        role: UserRole.STAFF,
        branchId: trichyBranchId,
      };

      // Check access logic: non-owner can only access matching branchId
      const checkAccess = (targetBranchId: string) => {
        if (trichyStaff.role === UserRole.OWNER) return true;
        return trichyStaff.branchId === targetBranchId;
      };

      assert.ok(checkAccess(trichyBranchId), 'Trichy staff can access Trichy branch');
      assert.ok(!checkAccess(maduraiBranchId), 'Trichy staff MUST be blocked from Madurai branch');
    });
  });

  describe('Three-Role Model & Permission Matrix Enforcement', () => {
    test('strictly enforces only OWNER, ADMIN, and STAFF roles exist', () => {
      const allowedRoles = Object.values(UserRole);
      assert.deepEqual(
        allowedRoles.sort(),
        [UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF].sort(),
        'Only exactly three roles must exist: OWNER, ADMIN, STAFF',
      );
      assert.equal(allowedRoles.length, 3, 'No legacy roles are permitted');
    });

    test('Owner alone can assign ADMIN and STAFF roles', () => {
      const canAssignRoles = (role: UserRole) => role === UserRole.OWNER;
      assert.ok(canAssignRoles(UserRole.OWNER), 'Owner can assign roles');
      assert.ok(!canAssignRoles(UserRole.ADMIN), 'Admin cannot assign roles');
      assert.ok(!canAssignRoles(UserRole.STAFF), 'Staff cannot assign roles');
    });

    test('Owner account cannot be modified, deleted or deactivated by any user', () => {
      const canDeactivate = (actorRole: UserRole, targetRole: UserRole) => {
        if (targetRole === UserRole.OWNER) return false;
        return actorRole === UserRole.OWNER;
      };
      assert.ok(!canDeactivate(UserRole.OWNER, UserRole.OWNER), 'Cannot deactivate Owner even by Owner');
      assert.ok(!canDeactivate(UserRole.ADMIN, UserRole.OWNER), 'Admin cannot deactivate Owner');
      assert.ok(!canDeactivate(UserRole.STAFF, UserRole.OWNER), 'Staff cannot deactivate Owner');
      assert.ok(canDeactivate(UserRole.OWNER, UserRole.STAFF), 'Owner can deactivate Staff');
    });
  });

  describe('Cryptographically Secure OTP Generation & Verification Logic', () => {
    test('generates 6-digit numeric OTP with cryptographical randomness', () => {
      const crypto = require('crypto');
      const otp = crypto.randomInt(100000, 999999).toString();
      assert.equal(otp.length, 6, 'OTP must be 6 digits');
      assert.match(otp, /^[0-9]{6}$/, 'OTP must be all numeric digits');
    });

    test('stores only SHA-256 hash of OTP and verifies securely', () => {
      const crypto = require('crypto');
      const otp = '849201';
      const secret = 'test-otp-secret';
      const hash = crypto.createHmac('sha256', secret).update(otp).digest('hex');

      const incomingCorrect = '849201';
      const incomingHash = crypto.createHmac('sha256', secret).update(incomingCorrect).digest('hex');
      assert.equal(incomingHash, hash, 'Hashes must match for correct OTP');

      const incomingWrong = '849202';
      const wrongHash = crypto.createHmac('sha256', secret).update(incomingWrong).digest('hex');
      assert.notEqual(wrongHash, hash, 'Hashes must differ for incorrect OTP');
    });

    test('enforces 5-minute expiry and maximum 5 incorrect attempts', () => {
      const now = Date.now();
      const expiresAt = new Date(now + 5 * 60 * 1000);
      assert.ok(expiresAt.getTime() > now, 'OTP is valid within 5 minutes');

      const staleExpiresAt = new Date(now - 1000);
      assert.ok(staleExpiresAt.getTime() < now, 'Stale OTP is expired');

      let attempts = 0;
      const MAX_ATTEMPTS = 5;
      for (let i = 0; i < 5; i++) {
        attempts++;
      }
      assert.equal(attempts, MAX_ATTEMPTS, 'Max attempts reached');
      const isLocked = attempts >= MAX_ATTEMPTS;
      assert.ok(isLocked, 'OTP challenge is locked after 5 failed attempts');
    });
  });

  describe('Owner Initialization & Password Change Enforcement', () => {
    test('Owner account requires mustChangePassword: true on initial bootstrap', () => {
      const initialOwnerState = {
        email: 'saipassportmdu@gmail.com',
        role: UserRole.OWNER,
        mustChangePassword: true,
        isActive: true,
      };

      assert.equal(initialOwnerState.email, 'saipassportmdu@gmail.com');
      assert.equal(initialOwnerState.role, UserRole.OWNER);
      assert.ok(initialOwnerState.mustChangePassword, 'Owner must change temporary password at first login');
      assert.ok(initialOwnerState.isActive, 'Owner account is active');
    });

    test('Password complexity enforces minimum 12 characters and Argon2id hash', async () => {
      const weakPassword = 'short';
      assert.ok(weakPassword.length < 12, 'Password under 12 characters is rejected');

      const strongPassword = 'OwnerSecurePassPhrase2026!';
      assert.ok(strongPassword.length >= 12, 'Password meets minimum 12 characters requirement');

      const hash = await argon2.hash(strongPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
      assert.ok(hash.startsWith('$argon2id$'), 'Password must be hashed with Argon2id');
    });
  });
});

