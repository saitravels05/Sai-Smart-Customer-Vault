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
  }

  /**
   * Create a new branch (Super Admin authorization required)
   */
  async createBranch(dto: CreateBranchDto, user: AuthUserContext): Promise<BranchDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can register new branches.');
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
          userId: user.userId,
          branchId: created.id,
          action: 'BRANCH_CREATED',
          entityType: 'BRANCH',
          entityId: created.id,
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
    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    } else if (user && user.role !== UserRole.SUPER_ADMIN) {
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
      role: s.user.role,
      designation: s.designation,
      contactNumber: s.contactNumber,
      isActive: s.user.isActive,
      lastLoginAt: s.user.lastLoginAt?.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /**
   * Provision a new staff member profile
   */
  async createStaffMember(dto: CreateStaffDto, user: AuthUserContext): Promise<StaffMemberDto> {
    // Permission check: Super Admin can provision for any branch; Branch Manager can only provision for their own branch
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.BRANCH_MANAGER) {
      throw new ForbiddenException('Staff provisioning requires Branch Manager or Super Admin role.');
    }

    if (user.role === UserRole.BRANCH_MANAGER && user.branchId !== dto.branchId) {
      throw new ForbiddenException('Branch Managers cannot provision staff for other branches.');
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
          userId: user.userId,
          branchId: dto.branchId,
          action: 'STAFF_PROVISIONED',
          entityType: 'STAFF_PROFILE',
          entityId: result.profile.id,
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
      role: result.user.role,
      designation: result.profile.designation,
      contactNumber: result.profile.contactNumber,
      isActive: result.user.isActive,
      createdAt: result.profile.createdAt.toISOString(),
    };
  }
}
