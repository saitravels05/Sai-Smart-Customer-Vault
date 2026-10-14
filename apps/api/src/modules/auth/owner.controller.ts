import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { prisma } from '@sai/database';
import {
  UserRole,
  UserStatus,
  RegistrationStatus,
  ApproveRegistrationDto,
  approveRegistrationSchema,
  RejectRegistrationDto,
  rejectRegistrationSchema,
  ChangeUserRoleDto,
  changeUserRoleSchema,
  ToggleUserStatusDto,
  toggleUserStatusSchema,
  CreateUserByOwnerDto,
  createUserByOwnerSchema,
} from '@sai/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@ApiTags('Owner Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner')
export class OwnerController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 1. View all pending registration requests
   */
  @Get('approvals')
  @ApiOperation({ summary: 'View all pending user registration requests' })
  async getPendingRegistrations(): Promise<{ success: boolean; data: any[] }> {
    try {
      const requests = await prisma.registrationRequest.findMany({
        where: { status: RegistrationStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: requests };
    } catch {
      // Memory fallback
      const memoryReqs = Array.from(this.authService.getMemoryRegistrations().values()).filter(
        (r) => r.status === RegistrationStatus.PENDING,
      );
      return { success: true, data: memoryReqs };
    }
  }

  /**
   * 2. Approve registration request as ADMIN or STAFF
   */
  @Post('approvals/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve pending registration with selected role (ADMIN or STAFF)' })
  async approveRegistration(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveRegistrationSchema)) dto: ApproveRegistrationDto,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (dto.role === (UserRole.OWNER as any)) {
      throw new BadRequestException('Cannot assign OWNER role via registration approval.');
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    let regRequest: any = null;
    let isMemory = false;

    try {
      regRequest = await prisma.registrationRequest.findUnique({ where: { id } });
    } catch {
      regRequest = this.authService.getMemoryRegistrations().get(id);
      isMemory = true;
    }

    if (!regRequest) {
      throw new NotFoundException('Registration request not found.');
    }

    if (regRequest.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(`Registration request has already been ${regRequest.status.toLowerCase()}.`);
    }

    const assignedRole = dto.role as UserRole;
    const now = new Date();

    if (!isMemory) {
      // Find branch by name or default to Head Office
      const branch = await prisma.branch.findFirst({
        where: {
          OR: [{ name: { contains: regRequest.branchName } }, { isHeadOffice: true }],
        },
      });

      const newUserId = crypto.randomUUID();
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: newUserId,
            email: regRequest.applicantEmail,
            passwordHash: regRequest.passwordHash,
            role: assignedRole,
            status: UserStatus.ACTIVE,
            isActive: true,
            emailVerifiedAt: now,
            mustChangePassword: false,
            staffProfile: {
              create: {
                branchId: branch?.id || '11111111-1111-1111-1111-111111111111',
                staffCode: `STAFF-${Math.floor(100 + Math.random() * 900)}`,
                fullName: regRequest.fullName,
                designation: assignedRole === UserRole.ADMIN ? 'Branch Administrator' : 'Staff Travel Consultant',
                contactNumber: regRequest.mobile,
              },
            },
          },
        }),
        prisma.registrationRequest.update({
          where: { id },
          data: {
            status: RegistrationStatus.APPROVED,
            assignedRole,
            approvedById: owner.id,
            approvedAt: now,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: owner.id,
            action: 'OWNER_APPROVE_REGISTRATION',
            entityType: 'REGISTRATION_REQUEST',
            entityId: id,
            ipAddress: ip,
            userAgent,
            newStateJson: { assignedRole, applicantEmail: regRequest.applicantEmail },
          },
        }),
      ]);
    } else {
      regRequest.status = RegistrationStatus.APPROVED;
      regRequest.assignedRole = assignedRole;
      regRequest.approvedById = owner.id;
      regRequest.approvedAt = now;

      this.authService.getMemoryUsers().set(regRequest.applicantEmail, {
        id: crypto.randomUUID(),
        email: regRequest.applicantEmail,
        passwordHash: regRequest.passwordHash,
        role: assignedRole,
        status: UserStatus.ACTIVE,
        isActive: true,
        mustChangePassword: false,
        emailVerifiedAt: now,
        lastLoginAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        mfaSecret: null,
        isMfaEnabled: false,
        fullName: regRequest.fullName,
        designation: assignedRole === UserRole.ADMIN ? 'Branch Administrator' : 'Staff Travel Consultant',
        contactNumber: regRequest.mobile,
        branchId: 'IXM-HO',
        branchCode: 'IXM-HO',
        branchName: regRequest.branchName || 'Madurai Head Office',
      });
    }

    // Send account activation email
    this.emailService
      .sendAccountActivatedEmail(regRequest.applicantEmail, regRequest.fullName, assignedRole)
      .catch(() => {});

    return {
      success: true,
      message: `Account for ${regRequest.fullName} approved and activated as ${assignedRole}.`,
    };
  }

  /**
   * 3. Reject registration request
   */
  @Post('approvals/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject pending user registration request' })
  async rejectRegistration(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectRegistrationSchema)) dto: RejectRegistrationDto,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    let regRequest: any = null;
    let isMemory = false;

    try {
      regRequest = await prisma.registrationRequest.findUnique({ where: { id } });
    } catch {
      regRequest = this.authService.getMemoryRegistrations().get(id);
      isMemory = true;
    }

    if (!regRequest) {
      throw new NotFoundException('Registration request not found.');
    }

    const now = new Date();
    if (!isMemory) {
      await prisma.$transaction([
        prisma.registrationRequest.update({
          where: { id },
          data: {
            status: RegistrationStatus.REJECTED,
            rejectedAt: now,
            rejectionReason: dto.reason || 'Application rejected by Owner',
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: owner.id,
            action: 'OWNER_REJECT_REGISTRATION',
            entityType: 'REGISTRATION_REQUEST',
            entityId: id,
            ipAddress: ip,
            userAgent,
            newStateJson: { reason: dto.reason },
          },
        }),
      ]);
    } else {
      regRequest.status = RegistrationStatus.REJECTED;
      regRequest.rejectedAt = now;
    }

    return {
      success: true,
      message: `Registration request for ${regRequest.fullName} rejected.`,
    };
  }

  /**
   * 4. List all users with filtering by role and branch
   */
  @Get('users')
  @ApiOperation({ summary: 'List all application users with roles and statuses' })
  async listUsers(
    @Query('role') role?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    try {
      const where: any = {};
      if (role && role !== 'ALL') where.role = role as any;
      if (branchId && branchId !== 'ALL') where.staffProfile = { branchId };
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { staffProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          isActive: true,
          mustChangePassword: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          staffProfile: {
            select: {
              fullName: true,
              designation: true,
              contactNumber: true,
              branchId: true,
              staffCode: true,
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: users };
    } catch {
      // Memory fallback
      const memoryUsers = Array.from(this.authService.getMemoryUsers().values()).map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        emailVerifiedAt: u.emailVerifiedAt,
        lastLoginAt: u.lastLoginAt,
        createdAt: new Date().toISOString(),
        staffProfile: {
          fullName: u.fullName,
          designation: u.designation,
          contactNumber: u.contactNumber,
          branchId: u.branchId,
          staffCode: 'STF-01',
          branch: { id: u.branchId, name: u.branchName, code: u.branchCode },
        },
      }));

      return { success: true, data: memoryUsers };
    }
  }

  /**
   * 5. Create user directly by Owner (ADMIN or STAFF)
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user account directly from Owner dashboard' })
  async createUserByOwner(
    @Body(new ZodValidationPipe(createUserByOwnerSchema)) dto: CreateUserByOwnerDto,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const cleanEmail = dto.email.toLowerCase().trim();
    const tempPassword = dto.initialPassword || `SaiVault${crypto.randomInt(1000, 9999)}!`;

    const passwordHash = await argon2.hash(tempPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    try {
      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: dto.role,
          status: UserStatus.ACTIVE,
          isActive: true,
          mustChangePassword: true,
          emailVerifiedAt: new Date(),
          staffProfile: {
            create: {
              branchId: dto.branchId,
              staffCode: `STAFF-${crypto.randomInt(100, 999)}`,
              fullName: dto.fullName,
              designation: dto.designation || 'Staff',
              contactNumber: dto.mobile,
            },
          },
        },
      });

      await prisma.auditLog
        .create({
          data: {
            userId: owner.id,
            action: 'OWNER_CREATE_USER',
            entityType: 'USER',
            entityId: user.id,
            ipAddress: ip,
            userAgent,
            newStateJson: { email: cleanEmail, role: dto.role },
          },
        })
        .catch(() => {});

      return {
        success: true,
        message: `Account for ${dto.fullName} created successfully with role ${dto.role}.`,
        data: { id: user.id, email: user.email, role: user.role },
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('A user with this email address already exists.');
      }
      throw err;
    }
  }

  /**
   * 6. Change user role (ADMIN <-> STAFF). Protected against altering Owner.
   */
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role between ADMIN and STAFF' })
  async changeUserRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeUserRoleSchema)) dto: ChangeUserRoleDto,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    // Cannot alter own role or Owner account
    if (id === owner.id) {
      throw new ForbiddenException('The Owner cannot modify their own role.');
    }

    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findUnique({ where: { id } });
    } catch {
      for (const u of this.authService.getMemoryUsers().values()) {
        if (u.id === id) targetUser = u;
      }
    }

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    if (targetUser.email === 'saipassportmdu@gmail.com' || targetUser.role === UserRole.OWNER) {
      throw new ForbiddenException('Cannot modify the role of the Primary Owner account.');
    }

    try {
      await prisma.user.update({
        where: { id },
        data: { role: dto.role },
      });

      await prisma.auditLog
        .create({
          data: {
            userId: owner.id,
            action: 'OWNER_CHANGE_USER_ROLE',
            entityType: 'USER',
            entityId: id,
            ipAddress: ip,
            userAgent,
            newStateJson: { oldRole: targetUser.role, newRole: dto.role },
          },
        })
        .catch(() => {});
    } catch {
      targetUser.role = dto.role;
    }

    return {
      success: true,
      message: `User role updated successfully to ${dto.role}.`,
    };
  }

  /**
   * 7. Activate / Deactivate user account. Protected against deactivating Owner.
   */
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async toggleUserStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(toggleUserStatusSchema)) dto: ToggleUserStatusDto,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    if (id === owner.id) {
      throw new ForbiddenException('The Owner account cannot be deactivated.');
    }

    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findUnique({ where: { id } });
    } catch {
      for (const u of this.authService.getMemoryUsers().values()) {
        if (u.id === id) targetUser = u;
      }
    }

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    if (targetUser.email === 'saipassportmdu@gmail.com' || targetUser.role === UserRole.OWNER) {
      throw new ForbiddenException('The Primary Owner account cannot be deactivated.');
    }

    const newStatus = dto.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;

    try {
      await prisma.user.update({
        where: { id },
        data: { isActive: dto.isActive, status: newStatus },
      });

      if (!dto.isActive) {
        await this.authService.revokeUserSessions(id);
      }

      await prisma.auditLog
        .create({
          data: {
            userId: owner.id,
            action: dto.isActive ? 'OWNER_ACTIVATE_USER' : 'OWNER_DEACTIVATE_USER',
            entityType: 'USER',
            entityId: id,
            ipAddress: ip,
            userAgent,
            newStateJson: { isActive: dto.isActive, status: newStatus },
          },
        })
        .catch(() => {});
    } catch {
      targetUser.isActive = dto.isActive;
      targetUser.status = newStatus;
      if (!dto.isActive) {
        await this.authService.revokeUserSessions(id);
      }
    }

    return {
      success: true,
      message: `User account ${dto.isActive ? 'activated' : 'deactivated'} successfully.`,
    };
  }

  /**
   * 8. Revoke all user sessions
   */
  @Post('users/:id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke and invalidate all active sessions for a user' })
  async revokeSessions(
    @Param('id') id: string,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Owner Dashboard';

    await this.authService.revokeUserSessions(id);

    try {
      await prisma.auditLog
        .create({
          data: {
            userId: owner.id,
            action: 'OWNER_REVOKE_SESSIONS',
            entityType: 'USER',
            entityId: id,
            ipAddress: ip,
            userAgent,
          },
        })
        .catch(() => {});
    } catch {}

    return {
      success: true,
      message: 'All active sessions for this user have been successfully revoked.',
    };
  }

  /**
   * 9. Audit Logs Review
   */
  @Get('audit-logs')
  @ApiOperation({ summary: 'Review privileged security and authentication audit logs' })
  async getAuditLogs(@Query('limit') limit = 50): Promise<{ success: boolean; data: any[] }> {
    try {
      const logs = await prisma.auditLog.findMany({
        take: Number(limit) || 50,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              staffProfile: { select: { fullName: true } },
            },
          },
        },
      });
      return { success: true, data: logs };
    } catch {
      return { success: true, data: [] };
    }
  }
}
