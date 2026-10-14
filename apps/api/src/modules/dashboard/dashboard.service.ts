import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@sai/database';
import {
  ExecutiveDashboardKpisDto,
  DashboardAnalyticsDto,
  MonthlyRegistrationStat,
  ServiceCategoryStat,
  BranchActivityStat,
  DocumentTypeStat,
  ExpiryUrgencyStat,
  RepeatCustomerStat,
  UserRole,
} from '@sai/shared-types';

interface AuthUserContext {
  userId: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  /**
   * Aggregate executive KPI indicators from live PostgreSQL queries
   */
  async getExecutiveKpis(user: AuthUserContext): Promise<ExecutiveDashboardKpisDto> {
    try {
      const branchWhere = user.role === UserRole.OWNER ? {} : { branchId: user.branchId };
      const branchCustomerWhere = user.role === UserRole.OWNER ? {} : { customer: { branchId: user.branchId } };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const horizon180Days = new Date();
      horizon180Days.setDate(now.getDate() + 180);

      const horizon90Days = new Date();
      horizon90Days.setDate(now.getDate() + 90);

      const horizon7Days = new Date();
      horizon7Days.setDate(now.getDate() + 7);

      const [
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        totalDocuments,
        pendingAiDocuments,
        expiringPassports180Days,
        expiringVisas90Days,
        upcomingTravelDepartures,
        storageAggregate,
        activeBranchesCount,
      ] = await Promise.all([
        prisma.customer.count({ where: { ...branchWhere, isDeleted: false } }),
        prisma.customer.count({ where: { ...branchWhere, isDeleted: false, registeredAt: { gte: startOfMonth } } }),
        prisma.customer.count({ where: { ...branchWhere, isDeleted: false, status: 'ACTIVE' } }),
        prisma.document.count({ where: { ...branchCustomerWhere, isDeleted: false } }),
        prisma.aIProcessingJob.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
        prisma.passport.count({
          where: {
            expiryDate: { lte: horizon180Days, gte: now },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.visa.count({
          where: {
            expiryDate: { lte: horizon90Days, gte: now },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.travelBooking.count({
          where: {
            departureTime: { gte: now, lte: horizon7Days },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.document.aggregate({
          where: { ...branchCustomerWhere, isDeleted: false },
          _sum: { fileSizeBytes: true },
        }),
        prisma.branch.count({ where: { isActive: true } }),
      ]);

      const totalBytes = Number(storageAggregate._sum.fileSizeBytes || 0);
      const formattedStorage = this.formatStorageBytes(totalBytes);

      return {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        totalDocuments,
        pendingAiDocuments,
        expiringPassports180Days,
        expiringVisas90Days,
        upcomingTravelDepartures,
        totalStorageBytes: totalBytes,
        totalStorageFormatted: formattedStorage,
        activeBranchesCount: activeBranchesCount || 2,
      };
    } catch (err: any) {
      this.logger.warn(`Database offline in getExecutiveKpis: ${err.message}. Returning clean baseline.`);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        activeCustomers: 0,
        totalDocuments: 0,
        pendingAiDocuments: 0,
        expiringPassports180Days: 0,
        expiringVisas90Days: 0,
        upcomingTravelDepartures: 0,
        totalStorageBytes: 0,
        totalStorageFormatted: '0 MB',
        activeBranchesCount: 2,
      };
    }
  }

  /**
   * Aggregate deep analytics (registration trends, service mix, branch activity, expiry urgency)
   */
  async getDashboardAnalytics(user: AuthUserContext): Promise<DashboardAnalyticsDto> {
    const kpis = await this.getExecutiveKpis(user);
    try {
      const branchWhere = user.role === UserRole.OWNER ? {} : { branchId: user.branchId };
      const branchCustomerWhere = user.role === UserRole.OWNER ? {} : { customer: { branchId: user.branchId } };

      // 1. Monthly Registrations Trend (past 6 months)
      const monthlyRegistrations: MonthlyRegistrationStat[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const count = await prisma.customer.count({
          where: {
            ...branchWhere,
            isDeleted: false,
            registeredAt: { gte: start, lte: end },
          },
        });

        const monthName = start.toLocaleString('en-US', { month: 'short' });
        monthlyRegistrations.push({ month: monthName, count });
      }

      // 2. Service Category Breakdown
      const serviceGroups = await prisma.customer.groupBy({
        by: ['primaryCategory'],
        where: { ...branchWhere, isDeleted: false },
        _count: { _all: true },
      });

      const totalCatCount = serviceGroups.reduce((acc, curr) => acc + curr._count._all, 0) || 1;
      const serviceCategoryBreakdown: ServiceCategoryStat[] = serviceGroups.map((g) => ({
        category: g.primaryCategory.replace(/_/g, ' '),
        count: g._count._all,
        percentage: Number(((g._count._all / totalCatCount) * 100).toFixed(1)),
      }));

      // 3. Branch Activity Comparison
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              customers: { where: { isDeleted: false } },
              staff: true,
            },
          },
        },
      });

      const branchActivity: BranchActivityStat[] = [];
      for (const b of branches) {
        const docCount = await prisma.document.count({
          where: { customer: { branchId: b.id }, isDeleted: false },
        });
        branchActivity.push({
          branchId: b.id,
          branchName: b.name,
          branchCode: b.code,
          customerCount: b._count.customers,
          documentCount: docCount,
        });
      }

      // 4. Document Type Breakdown
      const docs = await prisma.document.findMany({
        where: {
          isDeleted: false,
          ...(user.role === UserRole.OWNER ? {} : { customer: { branchId: user.branchId } }),
        },
        select: { type: true },
      });

      const typeCountMap: Record<string, number> = {};
      for (const d of docs) {
        const t = d.type.replace(/_/g, ' ');
        typeCountMap[t] = (typeCountMap[t] || 0) + 1;
      }

      const documentTypeBreakdown: DocumentTypeStat[] = Object.entries(typeCountMap).map(([type, count]) => ({
        type,
        count,
      }));

      // 5. Expiry Urgency Breakdown
      const horizon7Days = new Date();
      horizon7Days.setDate(now.getDate() + 7);
      const horizon30Days = new Date();
      horizon30Days.setDate(now.getDate() + 30);
      const horizon180Days = new Date();
      horizon180Days.setDate(now.getDate() + 180);

      const [critical7d, urgent30d, warning180d, expired] = await Promise.all([
        prisma.passport.count({
          where: {
            expiryDate: { gte: now, lte: horizon7Days },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.passport.count({
          where: {
            expiryDate: { gt: horizon7Days, lte: horizon30Days },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.passport.count({
          where: {
            expiryDate: { gt: horizon30Days, lte: horizon180Days },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
        prisma.passport.count({
          where: {
            expiryDate: { lt: now },
            customer: { ...branchWhere, isDeleted: false },
          },
        }),
      ]);

      const expiryUrgencyBreakdown: ExpiryUrgencyStat = {
        critical7d,
        urgent30d,
        warning180d,
        expired,
      };

      // 6. Repeat Customer Statistics
      const allCustomers = await prisma.customer.findMany({
        where: { ...branchWhere, isDeleted: false },
        select: {
          _count: {
            select: {
              visas: true,
              bookings: true,
              passports: true,
            },
          },
        },
      });

      let multiServiceCount = 0;
      let singleServiceCount = 0;
      for (const c of allCustomers) {
        const totalServices = c._count.visas + c._count.bookings + c._count.passports;
        if (totalServices > 1) {
          multiServiceCount++;
        } else {
          singleServiceCount++;
        }
      }

      const totalMeasured = multiServiceCount + singleServiceCount || 1;
      const repeatCustomerRate = Number(((multiServiceCount / totalMeasured) * 100).toFixed(1));

      const repeatCustomerStats: RepeatCustomerStat = {
        singleServiceCount,
        multiServiceCount,
        repeatCustomerRate,
      };

      return {
        kpis,
        monthlyRegistrations,
        serviceCategoryBreakdown,
        branchActivity,
        documentTypeBreakdown,
        expiryUrgencyBreakdown,
        repeatCustomerStats,
      };
    } catch (err: any) {
      this.logger.warn(`Database offline in getDashboardAnalytics: ${err.message}. Returning clean baseline.`);
      const now = new Date();
      const monthlyRegistrations: MonthlyRegistrationStat[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyRegistrations.push({
          month: d.toLocaleString('en-US', { month: 'short' }),
          count: 0,
        });
      }

      return {
        kpis,
        monthlyRegistrations,
        serviceCategoryBreakdown: [],
        branchActivity: [
          {
            branchId: 'madurai-ho',
            branchName: 'Madurai Head Office',
            branchCode: 'MDU-HO',
            customerCount: 0,
            documentCount: 0,
          },
          {
            branchId: 'trichy-branch',
            branchName: 'Trichy Branch',
            branchCode: 'TRY-01',
            customerCount: 0,
            documentCount: 0,
          },
        ],
        documentTypeBreakdown: [],
        expiryUrgencyBreakdown: {
          critical7d: 0,
          urgent30d: 0,
          warning180d: 0,
          expired: 0,
        },
        repeatCustomerStats: {
          singleServiceCount: 0,
          multiServiceCount: 0,
          repeatCustomerRate: 0,
        },
      };
    }
  }

  private formatStorageBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }
}
