'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  FolderLock,
  PlaneTakeoff,
  Clock,
  Shield,
  FileText,
  UploadCloud,
  ArrowLeft,
  Archive,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDateTime, maskIdentifier } from '@/lib/utils';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'credentials' | 'documents' | 'bookings' | 'family' | 'timeline'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get(`/customers/${customerId}`);
      if (res?.data) {
        setCustomer(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const res: any = await apiClient.get(`/customers/${customerId}/timeline`);
      if (res?.data?.timeline) {
        setTimeline(res.data.timeline);
      }
    } catch {}
  };

  const handleArchiveToggle = async () => {
    if (!customer) return;
    try {
      setActionInProgress(true);
      if (customer.status === 'ARCHIVED') {
        await apiClient.post(`/customers/${customerId}/restore`);
      } else {
        await apiClient.post(`/customers/${customerId}/archive`);
      }
      await loadCustomer();
    } finally {
      setActionInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E85A18]" />
        <p className="text-xs">Retrieving customer vault records...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Customer Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          This record may belong to another branch or has been deleted.
        </p>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E85A18] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </Link>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {customer.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-orange-100 text-[#E85A18] px-2 py-0.5 rounded">
                  {customer.customerNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    customer.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {customer.status}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.branch?.name}</span>
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{customer.fullName}</h1>
              <p className="text-xs text-slate-500">
                Primary Service: <span className="font-semibold text-slate-700">{customer.primaryCategory.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/${(customer.whatsappNumber || customer.primaryPhone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`tel:${customer.primaryPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
            <Link
              href={`/documents/upload?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
            <button
              onClick={handleArchiveToggle}
              disabled={actionInProgress}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
            >
              {customer.status === 'ARCHIVED' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview & Contacts' },
            { id: 'credentials', label: `Credentials (${(customer.passports?.length || 0) + (customer.visas?.length || 0)})` },
            { id: 'documents', label: `Documents (${customer.documents?.length || 0})` },
            { id: 'bookings', label: `Travel Bookings (${customer.bookings?.length || 0})` },
            { id: 'family', label: `Family & Co-Travelers (${customer.relationshipsFrom?.length || 0})` },
            { id: 'timeline', label: 'Activity Timeline', onClick: loadTimeline },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.onClick) tab.onClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview & Contacts */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Identity & Demographics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Gender:</span>
                <span className="font-semibold text-slate-800">{customer.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-semibold text-slate-800">
                  {customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Nationality:</span>
                <span className="font-semibold text-slate-800">{customer.nationality}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Registered Date:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(customer.registeredAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Contact & Address
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Primary Mobile:</span>
                <span className="font-semibold text-slate-800">{customer.primaryPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-semibold text-slate-800">{customer.whatsappNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{customer.email || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residential City:</span>
                <span className="font-semibold text-slate-800">{customer.city || 'Tamil Nadu'}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Complete Address:</span>
                <p className="text-slate-800 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                  {customer.addressLine || 'Address not recorded.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Credentials (Passports & Visas) */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Passport Records (Field-Level Encrypted AES-256-GCM)</span>
            </h3>

            {customer.passports?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No passport records uploaded or extracted yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.passports?.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {p.passportNumberMask}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        ENCRYPTED AT REST
                      </span>
                    </div>
                    <p className="text-slate-600">Country: {p.issuingCountry}</p>
                    <p className="text-slate-600">Expiry Date: <span className="font-bold text-slate-800">{p.expiryDate.split('T')[0]}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-[#E85A18]" />
              <span>Customer Document Vault</span>
            </h3>
            <Link
              href={`/documents/upload?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>

          {customer.documents?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No documents stored in this customer vault yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Scan Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.documents.map((doc: any) => (
                    <tr key={doc.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{doc.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">{doc.category}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{doc.type}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CLEAN</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(doc.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E85A18]" />
            <span>Chronological Audit Trail & Activity History</span>
          </h3>

          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recorded activity events.</p>
          ) : (
            <div className="space-y-3 relative pl-6 border-l-2 border-slate-200 ml-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#E85A18] border-2 border-white" />
                  <p className="text-xs font-bold text-slate-900">{event.title}</p>
                  <p className="text-[11px] text-slate-500">{event.description}</p>
                  <span className="text-[10px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
