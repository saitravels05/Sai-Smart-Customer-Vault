export interface ExecutiveDashboardKpisDto {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  totalDocuments: number;
  pendingAiDocuments: number;
  expiringPassports180Days: number;
  expiringVisas90Days: number;
  upcomingTravelDepartures: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  activeBranchesCount: number;
}

export interface MonthlyRegistrationStat {
  month: string;
  count: number;
}

export interface ServiceCategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface BranchActivityStat {
  branchId: string;
  branchName: string;
  branchCode: string;
  customerCount: number;
  documentCount: number;
}

export interface DocumentTypeStat {
  type: string;
  count: number;
}

export interface ExpiryUrgencyStat {
  critical7d: number;
  urgent30d: number;
  warning180d: number;
  expired: number;
}

export interface RepeatCustomerStat {
  singleServiceCount: number;
  multiServiceCount: number;
  repeatCustomerRate: number; // e.g. 28.5%
}

export interface DashboardAnalyticsDto {
  kpis: ExecutiveDashboardKpisDto;
  monthlyRegistrations: MonthlyRegistrationStat[];
  serviceCategoryBreakdown: ServiceCategoryStat[];
  branchActivity: BranchActivityStat[];
  documentTypeBreakdown: DocumentTypeStat[];
  expiryUrgencyBreakdown: ExpiryUrgencyStat;
  repeatCustomerStats: RepeatCustomerStat;
}
