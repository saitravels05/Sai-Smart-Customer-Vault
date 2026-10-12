import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { prisma, hashSearchField, maskPassportNumber } from '@sai/database';
import {
  SmartSearchQueryDto,
  SmartSearchResultDto,
  SearchResultItem,
  UserRole,
} from '@sai/shared-types';
import { SearchIntentParser } from './search-intent-parser';

interface AuthUserContext {
  userId: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  /**
   * Execute multi-entity smart search with branch isolation and natural language intent
   */
  async executeSmartSearch(
    dto: SmartSearchQueryDto,
    user: AuthUserContext,
  ): Promise<SmartSearchResultDto> {
    const startTime = Date.now();
    const query = (dto.q || '').trim();

    // 1. Parse natural language query intent
    const intent = SearchIntentParser.parse(query);

    // 2. Resolve branch tenancy filter
    const targetBranchId = this.resolveBranchScope(user, dto.branchId, intent.detectedEntities.branchName);

    const items: SearchResultItem[] = [];
    const limit = Math.min(dto.limit || 25, 100);

    // 3. Branch filter condition for Prisma
    const customerBranchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // 4. Branch Lookup for branch names
    const branches = await prisma.branch.findMany({ select: { id: true, name: true, code: true } });
    const branchMap = new Map(branches.map((b) => [b.id, `${b.name} (${b.code})`]));

    // --- Search Strategy A: Passport Expiry Queries ---
    if (intent.detectedEntities.expiryDays) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + intent.detectedEntities.expiryDays);

      const expiringPassports = await prisma.passport.findMany({
        where: {
          expiryDate: {
            gte: now,
            lte: futureDate,
          },
          customer: {
            ...customerBranchWhere,
            isDeleted: false,
          },
        },
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, branchId: true },
          },
        },
        take: limit,
      });

      for (const p of expiringPassports) {
        const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        items.push({
          id: p.id,
          entityType: 'PASSPORT',
          title: `Passport: ${p.customer.fullName} (${p.customer.customerNumber})`,
          subtitle: `Expires in ${daysLeft} days • Valid until ${new Date(p.expiryDate).toISOString().split('T')[0]}`,
          snippet: `Issued at ${p.placeOfIssue || 'India'} (${p.nationality || 'Indian'}). Action recommended: Notify customer for renewal.`,
          customerId: p.customer.id,
          customerNumber: p.customer.customerNumber,
          branchId: p.customer.branchId,
          branchName: branchMap.get(p.customer.branchId) || 'Branch Office',
          relevanceScore: 0.95,
          deepLink: `/customers/${p.customer.id}?tab=travel`,
          metadata: {
            daysUntilExpiry: daysLeft,
            expiryDate: p.expiryDate,
          },
        });
      }
    }

    // --- Search Strategy B: Exact Passport Number Search (SHA-256 Hashed Lookup) ---
    if (intent.detectedEntities.passportNumber) {
      // Security check: Only STAFF, BRANCH_MANAGER, and SUPER_ADMIN can search passport numbers
      if (user.role === UserRole.READ_ONLY) {
        throw new ForbiddenException('READ_ONLY accounts are not authorized to perform raw passport number lookups.');
      }

      const pHash = hashSearchField(intent.detectedEntities.passportNumber);
      const passportMatches = await prisma.passport.findMany({
        where: {
          passportNumberHash: pHash,
          customer: {
            ...customerBranchWhere,
            isDeleted: false,
          },
        },
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, branchId: true },
          },
        },
      });

      for (const p of passportMatches) {
        items.push({
          id: p.id,
          entityType: 'PASSPORT',
          title: `Passport Record: ${maskPassportNumber(intent.detectedEntities.passportNumber!)} — ${p.customer.fullName}`,
          subtitle: `Customer: ${p.customer.customerNumber} • Nationality: ${p.nationality || 'Indian'}`,
          snippet: `Exact passport match. Valid until ${new Date(p.expiryDate).toISOString().split('T')[0]}.`,
          customerId: p.customer.id,
          customerNumber: p.customer.customerNumber,
          branchId: p.customer.branchId,
          branchName: branchMap.get(p.customer.branchId) || 'Branch Office',
          relevanceScore: 1.0,
          deepLink: `/customers/${p.customer.id}?tab=travel`,
        });
      }
    }

    // --- Search Strategy C: Destination / Visa Search ---
    if (intent.detectedEntities.destination) {
      const dest = intent.detectedEntities.destination;

      // 1. Search in Visas
      const visaMatches = await prisma.visa.findMany({
        where: {
          country: { contains: dest, mode: 'insensitive' },
          customer: {
            ...customerBranchWhere,
            isDeleted: false,
          },
        },
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, branchId: true },
          },
        },
        take: limit,
      });

      for (const v of visaMatches) {
        items.push({
          id: v.id,
          entityType: 'VISA',
          title: `${v.country} Visa (${v.visaType}): ${v.customer.fullName}`,
          subtitle: `Customer: ${v.customer.customerNumber} • Valid: ${v.validFrom ? new Date(v.validFrom).toISOString().split('T')[0] : 'N/A'} to ${new Date(v.validUntil).toISOString().split('T')[0]}`,
          snippet: `Status: ${v.status} • Entry: ${v.entryType}`,
          customerId: v.customer.id,
          customerNumber: v.customer.customerNumber,
          branchId: v.customer.branchId,
          branchName: branchMap.get(v.customer.branchId) || 'Branch Office',
          relevanceScore: 0.9,
          deepLink: `/customers/${v.customer.id}?tab=travel`,
        });
      }

      // 2. Search in Flight / Travel Bookings
      const bookingMatches = await prisma.travelBooking.findMany({
        where: {
          OR: [
            { destination: { contains: dest, mode: 'insensitive' } },
            { origin: { contains: dest, mode: 'insensitive' } },
          ],
          customer: {
            ...customerBranchWhere,
            isDeleted: false,
          },
        },
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, primaryPhone: true, branchId: true },
          },
        },
        take: limit,
      });

      for (const b of bookingMatches) {
        items.push({
          id: b.id,
          entityType: 'TRAVEL_BOOKING',
          title: `${b.bookingType}: ${b.origin} ➔ ${b.destination} (${b.customer.fullName})`,
          subtitle: `Booking Ref: ${b.bookingReference || 'N/A'} • Carrier: ${b.airlineOrCarrier || 'Scheduled Flight'}`,
          snippet: `Travel Date: ${b.travelDate ? new Date(b.travelDate).toISOString().split('T')[0] : 'TBD'} • Status: ${b.status}`,
          customerId: b.customer.id,
          customerNumber: b.customer.customerNumber,
          branchId: b.customer.branchId,
          branchName: branchMap.get(b.customer.branchId) || 'Branch Office',
          relevanceScore: 0.88,
          deepLink: `/customers/${b.customer.id}?tab=bookings`,
        });
      }
    }

    // --- Search Strategy D: Customer Name, Phone, and Customer Number Lookup ---
    const customerFilter: any = {
      ...customerBranchWhere,
      isDeleted: false,
      OR: [],
    };

    if (intent.detectedEntities.customerNumber) {
      customerFilter.OR.push({
        customerNumber: { contains: intent.detectedEntities.customerNumber, mode: 'insensitive' },
      });
    }

    if (intent.detectedEntities.phone) {
      customerFilter.OR.push(
        { primaryPhone: { contains: intent.detectedEntities.phone } },
        { whatsappNumber: { contains: intent.detectedEntities.phone } },
      );
    }

    if (intent.detectedEntities.customerName) {
      customerFilter.OR.push({
        fullName: { contains: intent.detectedEntities.customerName, mode: 'insensitive' },
      });
    }

    // If query was not an expiry or destination query, or we want broad text match
    if (customerFilter.OR.length > 0) {
      const customers = await prisma.customer.findMany({
        where: customerFilter,
        take: limit,
        orderBy: { registeredAt: 'desc' },
      });

      for (const c of customers) {
        items.push({
          id: c.id,
          entityType: 'CUSTOMER',
          title: `${c.fullName} (${c.customerNumber})`,
          subtitle: `${c.city || 'Tamil Nadu'} • Primary Contact: ${c.primaryPhone}`,
          snippet: `Service: ${c.primaryCategory} • Status: ${c.status}. Registered on ${new Date(c.registeredAt).toISOString().split('T')[0]}.`,
          customerId: c.id,
          customerNumber: c.customerNumber,
          branchId: c.branchId,
          branchName: branchMap.get(c.branchId) || 'Branch Office',
          relevanceScore: 0.92,
          deepLink: `/customers/${c.id}`,
        });
      }
    }

    // --- Search Strategy E: Document & Upload Search ---
    const docWhere: any = {
      isCurrentVersion: true,
      customer: {
        ...customerBranchWhere,
        isDeleted: false,
      },
    };

    if (dto.documentType || intent.detectedEntities.documentType) {
      docWhere.documentType = dto.documentType || intent.detectedEntities.documentType;
    }

    if (intent.detectedEntities.dateRange) {
      docWhere.createdAt = {};
      if (intent.detectedEntities.dateRange.from) {
        docWhere.createdAt.gte = new Date(intent.detectedEntities.dateRange.from);
      }
      if (intent.detectedEntities.dateRange.to) {
        docWhere.createdAt.lte = new Date(intent.detectedEntities.dateRange.to);
      }
    }

    // Keyword match on document title
    if (query && !intent.detectedEntities.expiryDays && !intent.detectedEntities.passportNumber) {
      docWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ];
    }

    if (intent.detectedEntities.documentType || intent.detectedEntities.dateRange || (query && items.length < 5)) {
      const docs = await prisma.document.findMany({
        where: docWhere,
        include: {
          customer: {
            select: { id: true, fullName: true, customerNumber: true, branchId: true },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      for (const d of docs) {
        items.push({
          id: d.id,
          entityType: 'DOCUMENT',
          title: `${d.title} [${d.documentType}]`,
          subtitle: `Customer: ${d.customer.fullName} (${d.customer.customerNumber}) • Size: ${(Number(d.fileSizeBytes) / 1024).toFixed(1)} KB`,
          snippet: `Category: ${d.category} • Uploaded on ${new Date(d.createdAt).toISOString().split('T')[0]}`,
          customerId: d.customer.id,
          customerNumber: d.customer.customerNumber,
          branchId: d.customer.branchId,
          branchName: branchMap.get(d.customer.branchId) || 'Branch Office',
          relevanceScore: 0.85,
          deepLink: `/customers/${d.customer.id}?tab=documents`,
        });
      }
    }

    // Remove duplicates by entity ID
    const uniqueItems = Array.from(new Map(items.map((item) => [item.id, item])).values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // 5. Asynchronous Audit Log for Compliance & DPDPA
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          branchId: user.branchId,
          action: 'SMART_SEARCH_EXECUTED',
          entityType: 'SEARCH_QUERY',
          entityId: query.slice(0, 100),
          newStateJson: {
            query,
            intent: intent.intentType,
            resultsCount: uniqueItems.length,
            targetBranchId: targetBranchId || 'ALL',
          },
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to create search audit log: ${auditErr.message}`);
    }

    return {
      query,
      interpretedIntent: intent,
      totalCount: uniqueItems.length,
      items: uniqueItems,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Enforce tenant branch rules: Super Admin can query across all or filter specific branch.
   * Other staff can only ever query their assigned branch.
   */
  private resolveBranchScope(
    user: AuthUserContext,
    requestedBranchId?: string,
    parsedBranchName?: string,
  ): string | undefined {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (requestedBranchId) return requestedBranchId;
      // If natural language specified branch (e.g., "Madurai" or "Trichy"), resolve branch ID
      if (parsedBranchName) {
        // Will be filtered or queried in memory/subqueries if provided
      }
      return undefined; // All branches
    }

    // Branch Manager or Staff must be restricted to their own branch
    if (requestedBranchId && requestedBranchId !== user.branchId) {
      throw new ForbiddenException('Access denied: Staff cannot query customer records of another branch.');
    }

    return user.branchId;
  }
}
