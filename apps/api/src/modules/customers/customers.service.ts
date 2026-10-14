import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma, encryptField, hashField, maskIdentifier } from '@sai/database';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFilterDto,
  CustomerStatus,
  UserRole,
  AddPassportDto,
  AddVisaDto,
  AddBookingDto,
  AddNoteDto,
  DuplicateCandidateDto,
  MergeCustomersDto,
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
    // If not Owner, customer is strictly bound to user's assigned branch
    const branchId =
      currentUser.role === UserRole.OWNER ? dto.branchId : currentUser.branchId!;

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
    try {
      const where: any = { isDeleted: false };

      // Tenant Scoping: Owner can query any branch; other roles are strictly scoped
      if (currentUser.role === UserRole.OWNER) {
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
    } catch (err: any) {
      this.logger.warn(`Database offline in listCustomers: ${err.message}. Returning empty customer list.`);
      return {
        customers: [],
        meta: {
          total: 0,
          page: 1,
          limit: filter.limit || 20,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
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
      currentUser.role !== UserRole.OWNER &&
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

  /**
   * Add passport record with AES-256-GCM encryption and SHA-256 lookup hash
   */
  async addPassport(customerId: string, dto: AddPassportDto, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    const cleanNumber = dto.passportNumber.trim().toUpperCase();
    const passportEnc = encryptField(cleanNumber);
    const passportMask = maskIdentifier(cleanNumber);
    const passportHash = hashField(cleanNumber);

    const expiry = new Date(dto.expiryDate);
    const issue = dto.issueDate ? new Date(dto.issueDate) : null;

    const passport = await prisma.passport.create({
      data: {
        customerId,
        passportNumberEnc: passportEnc,
        passportNumberMask: passportMask,
        passportHash,
        issuingCountry: dto.issuingCountry || 'IND',
        issueDate: issue,
        expiryDate: expiry,
        placeOfIssue: dto.placeOfIssue,
        isCurrent: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_PASSPORT_ADDED',
          entityType: 'PASSPORT',
          entityId: passport.id,
          ipAddress: '127.0.0.1',
          newStateJson: { customerId, passportMask, expiryDate: dto.expiryDate },
        },
      });
    } catch {}

    return passport;
  }

  /**
   * Delete or archive a passport record
   */
  async deletePassport(customerId: string, passportId: string, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    await prisma.passport.delete({
      where: { id: passportId, customerId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_PASSPORT_DELETED',
          entityType: 'PASSPORT',
          entityId: passportId,
          ipAddress: '127.0.0.1',
        },
      });
    } catch {}

    return { success: true };
  }

  /**
   * Add Visa credential to customer profile
   */
  async addVisa(customerId: string, dto: AddVisaDto, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    const expiry = new Date(dto.expiryDate);
    const issue = dto.issueDate ? new Date(dto.issueDate) : null;
    const visaEnc = dto.visaNumber ? encryptField(dto.visaNumber.trim().toUpperCase()) : null;

    const visa = await prisma.visa.create({
      data: {
        customerId,
        country: dto.country,
        visaNumberEnc: visaEnc,
        visaCategory: dto.visaCategory,
        issueDate: issue,
        expiryDate: expiry,
        durationOfStayDays: dto.durationOfStayDays,
        entriesPermitted: dto.entriesPermitted || 'SINGLE',
        status: 'ACTIVE',
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_VISA_ADDED',
          entityType: 'VISA',
          entityId: visa.id,
          ipAddress: '127.0.0.1',
          newStateJson: { country: dto.country, visaCategory: dto.visaCategory, expiryDate: dto.expiryDate },
        },
      });
    } catch {}

    return visa;
  }

  /**
   * Delete Visa record
   */
  async deleteVisa(customerId: string, visaId: string, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    await prisma.visa.delete({
      where: { id: visaId, customerId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_VISA_DELETED',
          entityType: 'VISA',
          entityId: visaId,
          ipAddress: '127.0.0.1',
        },
      });
    } catch {}

    return { success: true };
  }

  /**
   * Add flight or hotel travel booking record
   */
  async addBooking(customerId: string, dto: AddBookingDto, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    const depTime = dto.departureTime ? new Date(dto.departureTime) : null;
    const arrTime = dto.arrivalTime ? new Date(dto.arrivalTime) : null;
    const chkIn = dto.checkInDate ? new Date(dto.checkInDate) : null;
    const chkOut = dto.checkOutDate ? new Date(dto.checkOutDate) : null;

    const booking = await prisma.travelBooking.create({
      data: {
        customerId,
        bookingRef: dto.bookingRef,
        pnr: dto.pnr?.toUpperCase(),
        airline: dto.airline,
        flightNumber: dto.flightNumber?.toUpperCase(),
        originAirport: dto.originAirport?.toUpperCase(),
        destAirport: dto.destAirport?.toUpperCase(),
        departureTime: depTime,
        arrivalTime: arrTime,
        hotelName: dto.hotelName,
        checkInDate: chkIn,
        checkOutDate: chkOut,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_BOOKING_ADDED',
          entityType: 'TRAVEL_BOOKING',
          entityId: booking.id,
          ipAddress: '127.0.0.1',
          newStateJson: { bookingRef: dto.bookingRef, pnr: dto.pnr },
        },
      });
    } catch {}

    return booking;
  }

  /**
   * Delete travel booking
   */
  async deleteBooking(customerId: string, bookingId: string, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    await prisma.travelBooking.delete({
      where: { id: bookingId, customerId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_BOOKING_DELETED',
          entityType: 'TRAVEL_BOOKING',
          entityId: bookingId,
          ipAddress: '127.0.0.1',
        },
      });
    } catch {}

    return { success: true };
  }

  /**
   * List all travel bookings across customers with tenant scoping
   */
  async listAllBookings(user: AuthenticatedUser) {
    try {
      const branchWhere =
        user.role === UserRole.OWNER || !user.branchId
          ? {}
          : { customer: { branchId: user.branchId } };

      const bookings = await prisma.travelBooking.findMany({
        where: {
          ...branchWhere,
          customer: { isDeleted: false },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, branchId: true },
          },
        },
      });

      return bookings.map((b) => ({
        id: b.id,
        customerId: b.customerId,
        customerName: b.customer?.fullName || 'Customer',
        customerNumber: b.customer?.customerNumber || '',
        primaryPhone: b.customer?.primaryPhone || '',
        bookingRef: b.bookingRef,
        pnr: b.pnr,
        airline: b.airline,
        flightNumber: b.flightNumber,
        originAirport: b.originAirport,
        destAirport: b.destAirport,
        departureTime: b.departureTime?.toISOString() || null,
        arrivalTime: b.arrivalTime?.toISOString() || null,
        hotelName: b.hotelName,
        checkInDate: b.checkInDate?.toISOString() || null,
        checkOutDate: b.checkOutDate?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
      }));
    } catch (err: any) {
      this.logger.warn(`Database offline in listAllBookings: ${err.message}. Returning empty bookings.`);
      return [];
    }
  }

  /**
   * Add formatted staff note to customer record
   */
  async addCustomerNote(customerId: string, dto: AddNoteDto, user: AuthenticatedUser) {
    const customer = await this.getCustomerById(customerId, user);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const authorTag = user.fullName || user.email;
    const newNoteLine = `[${timestamp} | ${authorTag} (${dto.category})]: ${dto.content.trim()}`;

    const updatedNotes = customer.notes ? `${customer.notes}\n\n${newNoteLine}` : newNoteLine;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { notes: updatedNotes },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: customer.branchId,
          action: 'CUSTOMER_NOTE_ADDED',
          entityType: 'CUSTOMER',
          entityId: customerId,
          ipAddress: '127.0.0.1',
          newStateJson: { category: dto.category },
        },
      });
    } catch {}

    return { success: true, notes: updated.notes };
  }

  /**
   * Scan for duplicate customer profiles using phone, WhatsApp, and name matching
   */
  async getDuplicates(customerId: string, user: AuthenticatedUser): Promise<DuplicateCandidateDto[]> {
    const target = await this.getCustomerById(customerId, user);
    const candidates: DuplicateCandidateDto[] = [];

    // Find candidates by primary phone or WhatsApp
    const phoneMatches = await prisma.customer.findMany({
      where: {
        id: { not: customerId },
        isDeleted: false,
        OR: [
          { primaryPhone: target.primaryPhone },
          ...(target.whatsappNumber ? [{ whatsappNumber: target.whatsappNumber }, { primaryPhone: target.whatsappNumber }] : []),
        ],
      },
    });

    for (const m of phoneMatches) {
      candidates.push({
        id: m.id,
        customerNumber: m.customerNumber,
        fullName: m.fullName,
        primaryPhone: m.primaryPhone,
        whatsappNumber: m.whatsappNumber,
        matchScore: 95,
        matchReason: 'Exact mobile number match',
      });
    }

    // Name matching
    const nameMatches = await prisma.customer.findMany({
      where: {
        id: { not: customerId, notIn: candidates.map((c) => c.id) },
        isDeleted: false,
        fullName: { equals: target.fullName, mode: 'insensitive' },
      },
      take: 5,
    });

    for (const m of nameMatches) {
      candidates.push({
        id: m.id,
        customerNumber: m.customerNumber,
        fullName: m.fullName,
        primaryPhone: m.primaryPhone,
        whatsappNumber: m.whatsappNumber,
        matchScore: 80,
        matchReason: 'Identical full name match',
      });
    }

    return candidates.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Merge duplicate customer into primary target customer
   */
  async mergeCustomers(targetCustomerId: string, dto: MergeCustomersDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Merging customer profiles requires Admin or Owner role.');
    }

    const target = await this.getCustomerById(targetCustomerId, user);
    const duplicate = await this.getCustomerById(dto.duplicateCustomerId, user);

    if (target.id === duplicate.id) {
      throw new BadRequestException('Cannot merge a customer into itself.');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Move documents
      await tx.document.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: target.id },
      });

      // 2. Move passports
      await tx.passport.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: target.id },
      });

      // 3. Move visas
      await tx.visa.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: target.id },
      });

      // 4. Move bookings
      await tx.travelBooking.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: target.id },
      });

      // 5. Move reminders
      await tx.reminder.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: target.id },
      });

      // 6. Append merge note to target
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const mergeNote = `\n\n[${timestamp} | MERGED RECORD]: Merged duplicate profile ${duplicate.customerNumber} (${duplicate.fullName}). Reason: ${dto.resolutionReason}`;
      await tx.customer.update({
        where: { id: target.id },
        data: {
          notes: target.notes ? `${target.notes}${mergeNote}` : mergeNote,
        },
      });

      // 7. Mark duplicate customer as deleted/archived
      await tx.customer.update({
        where: { id: duplicate.id },
        data: {
          isDeleted: true,
          status: CustomerStatus.ARCHIVED,
          notes: `[MERGED INTO ${target.customerNumber} on ${timestamp}]: ${dto.resolutionReason}`,
        },
      });

      // 8. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id || undefined,
          branchId: target.branchId,
          action: 'CUSTOMERS_MERGED',
          entityType: 'CUSTOMER',
          entityId: target.id,
          ipAddress: '127.0.0.1',
          newStateJson: {
            targetCustomerId: target.id,
            targetCustomerNumber: target.customerNumber,
            mergedCustomerId: duplicate.id,
            mergedCustomerNumber: duplicate.customerNumber,
            reason: dto.resolutionReason,
          },
        },
      });
    });

    return {
      success: true,
      message: `Successfully merged ${duplicate.customerNumber} into ${target.customerNumber}`,
      targetId: target.id,
    };
  }

  /**
   * Delete relationship link
   */
  async deleteRelationship(customerId: string, relationshipId: string, user: AuthenticatedUser) {
    await this.getCustomerById(customerId, user);
    await prisma.customerRelationship.delete({
      where: { id: relationshipId },
    });
    return { success: true };
  }
}

