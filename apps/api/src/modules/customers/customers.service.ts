import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@sai/database';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFilterDto,
  CustomerStatus,
  UserRole,
} from '@sai/shared-types';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  /**
   * Generates sequential Customer ID: SAI-YYYY-XXXX
   */
  async generateCustomerNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `SAI-${currentYear}-`;

    const count = await prisma.customer.count({
      where: {
        customerNumber: {
          startsWith: prefix,
        },
      },
    });

    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
  }

  /**
   * Detects potential duplicate customer records by phone number or name.
   */
  async checkDuplicate(params: { primaryPhone?: string; whatsappNumber?: string; fullName?: string; branchId?: string }) {
    const conditions: any[] = [];

    if (params.primaryPhone) {
      conditions.push({ primaryPhone: params.primaryPhone.trim() });
    }
    if (params.whatsappNumber) {
      conditions.push({ whatsappNumber: params.whatsappNumber.trim() });
    }

    if (conditions.length === 0) {
      return { hasDuplicate: false, duplicates: [] };
    }

    const duplicates = await prisma.customer.findMany({
      where: {
        OR: conditions,
        isDeleted: false,
      },
      select: {
        id: true,
        customerNumber: true,
        fullName: true,
        primaryPhone: true,
        whatsappNumber: true,
        primaryCategory: true,
        branch: {
          select: { name: true, code: true },
        },
      },
      take: 5,
    });

    return {
      hasDuplicate: duplicates.length > 0,
      duplicates,
    };
  }

  /**
   * Registers a new customer profile with DPDPA consent and audit logging.
   */
  async createCustomer(
    dto: CreateCustomerDto,
    currentUser: AuthenticatedUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    // If not Super Admin, customer is strictly bound to user's assigned branch
    const branchId =
      currentUser.role === UserRole.SUPER_ADMIN ? dto.branchId : currentUser.branchId!;

    if (!branchId) {
      throw new BadRequestException('Valid Branch ID is required');
    }

    // Check duplicate phone
    const duplicateCheck = await this.checkDuplicate({ primaryPhone: dto.primaryPhone });
    if (duplicateCheck.hasDuplicate) {
      const match = duplicateCheck.duplicates[0];
      throw new ConflictException(
        `Customer with phone ${dto.primaryPhone} already exists (${match.customerNumber} - ${match.fullName})`,
      );
    }

    const customerNumber = await this.generateCustomerNumber();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create customer
      const customer = await tx.customer.create({
        data: {
          customerNumber,
          branchId,
          assignedStaffId: dto.assignedStaffId || currentUser.staffProfileId,
          fullName: dto.fullName.trim(),
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender,
          nationality: dto.nationality,
          primaryPhone: dto.primaryPhone.trim(),
          whatsappNumber: dto.whatsappNumber?.trim() || null,
          email: dto.email?.trim().toLowerCase() || null,
          addressLine: dto.addressLine,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          primaryCategory: dto.primaryCategory,
          notes: dto.notes,
        },
        include: {
          branch: true,
          assignedStaff: true,
        },
      });

      // 2. Record statutory DPDPA consent
      if (dto.consentGranted) {
        await tx.customerConsent.create({
          data: {
            customerId: customer.id,
            purpose: `${dto.primaryCategory}_PROCESSING`,
            isGranted: true,
            noticeVersion: 'v1.0-2026',
            ipAddress,
            recordedById: currentUser.id,
          },
        });
      }

      // 3. Create initial customer service record
      await tx.customerService.create({
        data: {
          customerId: customer.id,
          serviceCategory: dto.primaryCategory,
          serviceName: `Initial Registration - ${dto.primaryCategory.replace(/_/g, ' ')}`,
          status: 'IN_PROGRESS',
        },
      });

      // 4. Log immutable audit trail
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          branchId,
          action: 'CUSTOMER_CREATED',
          entityType: 'CUSTOMER',
          entityId: customer.id,
          newStateJson: {
            customerNumber: customer.customerNumber,
            fullName: customer.fullName,
            primaryPhone: customer.primaryPhone,
            primaryCategory: customer.primaryCategory,
          },
          ipAddress,
          userAgent,
        },
      });

      return customer;
    });

    this.logger.log(`Customer created: ${result.customerNumber} (${result.fullName}) at branch ${branchId}`);
    return result;
  }

  /**
   * Retrieves paginated customers scoped by branch access.
   */
  async listCustomers(filter: CustomerFilterDto, currentUser: AuthenticatedUser) {
    const where: any = { isDeleted: false };

    // Tenant Scoping: Super Admin can query any branch; other roles are strictly scoped
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (filter.branchId) {
        where.branchId = filter.branchId;
      }
    } else {
      where.branchId = currentUser.branchId;
    }

    if (filter.category) {
      where.primaryCategory = filter.category;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { customerNumber: { contains: q, mode: 'insensitive' } },
        { primaryPhone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filter.sortBy || 'registeredAt']: filter.sortOrder || 'desc' },
        include: {
          branch: {
            select: { name: true, code: true },
          },
          _count: {
            select: {
              documents: true,
              passports: true,
              visas: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        customerNumber: c.customerNumber,
        fullName: c.fullName,
        primaryPhone: c.primaryPhone,
        whatsappNumber: c.whatsappNumber,
        email: c.email,
        city: c.city,
        state: c.state,
        primaryCategory: c.primaryCategory,
        status: c.status,
        branchName: c.branch.name,
        branchCode: c.branch.code,
        registeredAt: c.registeredAt.toISOString(),
        documentCount: c._count.documents,
        passportCount: c._count.passports,
        visaCount: c._count.visas,
        bookingCount: c._count.bookings,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves detailed customer profile including relations with branch enforcement.
   */
  async getCustomerById(id: string, currentUser: AuthenticatedUser) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        assignedStaff: true,
        contacts: true,
        services: {
          orderBy: { serviceDate: 'desc' },
        },
        passports: {
          where: { isCurrent: true },
        },
        visas: {
          where: { status: 'ACTIVE' },
        },
        bookings: {
          orderBy: { departureTime: 'desc' },
          take: 10,
        },
        documents: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reminders: {
          where: { status: 'SCHEDULED' },
          orderBy: { scheduledFor: 'asc' },
        },
        consents: {
          orderBy: { recordedAt: 'desc' },
        },
        relationshipsFrom: {
          include: {
            relative: {
              select: {
                id: true,
                customerNumber: true,
                fullName: true,
                primaryPhone: true,
                primaryCategory: true,
              },
            },
          },
        },
      },
    });

    if (!customer || customer.isDeleted) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Branch Access Check
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      customer.branchId !== currentUser.branchId
    ) {
      throw new ForbiddenException(
        'Cross-branch customer access denied. You are only authorized to view customers in your assigned branch.',
      );
    }

    return customer;
  }

  /**
   * Updates customer profile with audit logging.
   */
  async updateCustomer(
    id: string,
    dto: UpdateCustomerDto,
    currentUser: AuthenticatedUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const existing = await this.getCustomerById(id, currentUser);

    const updated = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id },
        data: {
          fullName: dto.fullName?.trim(),
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          nationality: dto.nationality,
          primaryPhone: dto.primaryPhone?.trim(),
          whatsappNumber: dto.whatsappNumber?.trim() || null,
          email: dto.email?.trim().toLowerCase() || null,
          addressLine: dto.addressLine,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          primaryCategory: dto.primaryCategory,
          status: dto.status,
          notes: dto.notes,
        },
        include: {
          branch: true,
          assignedStaff: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          branchId: customer.branchId,
          action: 'CUSTOMER_UPDATED',
          entityType: 'CUSTOMER',
          entityId: customer.id,
          oldStateJson: {
            fullName: existing.fullName,
            primaryPhone: existing.primaryPhone,
            status: existing.status,
          },
          newStateJson: {
            fullName: customer.fullName,
            primaryPhone: customer.primaryPhone,
            status: customer.status,
          },
          ipAddress,
          userAgent,
        },
      });

      return customer;
    });

    return updated;
  }

  /**
   * Archives a customer record.
   */
  async archiveCustomer(
    id: string,
    currentUser: AuthenticatedUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const customer = await this.getCustomerById(id, currentUser);

    return prisma.$transaction(async (tx) => {
      const archived = await tx.customer.update({
        where: { id },
        data: {
          status: CustomerStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          branchId: customer.branchId,
          action: 'CUSTOMER_ARCHIVED',
          entityType: 'CUSTOMER',
          entityId: customer.id,
          ipAddress,
          userAgent,
        },
      });

      return archived;
    });
  }

  /**
   * Restores an archived customer record.
   */
  async restoreCustomer(
    id: string,
    currentUser: AuthenticatedUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const customer = await this.getCustomerById(id, currentUser);

    return prisma.$transaction(async (tx) => {
      const restored = await tx.customer.update({
        where: { id },
        data: {
          status: CustomerStatus.ACTIVE,
          archivedAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          branchId: customer.branchId,
          action: 'CUSTOMER_RESTORED',
          entityType: 'CUSTOMER',
          entityId: customer.id,
          ipAddress,
          userAgent,
        },
      });

      return restored;
    });
  }

  /**
   * Links family member or travel co-passenger.
   */
  async linkRelationship(
    customerId: string,
    relativeId: string,
    relationship: string,
    groupName?: string,
  ) {
    if (customerId === relativeId) {
      throw new BadRequestException('Cannot link a customer to themselves');
    }

    return prisma.customerRelationship.create({
      data: {
        customerId,
        relativeId,
        relationship: relationship.toUpperCase(),
        groupName: groupName?.trim() || null,
      },
    });
  }

  /**
   * Retrieves aggregated chronological activity timeline for a customer.
   */
  async getCustomerTimeline(id: string, currentUser: AuthenticatedUser) {
    const customer = await this.getCustomerById(id, currentUser);

    const [auditEvents, services, documents, bookings] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'CUSTOMER', entityId: id },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.customerService.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { customerId: id, isDeleted: false },
        select: { id: true, title: true, type: true, category: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.travelBooking.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format all events into a unified timeline array
    const timeline = [
      ...auditEvents.map((a) => ({
        id: a.id,
        type: 'AUDIT',
        title: a.action.replace(/_/g, ' '),
        description: `Triggered by user`,
        timestamp: a.timestamp.toISOString(),
      })),
      ...services.map((s) => ({
        id: s.id,
        type: 'SERVICE',
        title: s.serviceName,
        description: `Category: ${s.serviceCategory} | Status: ${s.status}`,
        timestamp: s.createdAt.toISOString(),
      })),
      ...documents.map((d) => ({
        id: d.id,
        type: 'DOCUMENT_UPLOAD',
        title: `Uploaded: ${d.title}`,
        description: `Type: ${d.type} (${d.category})`,
        timestamp: d.createdAt.toISOString(),
      })),
      ...bookings.map((b) => ({
        id: b.id,
        type: 'BOOKING',
        title: `Booking: ${b.bookingRef}`,
        description: b.airline ? `${b.airline} (${b.flightNumber || '-'})` : `Hotel: ${b.hotelName}`,
        timestamp: b.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      customerNumber: customer.customerNumber,
      fullName: customer.fullName,
      timeline,
    };
  }
}
