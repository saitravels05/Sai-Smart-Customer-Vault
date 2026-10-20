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
  AlertCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
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
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      setIsDeleting(true);
      const res: any = await apiClient.delete(`/customers/${customerToDelete.id}`);
      setActionFeedback({
        type: 'success',
        message:
          res?.message ||
          `Customer ${customerToDelete.fullName} (${customerToDelete.customerNumber}) has been deleted successfully.`,
      });
      setCustomerToDelete(null);
      await fetchCustomers();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to delete customer record. Please try again.',
      });
    } finally {
      setIsDeleting(false);
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

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#E85A18] hover:text-[#D44E0F] hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition"
                          title="View Customer Profile"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(c)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition"
                          title="Delete Customer Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Delete Customer Record</h3>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Customer Record Deletion</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Are you sure you want to delete this customer? This will immediately remove their profile, travel itineraries, booking records, and credentials from the active customer directory.
              </p>
            </div>

            {/* Customer Details Summary */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Customer ID:</span>
                <span className="font-mono font-bold text-[#E85A18]">{customerToDelete.customerNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Full Name:</span>
                <span className="font-bold text-slate-900">{customerToDelete.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Contact Number:</span>
                <span className="font-medium text-slate-800">{customerToDelete.primaryPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Service Category:</span>
                <span className="font-semibold text-slate-700">{customerToDelete.primaryCategory?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Branch:</span>
                <span className="font-medium text-slate-800">{customerToDelete.branchName || 'Madurai Head Office'}</span>
              </div>
              {Number(customerToDelete.serviceCharge) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Service Charge Profit:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{Number(customerToDelete.serviceCharge).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
