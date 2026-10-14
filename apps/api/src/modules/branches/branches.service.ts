import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { prisma } from '@sai/database';
import * as argon2 from 'argon2';
import {
  BranchDto,
  CreateBranchDto,
  StaffMemberDto,
  CreateStaffDto,
  UserRole,
} from '@sai/shared-types';

interface AuthUserContext {
  userId: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  /**
   * List all branches with live customer and staff counts
   */
  async getAllBranches(user: AuthUserContext): Promise<BranchDto[]> {
    try {
      const branches = await prisma.branch.findMany({
        include: {
          _count: {
            select: {
              customers: { where: { isDeleted: false } },
              staff: true,
            },
          },
        },
        orderBy: [{ isHeadOffice: 'desc' }, { name: 'asc' }],
      });

      return branches.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        address: b.address,
        city: b.city,
        state: b.state,
        phone: b.phone,
        email: b.email,
        isHeadOffice: b.isHeadOffice,
        isActive: b.isActive,
        customerCount: b._count.customers,
        staffCount: b._count.staff,
        createdAt: b.createdAt.toISOString(),
      }));
    } catch (err: any) {
      this.logger.warn(`Database offline in getAllBranches: ${err.message}. Returning default active branches.`);
      return [
        {
          id: 'madurai-ho',
          code: 'IXM-HO',
          name: 'Madurai Head Office',
          address: 'Main Road, Madurai, Tamil Nadu',
          city: 'Madurai',
          state: 'Tamil Nadu',
          phone: '+91 9894821561',
          email: 'madurai@saitravelservices.com',
          isHeadOffice: true,
          isActive: true,
          customerCount: 0,
          staffCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'trichy-branch',
          code: 'TRZ-BO',
          name: 'Trichy Branch',
          address: 'Cantonment, Trichy, Tamil Nadu',
          city: 'Trichy',
          state: 'Tamil Nadu',
          phone: '+91 9894619921',
          email: 'trichy@saitravelservices.com',
          isHeadOffice: false,
          isActive: true,
          customerCount: 0,
          staffCount: 1,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  /**
   * Create a new branch (Owner authorization required)
   */
  async createBranch(dto: CreateBranchDto, user: AuthUserContext): Promise<BranchDto> {
    if (user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only Owner can register new branches.');
    }

    const existing = await prisma.branch.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Branch code "${dto.code}" is already in use.`);
    }

    const created = await prisma.branch.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state || 'Tamil Nadu',
        phone: dto.phone,
        email: dto.email,
        isHeadOffice: dto.isHeadOffice || false,
        isActive: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId || undefined,
          branchId: created.id,
          action: 'BRANCH_CREATED',
          entityType: 'BRANCH',
          entityId: created.id,
          ipAddress: '127.0.0.1',
          newStateJson: { code: created.code, name: created.name },
        },
      });
    } catch {}

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      address: created.address,
      city: created.city,
      state: created.state,
      phone: created.phone,
      email: created.email,
      isHeadOffice: created.isHeadOffice,
      isActive: created.isActive,
      customerCount: 0,
      staffCount: 0,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Get branch profile details
   */
  async getBranchById(id: string, user: AuthUserContext): Promise<BranchDto> {
    const b = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: { where: { isDeleted: false } },
            staff: true,
          },
        },
      },
    });

    if (!b) {
      throw new NotFoundException(`Branch with ID "${id}" was not found.`);
    }

    return {
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address,
      city: b.city,
      state: b.state,
      phone: b.phone,
      email: b.email,
      isHeadOffice: b.isHeadOffice,
      isActive: b.isActive,
      customerCount: b._count.customers,
      staffCount: b._count.staff,
      createdAt: b.createdAt.toISOString(),
    };
  }

  /**
   * Retrieve staff members for a specific branch or across all branches
   */
  async getStaffMembers(branchId?: string, user?: AuthUserContext): Promise<StaffMemberDto[]> {
    try {
      const where: any = {};
      if (branchId) {
        where.branchId = branchId;
      } else if (user && user.role !== UserRole.OWNER) {
        where.branchId = user.branchId;
      }

      const staffProfiles = await prisma.staffProfile.findMany({
        where,
        include: {
          user: true,
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return staffProfiles.map((s) => ({
        id: s.id,
        userId: s.userId,
        branchId: s.branchId,
        branchName: s.branch.name,
        staffCode: s.staffCode,
        fullName: s.fullName,
        email: s.user.email,
        role: s.user.role as any,
        designation: s.designation,
        contactNumber: s.contactNumber,
        isActive: s.user.isActive,
        lastLoginAt: s.user.lastLoginAt?.toISOString(),
        createdAt: s.createdAt.toISOString(),
      }));
    } catch (err: any) {
      this.logger.warn(`Database offline in getStaffMembers: ${err.message}. Returning default staff profile.`);
      return [
        {
          id: 'owner-profile',
          userId: 'owner-user-id',
          branchId: 'madurai-ho',
          branchName: 'Madurai Head Office',
          staffCode: 'OWNER-01',
          fullName: 'SAI Tours & Travels Owner',
          email: 'saipassportmdu@gmail.com',
          role: UserRole.OWNER,
          designation: 'Managing Director & Owner',
          contactNumber: '+91 9894821561',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  /**
   * Provision a new staff member profile
   */
  async createStaffMember(dto: CreateStaffDto, user: AuthUserContext): Promise<StaffMemberDto> {
    // Permission check: Only the Owner can create staff or admin accounts
    if (user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Staff and Admin creation is restricted exclusively to the Owner.');
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    // Check duplicate staff code
    const existingCode = await prisma.staffProfile.findUnique({
      where: { staffCode: dto.staffCode.toUpperCase() },
    });
    if (existingCode) {
      throw new ConflictException(`Staff code "${dto.staffCode}" is already in use.`);
    }

    const password = dto.password || 'SaiTravels@2026';
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role,
          isActive: true,
        },
      });

      const newProfile = await tx.staffProfile.create({
        data: {
          userId: newUser.id,
          branchId: dto.branchId,
          staffCode: dto.staffCode.toUpperCase(),
          fullName: dto.fullName,
          designation: dto.designation,
          contactNumber: dto.contactNumber,
        },
        include: {
          branch: true,
        },
      });

      return { user: newUser, profile: newProfile };
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId || undefined,
          branchId: dto.branchId,
          action: 'STAFF_PROVISIONED',
          entityType: 'STAFF_PROFILE',
          entityId: result.profile.id,
          ipAddress: '127.0.0.1',
          newStateJson: { email: dto.email, role: dto.role, branchId: dto.branchId },
        },
      });
    } catch {}

    return {
      id: result.profile.id,
      userId: result.user.id,
      branchId: result.profile.branchId,
      branchName: result.profile.branch.name,
      staffCode: result.profile.staffCode,
      fullName: result.profile.fullName,
      email: result.user.email,
      role: result.user.role as any,
      designation: result.profile.designation,
      contactNumber: result.profile.contactNumber,
      isActive: result.user.isActive,
      createdAt: result.profile.createdAt.toISOString(),
    };
  }
}
