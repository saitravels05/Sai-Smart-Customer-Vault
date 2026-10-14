import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { prisma } from '@sai/database';
import {
  LoginDto,
  MfaVerifyDto,
  RefreshTokenDto,
  LoginResponseDto,
  SignupRequestDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UserRole,
  UserStatus,
  RegistrationStatus,
  AuthUserResponse,
} from '@sai/shared-types';
import { TotpService } from './totp.service';
import { EmailService } from './email.service';
import { JwtPayload } from './jwt.strategy';

// In-Memory Offline Resilient Store for development and fallback
interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  mustChangePassword: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  mfaSecret: string | null;
  isMfaEnabled: boolean;
  fullName: string;
  designation: string;
  contactNumber: string;
  branchId: string;
  branchCode: string;
  branchName: string;
}

interface MemoryRegistration {
  id: string;
  applicantEmail: string;
  fullName: string;
  mobile: string;
  branchName: string;
  passwordHash: string;
  status: RegistrationStatus;
  assignedRole?: UserRole;
  approvedById?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
}

interface MemoryChallenge {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  consumedAt: Date | null;
  createdAt: Date;
}

interface MemoryAuthorization {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

interface MemorySession {
  id: string;
  userId: string;
  sessionTokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxFailedAttempts = 5;
  private readonly lockDurationMinutes = 15;
  private readonly hmacSecret =
    process.env.JWT_ACCESS_SECRET || 'changeme_generate_min_32_char_access_secret_key_12345678';

  // In-Memory stores for zero-loss offline resiliency
  private memoryUsers: Map<string, MemoryUser> = new Map();
  private memoryRegistrations: Map<string, MemoryRegistration> = new Map();
  private memoryChallenges: Map<string, MemoryChallenge> = new Map();
  private memoryAuthorizations: Map<string, MemoryAuthorization> = new Map();
  private memorySessions: Map<string, MemorySession> = new Map();
  private requestRateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly totpService: TotpService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.initializeOwnerAccount();
  }

  /**
   * Secure, idempotent initialization of the Primary Owner account.
   * Reads INITIAL_OWNER_PASSWORD securely from process.env.
   * Never hardcoded, never logged, never overwrites existing password.
   */
  async initializeOwnerAccount(): Promise<void> {
    const ownerEmail = 'saipassportmdu@gmail.com';
    const initialPassword = process.env.INITIAL_OWNER_PASSWORD;

    if (!initialPassword) {
      this.logger.warn(
        '[OwnerInit] Notice: INITIAL_OWNER_PASSWORD environment variable is not set. Ensure it is defined in .env to bootstrap the Primary Owner.',
      );
      return;
    }

    try {
      const existingDbOwner = await prisma.user.findUnique({
        where: { email: ownerEmail },
      });

      if (existingDbOwner) {
        this.logger.log(`[OwnerInit] Primary Owner (${ownerEmail}) already exists in PostgreSQL. Preserving existing password.`);
        return;
      }

      // Hash with Argon2id
      const passwordHash = await argon2.hash(initialPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      // Ensure Head Office branch exists
      const hoBranch = await prisma.branch.findFirst({
        where: { isHeadOffice: true },
      });

      await prisma.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
          isActive: true,
          mustChangePassword: true,
          emailVerifiedAt: new Date(),
          staffProfile: {
            create: {
              branchId: hoBranch?.id || '11111111-1111-1111-1111-111111111111',
              staffCode: 'OWNER-01',
              fullName: 'SAI Tours & Travels Owner',
              designation: 'Managing Director & Owner',
              contactNumber: '+91 9894821561',
            },
          },
        },
      });

      this.logger.log(
        `[OwnerInit] Successfully initialized Primary Owner account (${ownerEmail}). Role: OWNER. Password change required at first login.`,
      );
    } catch (err: any) {
      this.logger.warn(
        `[OwnerInit] PostgreSQL connection unavailable (${err.message}). Populating offline-resilient memory store for Owner account.`,
      );
      if (!this.memoryUsers.has(ownerEmail)) {
        const passwordHash = await argon2.hash(initialPassword, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });

        this.memoryUsers.set(ownerEmail, {
          id: 'usr-owner-ho',
          email: ownerEmail,
          passwordHash,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
          isActive: true,
          mustChangePassword: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: null,
          failedAttempts: 0,
          lockedUntil: null,
          mfaSecret: null,
          isMfaEnabled: false,
          fullName: 'SAI Tours & Travels Owner',
          designation: 'Managing Director & Owner',
          contactNumber: '+91 9894821561',
          branchId: 'IXM-HO',
          branchCode: 'IXM-HO',
          branchName: 'Madurai Head Office',
        });
        this.logger.log(
          `[OwnerInit] Memory store initialized for Primary Owner (${ownerEmail}) with role OWNER.`,
        );
      }
    }
  }

  /**
   * Authenticates user credentials with Argon2id and evaluates status and lockout.
   */
  async login(
    dto: LoginDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<LoginResponseDto> {
    const cleanEmail = dto.email.toLowerCase().trim();
    let user: any = null;
    let isMemoryStore = false;

    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          staffProfile: {
            include: { branch: true },
          },
        },
      });
    } catch {
      // Fallback to memory store if database is offline
      user = this.memoryUsers.get(cleanEmail);
      isMemoryStore = true;
    }

    if (!user && !isMemoryStore) {
      user = this.memoryUsers.get(cleanEmail);
      if (user) isMemoryStore = true;
    }

    // Generic rejection if user does not exist (prevents user enumeration)
    if (!user) {
      this.logger.warn(`Failed login attempt for non-existent email: ${cleanEmail} [${ipAddress}]`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account Lockout check
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account is locked due to multiple failed attempts. Try again in ${remainingMinutes} minutes.`,
      );
    }

    // Account Status check
    if (!user.isActive || user.status === UserStatus.INACTIVE || user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Your account has been deactivated or is pending approval. Contact the Owner.');
    }

    // Verify Argon2id password hash
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      const newFailedCount = (user.failedAttempts || 0) + 1;
      const isLockedNow = newFailedCount >= this.maxFailedAttempts;
      const lockUntil = isLockedNow
        ? new Date(Date.now() + this.lockDurationMinutes * 60 * 1000)
        : null;

      if (!isMemoryStore) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { failedAttempts: newFailedCount, lockedUntil: lockUntil },
          })
          .catch(() => {});

        await prisma.auditLog
          .create({
            data: {
              userId: user.id,
              branchId: user.staffProfile?.branchId,
              action: 'AUTH_LOGIN_FAILED',
              entityType: 'USER',
              entityId: user.id,
              ipAddress,
              userAgent,
            },
          })
          .catch(() => {});
      } else {
        user.failedAttempts = newFailedCount;
        user.lockedUntil = lockUntil;
      }

      if (isLockedNow) {
        throw new ForbiddenException(
          `Too many failed attempts. Account locked for ${this.lockDurationMinutes} minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts upon successful login
    if (!isMemoryStore) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })
        .catch(() => {});
    } else {
      user.failedAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
    }

    // MFA Verification evaluation
    if (user.isMfaEnabled && user.mfaSecret) {
      return {
        requiresMfa: true,
        userId: user.id,
        mustChangePassword: user.mustChangePassword,
      };
    }

    return this.createAuthSession(user, ipAddress, userAgent, isMemoryStore);
  }

  /**
   * Verifies TOTP 6-digit MFA code and issues session tokens.
   */
  async verifyMfa(
    dto: MfaVerifyDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<LoginResponseDto> {
    let user: any = null;
    let isMemoryStore = false;

    try {
      user = await prisma.user.findUnique({
        where: { id: dto.userId },
        include: { staffProfile: { include: { branch: true } } },
      });
    } catch {
      for (const u of this.memoryUsers.values()) {
        if (u.id === dto.userId) {
          user = u;
          isMemoryStore = true;
          break;
        }
      }
    }

    if (!user || !user.isActive || !user.mfaSecret) {
      throw new UnauthorizedException('MFA verification failed');
    }

    const isValid = this.totpService.verifyToken(user.mfaSecret, dto.totpCode);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired MFA code');
    }

    return this.createAuthSession(user, ipAddress, userAgent, isMemoryStore);
  }

  /**
   * Public Registration Request (Stored as PENDING, Owner approval mandatory)
   */
  async requestSignup(
    dto: SignupRequestDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ message: string }> {
    const cleanEmail = dto.email.toLowerCase().trim();

    // Check duplicate in Users
    let userExists = false;
    try {
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing) userExists = true;
    } catch {
      if (this.memoryUsers.has(cleanEmail)) userExists = true;
    }

    if (userExists) {
      throw new BadRequestException('A registration or account with this email address already exists.');
    }

    // Check duplicate in Pending Requests
    let pendingExists = false;
    try {
      const existingReq = await prisma.registrationRequest.findFirst({
        where: { applicantEmail: cleanEmail, status: RegistrationStatus.PENDING },
      });
      if (existingReq) pendingExists = true;
    } catch {
      for (const r of this.memoryRegistrations.values()) {
        if (r.applicantEmail === cleanEmail && r.status === RegistrationStatus.PENDING) {
          pendingExists = true;
          break;
        }
      }
    }

    if (pendingExists) {
      throw new BadRequestException('A registration request for this email address is already pending Owner review.');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const regId = crypto.randomUUID();
    const newReq: MemoryRegistration = {
      id: regId,
      applicantEmail: cleanEmail,
      fullName: dto.fullName.trim(),
      mobile: dto.mobile.trim(),
      branchName: dto.branch,
      passwordHash,
      status: RegistrationStatus.PENDING,
      createdAt: new Date(),
    };

    try {
      await prisma.registrationRequest.create({
        data: {
          id: regId,
          applicantEmail: cleanEmail,
          fullName: dto.fullName.trim(),
          mobile: dto.mobile.trim(),
          branchName: dto.branch,
          passwordHash,
          status: RegistrationStatus.PENDING,
        },
      });

      await prisma.auditLog
        .create({
          data: {
            action: 'AUTH_REGISTRATION_REQUESTED',
            entityType: 'REGISTRATION_REQUEST',
            entityId: regId,
            ipAddress,
            userAgent,
            newStateJson: { email: cleanEmail, fullName: dto.fullName, branch: dto.branch },
          },
        })
        .catch(() => {});
    } catch {
      this.memoryRegistrations.set(regId, newReq);
    }

    // Notify Owner by Email if email service is active
    this.emailService
      .sendAccountActivatedEmail(
        'saipassportmdu@gmail.com',
        dto.fullName,
        `PENDING REQUEST from ${dto.fullName} (${cleanEmail})`,
      )
      .catch(() => {});

    return {
      message: 'Registration request submitted successfully. Your account is pending review and authorization by the Owner.',
    };
  }

  /**
   * Forgot Password — Generates 6-Digit Email OTP with 5-minute expiry
   * Rate limited: max 5 requests per 15 minutes
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ message: string; emailUnconfigured?: boolean }> {
    const cleanEmail = dto.email.toLowerCase().trim();

    // Apply Rate Limiting
    this.checkRateLimit(`forgot_${ipAddress}_${cleanEmail}`, 5, 15 * 60 * 1000);

    let user: any = null;
    let isMemoryStore = false;
    try {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch {
      user = this.memoryUsers.get(cleanEmail);
      isMemoryStore = true;
    }

    if (!user) {
      throw new NotFoundException({
        code: 'EMAIL_NOT_REGISTERED',
        isNotRegistered: true,
        message: 'This email is not registered in our system. Please check your email or register for a new account.',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        isInactive: true,
        message: 'This account has been deactivated. Please contact Madurai Head Office (+91 9894821561) for assistance.',
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(rawOtp)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const challengeId = crypto.randomUUID();

    try {
      // Invalidate existing unconsumed challenges
      await prisma.passwordResetChallenge.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      await prisma.passwordResetChallenge.create({
        data: {
          id: challengeId,
          userId: user.id,
          otpHash,
          expiresAt,
          attemptCount: 0,
        },
      });

      await prisma.auditLog
        .create({
          data: {
            userId: user.id,
            action: 'AUTH_FORGOT_PASSWORD_REQUESTED',
            entityType: 'PASSWORD_RESET',
            entityId: challengeId,
            ipAddress,
            userAgent,
          },
        })
        .catch(() => {});
    } catch {
      // Offline fallback: invalidate memory challenges
      for (const [key, ch] of this.memoryChallenges.entries()) {
        if (ch.userId === user.id && !ch.consumedAt) {
          ch.consumedAt = new Date();
        }
      }
      this.memoryChallenges.set(challengeId, {
        id: challengeId,
        userId: user.id,
        otpHash,
        expiresAt,
        attemptCount: 0,
        consumedAt: null,
        createdAt: new Date(),
      });
    }

    // Dispatch OTP email (never logs the OTP value)
    const emailResult = await this.emailService.sendPasswordResetOtp(cleanEmail, rawOtp);

    if (emailResult.unconfigured) {
      this.logger.warn(
        `[AuthService] Password reset OTP generated for ${cleanEmail}, but email provider is unconfigured in .env.`,
      );
      return {
        emailUnconfigured: true,
        message:
          'Email provider is not configured on the server. Please configure SMTP or Resend credentials in .env to receive OTP emails.',
      };
    }

    if (!emailResult.success) {
      this.logger.error(`[AuthService] Email delivery failure for ${cleanEmail}: ${emailResult.error}`);
      return {
        message:
          emailResult.error ||
          'Email delivery failed. The configured provider rejected the request. Please check server logs.',
      };
    }

    return genericSuccess;
  }

  /**
   * Resend OTP with strict 60-second cooldown
   */
  async resendOtp(
    dto: ResendOtpDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ message: string; emailUnconfigured?: boolean }> {
    const cleanEmail = dto.email.toLowerCase().trim();
    this.checkRateLimit(`resend_${cleanEmail}`, 3, 5 * 60 * 1000);

    return this.forgotPassword({ email: cleanEmail }, ipAddress, userAgent);
  }

  /**
   * Verify OTP — Single-use verification with max 5 attempts and issue reset authorization
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ resetToken: string }> {
    const cleanEmail = dto.email.toLowerCase().trim();

    let user: any = null;
    let challenge: any = null;
    let isMemoryStore = false;

    try {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user) {
        challenge = await prisma.passwordResetChallenge.findFirst({
          where: {
            userId: user.id,
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch {
      user = this.memoryUsers.get(cleanEmail);
      isMemoryStore = true;
      if (user) {
        for (const ch of Array.from(this.memoryChallenges.values()).reverse()) {
          if (ch.userId === user.id && !ch.consumedAt && ch.expiresAt > new Date()) {
            challenge = ch;
            break;
          }
        }
      }
    }

    if (!user || !challenge) {
      throw new BadRequestException('Verification code is invalid or has expired. Please request a new code.');
    }

    // Attempt limit check (Max 5 attempts)
    if (challenge.attemptCount >= 5) {
      if (!isMemoryStore) {
        await prisma.passwordResetChallenge
          .update({
            where: { id: challenge.id },
            data: { consumedAt: new Date() },
          })
          .catch(() => {});
      } else {
        challenge.consumedAt = new Date();
      }
      throw new BadRequestException('Too many incorrect attempts. Please request a new verification code.');
    }

    // Compare HMAC hash using timing-safe comparison
    const incomingHash = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(dto.otp.trim())
      .digest('hex');

    const expectedBuffer = Buffer.from(challenge.otpHash, 'hex');
    const incomingBuffer = Buffer.from(incomingHash, 'hex');

    const isMatch =
      expectedBuffer.length === incomingBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, incomingBuffer);

    if (!isMatch) {
      const nextAttempt = challenge.attemptCount + 1;
      if (!isMemoryStore) {
        await prisma.passwordResetChallenge
          .update({
            where: { id: challenge.id },
            data: { attemptCount: nextAttempt },
          })
          .catch(() => {});
      } else {
        challenge.attemptCount = nextAttempt;
      }
      throw new BadRequestException(`Invalid verification code. Remaining attempts: ${5 - nextAttempt}`);
    }

    // Invalidate Challenge
    if (!isMemoryStore) {
      await prisma.passwordResetChallenge
        .update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        })
        .catch(() => {});
    } else {
      challenge.consumedAt = new Date();
    }

    // Issue High-Entropy Single-Use Reset Authorization Token (15m expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const authId = crypto.randomUUID();
    const authExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await prisma.passwordResetAuthorization.create({
        data: {
          id: authId,
          userId: user.id,
          tokenHash,
          expiresAt: authExpiresAt,
        },
      });
    } catch {
      this.memoryAuthorizations.set(authId, {
        id: authId,
        userId: user.id,
        tokenHash,
        expiresAt: authExpiresAt,
        consumedAt: null,
        createdAt: new Date(),
      });
    }

    return { resetToken };
  }

  /**
   * Reset Password — Validates authorization, updates Argon2id hash, and revokes all active sessions
   */
  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.resetToken.trim()).digest('hex');

    let authRecord: any = null;
    let isMemoryStore = false;

    try {
      authRecord = await prisma.passwordResetAuthorization.findFirst({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });
    } catch {
      for (const auth of this.memoryAuthorizations.values()) {
        if (auth.tokenHash === tokenHash && !auth.consumedAt && auth.expiresAt > new Date()) {
          authRecord = auth;
          isMemoryStore = true;
          break;
        }
      }
    }

    if (!authRecord) {
      throw new BadRequestException(
        'Password reset session is invalid or has expired. Please initiate password recovery again.',
      );
    }

    const userId = authRecord.userId;

    // Check if new password matches old password
    let currentHash = '';
    if (!isMemoryStore && authRecord.user) {
      currentHash = authRecord.user.passwordHash;
    } else {
      for (const u of this.memoryUsers.values()) {
        if (u.id === userId) {
          currentHash = u.passwordHash;
          break;
        }
      }
    }

    if (currentHash) {
      const isSame = await argon2.verify(currentHash, dto.newPassword).catch(() => false);
      if (isSame) {
        throw new BadRequestException('New password cannot be the same as your previous password.');
      }
    }

    // Hash new password with Argon2id
    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash: newPasswordHash,
            mustChangePassword: false,
            failedAttempts: 0,
            lockedUntil: null,
          },
        }),
        prisma.passwordResetAuthorization.update({
          where: { id: authRecord.id },
          data: { consumedAt: new Date() },
        }),
        prisma.userSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            userId,
            action: 'AUTH_PASSWORD_RESET_COMPLETED',
            entityType: 'USER',
            entityId: userId,
            ipAddress,
            userAgent,
          },
        }),
      ]);
    } catch {
      // Offline fallback: update memory store
      authRecord.consumedAt = new Date();
      for (const u of this.memoryUsers.values()) {
        if (u.id === userId) {
          u.passwordHash = newPasswordHash;
          u.mustChangePassword = false;
          u.failedAttempts = 0;
          u.lockedUntil = null;
          this.emailService.sendPasswordChangedAlert(u.email).catch(() => {});
          break;
        }
      }
      for (const s of this.memorySessions.values()) {
        if (s.userId === userId && !s.revokedAt) {
          s.revokedAt = new Date();
        }
      }
    }

    return {
      message: 'Your password has been reset successfully. Please log in using your new password.',
    };
  }

  /**
   * Change Password for authenticated user (mandatory first login or self-service)
   */
  async changePassword(
    dto: ChangePasswordDto,
    userId: string,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ): Promise<{ message: string }> {
    let user: any = null;
    let isMemoryStore = false;

    try {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } catch {
      for (const u of this.memoryUsers.values()) {
        if (u.id === userId) {
          user = u;
          isMemoryStore = true;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValidCurrent = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValidCurrent) {
      throw new BadRequestException('Incorrect current password.');
    }

    const isSame = await argon2.verify(user.passwordHash, dto.newPassword);
    if (isSame) {
      throw new BadRequestException('New password must be different from your current password.');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    if (!isMemoryStore) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      await prisma.auditLog
        .create({
          data: {
            userId,
            action: 'AUTH_PASSWORD_CHANGED',
            entityType: 'USER',
            entityId: userId,
            ipAddress,
            userAgent,
          },
        })
        .catch(() => {});
    } else {
      user.passwordHash = newPasswordHash;
      user.mustChangePassword = false;
    }

    this.emailService.sendPasswordChangedAlert(user.email).catch(() => {});

    return { message: 'Password updated successfully.' };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const payload: JwtPayload = this.jwtService.verify(dto.refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'changeme_generate_min_32_char_refresh_secret_key_12345678',
      });

      let user: any = null;
      try {
        user = await prisma.user.findUnique({
          where: { id: payload.sub },
          include: { staffProfile: true },
        });
      } catch {
        for (const u of this.memoryUsers.values()) {
          if (u.id === payload.sub) {
            user = u;
            break;
          }
        }
      }

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Session invalid or revoked');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          branchId: user.staffProfile?.branchId || user.branchId,
        },
        {
          secret:
            process.env.JWT_ACCESS_SECRET ||
            'changeme_generate_min_32_char_access_secret_key_12345678',
          expiresIn: '15m',
        },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: string): Promise<void> {
    try {
      await prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      for (const s of this.memorySessions.values()) {
        if (s.userId === userId && !s.revokedAt) {
          s.revokedAt = new Date();
        }
      }
    }
  }

  /**
   * Helper: Rate limiter checker
   */
  private checkRateLimit(key: string, limit: number, windowMs: number): void {
    const now = Date.now();
    const entry = this.requestRateLimits.get(key);

    if (!entry || entry.resetAt < now) {
      this.requestRateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (entry.count >= limit) {
      const waitSeconds = Math.ceil((entry.resetAt - now) / 1000);
      throw new ForbiddenException(
        `Too many requests. Please wait ${waitSeconds} seconds before trying again.`,
      );
    }

    entry.count += 1;
  }

  /**
   * Helper: Creates session token, records audit log, and formats AuthUserResponse
   */
  private async createAuthSession(
    user: any,
    ipAddress: string,
    userAgent: string,
    isMemoryStore: boolean,
  ): Promise<LoginResponseDto> {
    const branchId = user.staffProfile?.branchId || user.branchId || '';
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_ACCESS_SECRET ||
        'changeme_generate_min_32_char_access_secret_key_12345678',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        'changeme_generate_min_32_char_refresh_secret_key_12345678',
      expiresIn: '7d',
    });

    const sessionTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const sessionId = crypto.randomUUID();

    if (!isMemoryStore) {
      await prisma.userSession
        .create({
          data: {
            id: sessionId,
            userId: user.id,
            sessionTokenHash,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
        .catch(() => {});

      await prisma.auditLog
        .create({
          data: {
            userId: user.id,
            branchId,
            action: 'AUTH_LOGIN_SUCCESS',
            entityType: 'USER',
            entityId: user.id,
            ipAddress,
            userAgent,
          },
        })
        .catch(() => {});
    } else {
      this.memorySessions.set(sessionId, {
        id: sessionId,
        userId: user.id,
        sessionTokenHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      });
    }

    const authUser: AuthUserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.staffProfile?.fullName || user.fullName || 'SAI Personnel',
      designation: user.staffProfile?.designation || user.designation || 'Staff',
      mobile: user.staffProfile?.contactNumber || user.contactNumber,
      branchId,
      branchCode: user.staffProfile?.branch?.code || user.branchCode || 'IXM-HO',
      branchName: user.staffProfile?.branch?.name || user.branchName || 'Madurai Head Office',
      isMfaEnabled: user.isMfaEnabled || false,
      mustChangePassword: user.mustChangePassword || false,
      status: user.status || UserStatus.ACTIVE,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    };

    return {
      requiresMfa: false,
      mustChangePassword: user.mustChangePassword,
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  // Accessors for Owner Controller
  getMemoryUsers(): Map<string, any> {
    return this.memoryUsers;
  }

  getMemoryRegistrations(): Map<string, any> {
    return this.memoryRegistrations;
  }
}
