'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  PlusCircle,
  Search,
  Building2,
  FileText,
  Phone,
  MessageSquare,
  Shield,
  Filter,
  ArrowRight,
  FolderLock,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ServiceCategory, CustomerStatus } from '@sai/shared-types';
import { useAuth } from '@/context/auth-context';

export default function CustomersDirectoryPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, selectedCategory, selectedStatus]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const res: any = await apiClient.get('/customers', { params });
      if (res?.data) {
        setCustomers(res.data);
      }
    } catch {
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { label: 'All Services', value: 'ALL' },
    { label: 'Passport Services', value: ServiceCategory.PASSPORT_SERVICES },
    { label: 'Tourist Visa', value: ServiceCategory.TOURIST_VISA },
    { label: 'Business Visa', value: ServiceCategory.BUSINESS_VISA },
    { label: 'Flight Booking', value: ServiceCategory.FLIGHT_BOOKING },
    { label: 'Train Ticket', value: ServiceCategory.TRAIN_TICKET },
    { label: 'Ferry Ticket', value: ServiceCategory.FERRY_TICKET },
    { label: 'Bus Ticket', value: ServiceCategory.BUS_TICKET },
    { label: 'Tour Packages', value: ServiceCategory.TOUR_PACKAGES },
    { label: 'Attestation', value: ServiceCategory.CERTIFICATE_ATTESTATION },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E85A18]" />
            <span>Customer Management CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real customer directory with travel itineraries, real-time profit calculations, and branch tenancy isolation.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Customer</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, mobile number, or Customer ID (SAI-XXXXX)..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            >
              <option value="ACTIVE">Active Records</option>
              <option value="ARCHIVED">Archived Records</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] font-semibold transition ${
                selectedCategory === c.value
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E85A18]" />
            <p className="text-xs">Loading customer records from database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#E85A18] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Customer Records Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Zero fake records exist in this system. Register a new customer profile to begin managing their documents and travel records.
              </p>
            </div>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register First Customer</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Primary Service</th>
                  <th className="py-3 px-4">Travel / Route</th>
                  <th className="py-3 px-4">Profit (Service Charge)</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#E85A18]">
                      {c.customerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.fullName}</p>
                      <span className="text-[10px] text-slate-400">{c.city || 'Tamil Nadu'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.primaryPhone}</span>
                      </div>
                      {c.whatsappNumber && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] mt-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{c.whatsappNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-orange-100 text-[#E85A18] text-[10px] font-bold rounded">
                        {c.primaryCategory.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.departure || c.arrival ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">
                            {c.departure || '—'} → {c.arrival || '—'}
                          </span>
                          {c.travelDate && (
                            <p className="text-[10px] text-slate-400">
                              {new Date(c.travelDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ₹{(Number(c.serviceCharge) || 0).toLocaleString('en-IN')}
                        </span>
                        {(c.customerAmount > 0 || c.agentAmount > 0) && (
                          <p className="text-[9px] text-slate-400">
                            ₹{Number(c.customerAmount || 0).toLocaleString('en-IN')} − ₹{Number(c.agentAmount || 0).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-800">
                        {c.branchName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#E85A18] hover:text-[#D44E0F] hover:underline"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
