'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Phone,
  Building2,
  ExternalLink,
  Calendar,
  Filter,
  Check,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  ReminderDto,
  ReminderStatsDto,
  ReminderType,
  ReminderStatus,
  ReminderChannel,
} from '@sai/shared-types';

export default function RemindersPage() {
  const router = useRouter();

  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [stats, setStats] = useState<ReminderStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedStatus, selectedChannel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sai_token') || '';
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedChannel !== 'ALL') params.append('channel', selectedChannel);

      const [resReminders, resStats] = await Promise.all([
        fetch(`/api/v1/reminders?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/reminders/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resReminders.ok) {
        const json = await resReminders.json();
        setReminders(json.data || []);
      }
      if (resStats.ok) {
        const json = await resStats.json();
        setStats(json.data || null);
      }
    } catch {
      // Fallback baseline for initial load or demo
      setReminders([
        {
          id: 'rem-demo-1',
          customerId: 'cust-1',
          customerName: 'Kumar S',
          customerNumber: 'SAI-2026-0001',
          branchId: 'branch-1',
          branchName: 'Madurai HO',
          primaryPhone: '+91 9894821561',
          whatsappNumber: '+91 9894821561',
          type: ReminderType.PASSPORT_EXPIRY,
          channel: ReminderChannel.WHATSAPP,
          title: 'Passport Renewal Alert — Kumar S',
          message:
            'Dear Kumar S, your passport expires in 120 days. International travel requires at least 6 months validity. Contact SAI Tours & Travels for renewal assistance.',
          targetDate: '2026-11-20',
          leadDays: 180,
          scheduledFor: new Date().toISOString(),
          status: ReminderStatus.SCHEDULED,
          daysUntilTarget: 120,
          severity: 'MEDIUM',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rem-demo-2',
          customerId: 'cust-2',
          customerName: 'Priya R',
          customerNumber: 'SAI-2026-0002',
          branchId: 'branch-2',
          branchName: 'Trichy BO',
          primaryPhone: '+91 9894619921',
          whatsappNumber: '+91 9894619921',
          type: ReminderType.VISA_EXPIRY,
          channel: ReminderChannel.WHATSAPP,
          title: 'Singapore Visa Expiry Alert — Priya R',
          message:
            'Your Singapore Tourist eVisa will expire in 14 days on 2026-10-26. Contact SAI Tours & Travels for renewal or extension.',
          targetDate: '2026-10-26',
          leadDays: 30,
          scheduledFor: new Date().toISOString(),
          status: ReminderStatus.SCHEDULED,
          daysUntilTarget: 14,
          severity: 'HIGH',
          createdAt: new Date().toISOString(),
        },
      ]);
      setStats({
        totalActive: 2,
        expiringWithin7Days: 0,
        expiringWithin30Days: 1,
        expiringWithin90Days: 0,
        expiringWithin180Days: 1,
        expired: 0,
        pendingByChannel: { dashboard: 0, email: 0, whatsapp: 2 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/v1/reminders/scan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sai_token') || ''}`,
        },
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setScanning(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`/api/v1/reminders/${id}/acknowledge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sai_token') || ''}`,
        },
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: ReminderStatus.ACKNOWLEDGED, acknowledgedAt: new Date().toISOString() } : r,
        ),
      );
    } catch {}
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/v1/reminders/${id}/dismiss`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sai_token') || ''}`,
        },
      });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const openWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(
      `*SAI TOURS & TRAVELS — TRAVEL ALERT*\n\n${text}\n\n📞 Madurai: +91 9894821561 | Trichy: +91 9894619921`,
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#E85A18]">
              <BellRing className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Expiry Reminders</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#E85A18] font-bold">
              Phase 8 Multi-Tier
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Automated milestone alerts for Passports (180-day 6-month rule), Visas, Flight Departures, and Travel Insurance.
          </p>
        </div>

        {/* Scan & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] disabled:bg-orange-300 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Records...' : 'Scan Database Now'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-red-600 font-bold mb-1">
            <span>Critical (≤ 7 Days)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.expiringWithin7Days || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Immediate departure/expiry</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-orange-600 font-bold mb-1">
            <span>Urgent (≤ 30 Days)</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.expiringWithin30Days || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Visa & ticket windows</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 font-bold mb-1">
            <span>6-Month Rule (≤ 180D)</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.expiringWithin180Days || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Passport renewal window</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
            <span>Expired Records</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.expired || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Past validity milestone</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold mb-1">
            <span>Active Alerts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.totalActive || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across WhatsApp & Dash</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filters:</span>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium"
        >
          <option value="ALL">All Event Types</option>
          <option value="PASSPORT_EXPIRY">Passport Expiry</option>
          <option value="VISA_EXPIRY">Visa Expiry</option>
          <option value="UPCOMING_FLIGHT_DEPARTURE">Flight Departure</option>
          <option value="TRAVEL_INSURANCE_EXPIRY">Travel Insurance</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="SENT">Sent</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium"
        >
          <option value="ALL">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="DASHBOARD">Dashboard</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      {/* Reminders Feed / Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading reminder queue...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Reminders Up To Date</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No pending expiry alerts match the selected criteria. Click "Scan Database Now" to check for new document milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`bg-white p-5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                rem.severity === 'CRITICAL'
                  ? 'border-red-300 bg-red-50/20'
                  : rem.severity === 'HIGH'
                  ? 'border-orange-300'
                  : rem.severity === 'EXPIRED'
                  ? 'border-slate-300 bg-slate-50/50'
                  : 'border-slate-200'
              }`}
            >
              {/* Left Column: Details */}
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      rem.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : rem.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : rem.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : rem.severity === 'EXPIRED'
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rem.daysUntilTarget < 0
                      ? `Expired (${Math.abs(rem.daysUntilTarget)}d ago)`
                      : `Expires in ${rem.daysUntilTarget} days`}
                  </span>

                  {/* Type Badge */}
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {rem.type}
                  </span>

                  {/* Channel Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                      rem.channel === 'WHATSAPP'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rem.channel === 'WHATSAPP' && <MessageSquare className="w-3 h-3 text-emerald-600" />}
                    {rem.channel}
                  </span>

                  {/* Branch Tag */}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {rem.branchName}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{rem.title}</h4>
                  <span className="text-xs text-slate-500 font-medium">({rem.customerNumber})</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  {rem.message}
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Target Date: {rem.targetDate}</span>
                  <span>•</span>
                  <span>Lead Interval: {rem.leadDays} Days</span>
                  <span>•</span>
                  <span className="capitalize">Status: {rem.status.toLowerCase()}</span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {/* 1-Click WhatsApp Button */}
                <button
                  onClick={() => openWhatsApp(rem.whatsappNumber || rem.primaryPhone, rem.message)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                  title="Direct WhatsApp Notification"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* View Customer Profile */}
                <button
                  onClick={() => router.push(`/customers/${rem.customerId}`)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                  title="View Customer Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Acknowledge Button */}
                {rem.status !== ReminderStatus.ACKNOWLEDGED && (
                  <button
                    onClick={() => handleAcknowledge(rem.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition"
                    title="Mark Acknowledged"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(rem.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition"
                  title="Dismiss Reminder"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
