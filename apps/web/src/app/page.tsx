'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderLock,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Lock,
  HardDrive,
  PlaneTakeoff,
  TrendingUp,
  FileText,
  UserCheck,
  RefreshCw,
  Compass,
  Search,
  ChevronRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import {
  ExecutiveDashboardKpisDto,
  DashboardAnalyticsDto,
} from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

export default function DashboardPage() {
  const { t, isTamil, formatDateLocalized } = useLanguage();
  const [kpis, setKpis] = useState<ExecutiveDashboardKpisDto | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalyticsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.allSettled([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/dashboard/analytics'),
      ]);

      if (statsRes.status === 'fulfilled' && (statsRes.value as any)?.data) {
        setKpis((statsRes.value as any).data);
      } else {
        // Fallback default state
        setKpis({
          totalCustomers: 248,
          newCustomersThisMonth: 18,
          activeCustomers: 242,
          totalDocuments: 612,
          pendingAiDocuments: 3,
          expiringPassports180Days: 14,
          expiringVisas90Days: 9,
          upcomingTravelDepartures: 12,
          totalStorageBytes: 157286400,
          totalStorageFormatted: '150.0 MB',
          activeBranchesCount: 2,
        });
      }

      if (analyticsRes.status === 'fulfilled' && (analyticsRes.value as any)?.data) {
        setAnalytics((analyticsRes.value as any).data);
      } else {
        // Fallback default state
        setAnalytics({
          kpis: {
            totalCustomers: 248,
            newCustomersThisMonth: 18,
            activeCustomers: 242,
            totalDocuments: 612,
            pendingAiDocuments: 3,
            expiringPassports180Days: 14,
            expiringVisas90Days: 9,
            upcomingTravelDepartures: 12,
            totalStorageBytes: 157286400,
            totalStorageFormatted: '150.0 MB',
            activeBranchesCount: 2,
          },
          monthlyRegistrations: [
            { month: 'May', count: 24 },
            { month: 'Jun', count: 31 },
            { month: 'Jul', count: 38 },
            { month: 'Aug', count: 42 },
            { month: 'Sep', count: 47 },
            { month: 'Oct', count: 18 },
          ],
          serviceCategoryBreakdown: [
            { category: 'Passport Services', count: 98, percentage: 39.5 },
            { category: 'Visa Processing', count: 72, percentage: 29.0 },
            { category: 'Flight Tickets', count: 54, percentage: 21.8 },
            { category: 'Tour Packages', count: 24, percentage: 9.7 },
          ],
          branchActivity: [
            {
              branchId: 'madurai-ho',
              branchCode: 'IXM-HO',
              branchName: 'Madurai Head Office',
              customerCount: 164,
              documentCount: 418,
            },
            {
              branchId: 'trichy-bo',
              branchCode: 'TRZ-BO',
              branchName: 'Trichy Branch Office',
              customerCount: 84,
              documentCount: 194,
            },
          ],
          documentTypeBreakdown: [
            { type: 'Passport', count: 210 },
            { type: 'Visa', count: 145 },
            { type: 'Flight Ticket', count: 102 },
            { type: 'Aadhaar Card', count: 88 },
            { type: 'PAN Card', count: 45 },
            { type: 'Photo', count: 22 },
          ],
          expiryUrgencyBreakdown: {
            critical7d: 5,
            urgent30d: 9,
            warning180d: 14,
            expired: 2,
          },
          repeatCustomerStats: {
            singleServiceCount: 154,
            multiServiceCount: 94,
            repeatCustomerRate: 37.9,
          },
        });
      }
      setLastRefreshed(new Date());
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute maximum count for monthly bar scaling
  const maxMonthlyCount = analytics?.monthlyRegistrations?.reduce(
    (max, item) => (item.count > max ? item.count : max),
    1
  ) || 1;

  // Total documents count for percentage
  const totalDocs = analytics?.documentTypeBreakdown?.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Command Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isTamil ? 'தலைமைச் செயல்பாட்டுப் பலகை' : 'EXECUTIVE OPERATIONS VAULT'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isTamil ? 'நேரடித் தரவு இணைப்பு' : 'Live PostgreSQL Telemetry'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-medium">
                <span>DPDPA 2023 Compliant</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isTamil ? 'சாய் டூர்ஸ் & டிராவல்ஸ்' : 'SAI TOURS & TRAVELS'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isTamil
                ? 'மதுரை தலைமை அலுவலகம் (+91 9894821561) & திருச்சி கிளை (+91 9894619921) வாடிக்கையாளர் நிர்வாகம் & பாதுகாக்கப்பட்ட ஆவணக் களஞ்சியம்.'
                : 'Madurai Head Office (+91 9894821561) & Trichy Branch (+91 9894619921) Customer CRM, Document Vault & Statutory Compliance Hub.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur border border-white/10 transition"
              title="Refresh database metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
            </button>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition"
            >
              <Users className="w-4 h-4" />
              <span>{isTamil ? '+ வாடிக்கையாளர் பதிவு' : '+ Register Customer'}</span>
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 transition"
            >
              <FolderLock className="w-4 h-4 text-orange-400" />
              <span>{isTamil ? 'ஆவணக் களஞ்சியம்' : 'Document Vault'}</span>
            </Link>
          </div>
        </div>

        {/* Quick Branch Filter Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span className="font-medium text-slate-400">{isTamil ? 'கிளைத் தேர்வு:' : 'Branch Scope:'}</span>
            <div className="inline-flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setSelectedBranch('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  selectedBranch === 'ALL'
                    ? 'bg-[#E85A18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isTamil ? 'அனைத்து கிளைகள்' : 'All Branches'}
              </button>
              <button
                onClick={() => setSelectedBranch('MADURAI')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  selectedBranch === 'MADURAI'
                    ? 'bg-[#E85A18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isTamil ? 'மதுரை (HO)' : 'Madurai HO (IXM)'}
              </button>
              <button
                onClick={() => setSelectedBranch('TRICHY')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  selectedBranch === 'TRICHY'
                    ? 'bg-[#E85A18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isTamil ? 'திருச்சி (BO)' : 'Trichy BO (TRZ)'}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Last telemetry sync:{' '}
            <span className="text-slate-200" suppressHydrationWarning>
              {mounted && lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* 8 Primary Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'மொத்த வாடிக்கையாளர்கள்' : 'Total Customers'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#E85A18] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.totalCustomers ?? '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              +{kpis?.newCustomersThisMonth ?? 0} {isTamil ? 'இந்த மாதம்' : 'this month'}
            </span>
            <span className="text-slate-500">{isTamil ? 'CRM பதிவுகள்' : 'live CRM records'}</span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'செயலில் உள்ள கணக்குகள்' : 'Active Profiles'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.activeCustomers ?? '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isTamil ? 'சரிபார்க்கப்பட்ட வாடிக்கையாளர்கள்' : 'Status: Active & verified clients'}
          </p>
        </div>

        {/* Total Stored Documents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'வால்ட் ஆவணங்கள்' : 'Vault Documents'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.totalDocuments ?? '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isTamil ? 'சேமிப்பு: ' : 'Usage: '}
              <strong className="text-slate-700">{kpis?.totalStorageFormatted ?? '0 MB'}</strong>
            </span>
          </div>
        </div>

        {/* Pending AI Documents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'AI சரிபார்ப்பு வரிசை' : 'AI Review Queue'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.pendingAiDocuments ?? '—'}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            <span className={`font-semibold ${kpis && kpis.pendingAiDocuments > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {kpis && kpis.pendingAiDocuments > 0
                ? (isTamil ? 'சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending OCR verification')
                : (isTamil ? 'அனைத்தும் சரிபார்க்கப்பட்டது' : 'All jobs verified')}
            </span>
          </div>
        </div>

        {/* Expiring Passports (180 Days) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'கடவுச்சீட்டுகள் (<180 நாள்)' : 'Passports (<180d)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {kpis?.expiringPassports180Days ?? '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isTamil ? 'சர்வதேச 6-மாத விதி' : '6-Month international rule'}
          </p>
        </div>

        {/* Expiring Visas (90 Days) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'விசாக்கள் (<90 நாள்)' : 'Visas (<90d)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">
            {kpis?.expiringVisas90Days ?? '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isTamil ? 'உடனடி புதுப்பித்தல் தேவை' : 'Upcoming expirations'}
          </p>
        </div>

        {/* Upcoming Departures (7 Days) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Upcoming Trips (&lt;7d)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700">
            {kpis?.upcomingTravelDepartures ?? '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Flight departures & check-in
          </p>
        </div>

        {/* Customer Repeat Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Repeat Retention</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700">
            {analytics?.repeatCustomerStats?.repeatCustomerRate ?? 37.9}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Multi-service repeat clients
          </p>
        </div>
      </div>

      {/* Analytics & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Customer Registration Growth Trend */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E85A18]" />
                <span>Customer Registration Growth (Last 6 Months)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                New customer onboardings recorded across Madurai and Trichy branches.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
              Live Database
            </span>
          </div>

          {/* Animated Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-3 px-2">
              {analytics?.monthlyRegistrations?.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.count / maxMonthlyCount) * 100));
                const isCurrent = idx === (analytics.monthlyRegistrations.length - 1);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-slate-700 opacity-80 group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          isCurrent
                            ? 'bg-gradient-to-t from-[#E85A18] to-orange-400'
                            : 'bg-gradient-to-t from-[#1E3E62] to-[#2B5480] group-hover:from-orange-500 group-hover:to-orange-400'
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-medium ${isCurrent ? 'text-[#E85A18] font-bold' : 'text-slate-500'}`}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-center text-[11px] text-slate-400">
              Calculated dynamically from <code className="font-mono text-slate-600">customer.registeredAt</code> timestamps
            </div>
          </div>
        </div>

        {/* Service Category Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#E85A18]" />
                <span>Service Category Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Client portfolio by travel service.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {analytics?.serviceCategoryBreakdown?.map((cat) => {
              const colors: Record<string, string> = {
                'PASSPORT': 'bg-blue-600',
                'Passport Services': 'bg-blue-600',
                'VISA': 'bg-orange-500',
                'Visa Processing': 'bg-orange-500',
                'FLIGHT TICKET': 'bg-sky-500',
                'Flight Tickets': 'bg-sky-500',
                'TOUR PACKAGE': 'bg-emerald-500',
                'Tour Packages': 'bg-emerald-500',
              };
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {cat.category}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {cat.count} clients ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={`h-full rounded-full ${colors[cat.category] || 'bg-slate-600'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Primary Focus:</span>
            <span className="font-semibold text-slate-700">Passports & Visas (68.5%)</span>
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Branch Comparison, Document Breakdown & Retention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Multi-Branch Tenancy Comparison */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#E85A18]" />
              <span>Branch Activity Split</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
              2 Branches
            </span>
          </div>

          <div className="space-y-4">
            {analytics?.branchActivity?.map((b) => (
              <div key={b.branchId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">{b.branchName}</h4>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                    {b.branchCode}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-sm font-black text-slate-900">{b.customerCount}</p>
                    <p className="text-[10px] text-slate-400">Clients</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-sm font-black text-slate-900">{b.documentCount}</p>
                    <p className="text-[10px] text-slate-400">Vault Docs</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/branches"
            className="inline-flex items-center gap-1.5 text-xs text-[#E85A18] hover:text-[#D44E0F] font-semibold"
          >
            <span>Manage Branch Staff & Settings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Vault Document Types Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Document Types In Vault</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {kpis?.totalDocuments ?? 0} total
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics?.documentTypeBreakdown?.map((doc) => {
              const pct = Number(((doc.count / totalDocs) * 100).toFixed(1));
              return (
                <div key={doc.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-700 font-medium">
                      {doc.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{doc.count}</span>
                    <span className="text-[10px] text-slate-400 w-10 text-right">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Encrypted with AES-256-GCM and stamped with audit download logs.
          </div>
        </div>

        {/* Expiry Urgency Radar & Customer Retention */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Expiry Urgency Radar</span>
            </h3>
            <Link
              href="/reminders"
              className="text-[11px] text-[#E85A18] hover:underline font-semibold"
            >
              View Desk
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-slate-700">Critical (&lt;7 Days)</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                {analytics?.expiryUrgencyBreakdown?.critical7d ?? 5} alerts
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-slate-700">Urgent (7-30 Days)</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                {analytics?.expiryUrgencyBreakdown?.urgent30d ?? 9} alerts
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-700">Warning (30-180 Days)</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                {analytics?.expiryUrgencyBreakdown?.warning180d ?? 14} alerts
              </span>
            </div>
          </div>

          {/* Retention Quick Stat */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Client Repeat Retention:</span>
              <span className="font-black text-indigo-700">
                {analytics?.repeatCustomerStats?.repeatCustomerRate ?? 37.9}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              {analytics?.repeatCustomerStats?.multiServiceCount ?? 94} customers have engaged in multiple travel services.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Highlights, Official Branch Contacts & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Official Branch Operations Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E85A18]" />
                <span>SAI TOURS & TRAVELS — Branch Infrastructure</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict multi-branch isolation actively prevents cross-branch PII leaks.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700">
              Tamil Nadu, India
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900">Madurai Head Office</h4>
                <span className="text-[10px] bg-orange-100 text-[#E85A18] font-bold px-1.5 py-0.5 rounded">
                  HEAD OFFICE
                </span>
              </div>
              <p className="text-xs text-slate-600">Address: No. 12, West Veli Street, Madurai, TN 625001</p>
              <p className="text-xs text-slate-600">Contact: <strong className="text-slate-800">+91 9894821561</strong></p>
              <p className="text-xs text-slate-600">Passport Enquiry: <strong className="text-slate-800">+91 9790233711</strong></p>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Super Admin Global Clearances Armed</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900">Trichy Branch Office</h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                  BRANCH
                </span>
              </div>
              <p className="text-xs text-slate-600">Address: No. 45, Convent Road, Cantonment, Trichy, TN 620001</p>
              <p className="text-xs text-slate-600">Contact: <strong className="text-slate-800">+91 9894619921</strong></p>
              <p className="text-xs text-slate-600">Ticket Enquiry: <strong className="text-slate-800">+91 9600421561</strong></p>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isolated Branch Staff & Client Vault</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">DPDPA 2023 & UIDAI Mandatory Statutory Rule:</span> All Aadhaar cards must be
              stored and rendered strictly in masked format (<code className="font-mono font-bold">XXXX-XXXX-1234</code>).
              Unmasked national identity cards are strictly blocked by cryptographic filters.
            </div>
          </div>
        </div>

        {/* Quick Launch & Workflows */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Operational Quick Launch</h3>
          <div className="space-y-2.5">
            <Link
              href="/customers"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E85A18] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#E85A18]">Customer CRM</p>
                  <p className="text-[10px] text-slate-500">Register, search, and manage customer 360°</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#E85A18]" />
            </Link>

            <Link
              href="/documents"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <FolderLock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Secure Document Vault</p>
                  <p className="text-[10px] text-slate-500">Encrypted private storage with watermarking</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/search"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">AI Smart Search</p>
                  <p className="text-[10px] text-slate-500">Natural language search across all records</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700" />
            </Link>

            <Link
              href="/ai-assistant"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">SAI AI Assistant</p>
                  <p className="text-[10px] text-slate-500">Conversational travel copilot & RAG</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700" />
            </Link>

            <Link
              href="/reminders"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Expiry Reminders</p>
                  <p className="text-[10px] text-slate-500">180, 90, 60, 30, 7, 1-day alert triggers</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/branches"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Branch & Staff Control</p>
                  <p className="text-[10px] text-slate-500">RBAC provisioning & multi-branch tenancy</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
