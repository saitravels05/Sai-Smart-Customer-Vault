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
  Trash2,
  UserPlus,
  Plane,
  Hotel,
  GitMerge,
  Search,
  X,
  AlertCircle,
  Copy,
  Check,
  Tag,
  Share2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDateTime, maskIdentifier } from '@/lib/utils';
import { DocumentVault } from '@/components/documents/document-vault';
import { useAuth } from '@/context/auth-context';
import {
  AddPassportDto,
  AddVisaDto,
  AddBookingDto,
  AddNoteDto,
  DuplicateCandidateDto,
} from '@sai/shared-types';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { user } = useAuth();

  const [customer, setCustomer] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidateDto[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'credentials' | 'documents' | 'bookings' | 'notes' | 'family' | 'timeline'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCandidateDto | null>(null);

  // Copy state helper
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
      loadDuplicates();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get(`/customers/${customerId}`);
      if (res?.data) {
        setCustomer(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load customer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDuplicates = async () => {
    try {
      const res: any = await apiClient.get(`/customers/${customerId}/duplicates`);
      if (res?.data) {
        setDuplicates(res.data);
        if (res.data.length > 0) {
          setSelectedDuplicate(res.data[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load duplicate profiles:', err);
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
        setStatusFeedback({ type: 'success', message: 'Customer restored to ACTIVE status.' });
      } else {
        await apiClient.post(`/customers/${customerId}/archive`);
        setStatusFeedback({ type: 'success', message: 'Customer record ARCHIVED.' });
      }
      await loadCustomer();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setActionInProgress(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPnr(text);
    setTimeout(() => setCopiedPnr(null), 2000);
  };

  // 6-Month Passport Validity Calculation
  const getPassportValidityStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        level: 'EXPIRED',
        days: diffDays,
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        text: 'Expired',
        alert: 'Passport has expired. Cannot be accepted for travel or visa submission.',
      };
    } else if (diffDays < 180) {
      return {
        level: 'WARNING',
        days: diffDays,
        badge: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse font-bold',
        text: `< 6 Months (${diffDays} days left)`,
        alert: 'CRITICAL: Less than 6 months validity remaining. International airlines & immigration will deny boarding. Immediate renewal required before booking.',
      };
    } else {
      return {
        level: 'VALID',
        days: diffDays,
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: `Valid (${diffDays} days left)`,
        alert: null,
      };
    }
  };

  // Parse notes from customer.notes text field
  const parseNotes = (rawNotes: string | null | undefined) => {
    if (!rawNotes || !rawNotes.trim()) return [];
    const chunks = rawNotes.split('\n\n').filter((c) => c.trim().length > 0);
    return chunks.map((chunk, idx) => {
      const match = chunk.match(/^\[(.*?) \| (.*?) \((.*?)\)\]: ([\s\S]*)$/);
      if (match) {
        return {
          id: idx,
          timestamp: match[1],
          author: match[2],
          category: match[3],
          content: match[4],
        };
      }
      return {
        id: idx,
        timestamp: customer?.registeredAt ? formatDateTime(customer.registeredAt) : 'Recorded',
        author: 'Staff Member',
        category: 'GENERAL',
        content: chunk,
      };
    });
  };

  // Delete Handlers
  const handleDeletePassport = async (passportId: string) => {
    if (!confirm('Are you sure you want to remove this passport credential?')) return;
    try {
      await apiClient.delete(`/customers/${customerId}/passports/${passportId}`);
      setStatusFeedback({ type: 'success', message: 'Passport removed successfully' });
      await loadCustomer();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to remove passport' });
    }
  };

  const handleDeleteVisa = async (visaId: string) => {
    if (!confirm('Are you sure you want to remove this visa record?')) return;
    try {
      await apiClient.delete(`/customers/${customerId}/visas/${visaId}`);
      setStatusFeedback({ type: 'success', message: 'Visa removed successfully' });
      await loadCustomer();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to remove visa' });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this travel booking?')) return;
    try {
      await apiClient.delete(`/customers/${customerId}/bookings/${bookingId}`);
      setStatusFeedback({ type: 'success', message: 'Booking removed successfully' });
      await loadCustomer();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to delete booking' });
    }
  };

  const handleDeleteRelationship = async (relId: string) => {
    if (!confirm('Remove this family member / co-traveler link?')) return;
    try {
      await apiClient.delete(`/customers/${customerId}/relationships/${relId}`);
      setStatusFeedback({ type: 'success', message: 'Relationship removed successfully' });
      await loadCustomer();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to remove link' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E85A18]" />
        <p className="text-xs">Retrieving customer vault records & credentials...</p>
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

  const isSuperAdminOrBranchManager =
    user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_MANAGER';

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

        {statusFeedback && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{statusFeedback.message}</span>
            <button onClick={() => setStatusFeedback(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Duplicate Detection Alert Banner */}
      {duplicates.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Potential Duplicate Profile Detected
                </h4>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  {duplicates[0].matchScore}% Match
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Found matching customer: <strong className="font-semibold">{duplicates[0].fullName}</strong> ({duplicates[0].customerNumber}) via {duplicates[0].matchReason.toLowerCase()}.
              </p>
            </div>
          </div>
          {isSuperAdminOrBranchManager && (
            <button
              onClick={() => {
                setSelectedDuplicate(duplicates[0]);
                setShowMergeModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 shadow-2xs"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Review & Merge Profile</span>
            </button>
          )}
        </div>
      )}

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
            { id: 'bookings', label: `Travel Bookings (${customer.bookings?.length || 0})` },
            { id: 'documents', label: `Document Vault (${customer.documents?.length || 0})` },
            { id: 'notes', label: `Staff Notes (${parseNotes(customer.notes).length})` },
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
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Identity & Demographics</span>
              <Shield className="w-3.5 h-3.5 text-slate-400" />
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
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">DPDPA 2023 Consent:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Consent Verified & Recorded</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-slate-50">
                <span className="text-slate-500">Assigned Branch & Staff:</span>
                <span className="font-semibold text-slate-800">
                  {customer.branch?.name} ({customer.assignedStaff?.fullName || 'Unassigned'})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Contact & Address</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Primary Mobile:</span>
                <span className="font-semibold text-slate-800">{customer.primaryPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">WhatsApp Number:</span>
                <span className="font-semibold text-slate-800">{customer.whatsappNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-semibold text-slate-800">{customer.email || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">City / State:</span>
                <span className="font-semibold text-slate-800">
                  {customer.city || 'Madurai'}, {customer.state || 'Tamil Nadu'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Residential Address:</span>
                <p className="text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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
          {/* Passports Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Passport Records (AES-256-GCM Encrypted)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stores secure masked passport credentials and checks the 6-month international validity rule.
                </p>
              </div>
              <button
                onClick={() => setShowPassportModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Passport</span>
              </button>
            </div>

            {customer.passports?.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Lock className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No passport credentials recorded.</p>
                <button
                  onClick={() => setShowPassportModal(true)}
                  className="text-xs text-[#E85A18] font-bold hover:underline"
                >
                  + Add Customer Passport
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.passports?.map((p: any) => {
                  const validity = getPassportValidityStatus(p.expiryDate);
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs relative hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {p.passportNumberMask}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            AES-256-GCM
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${validity.badge}`}>
                            {validity.text}
                          </span>
                          <button
                            onClick={() => handleDeletePassport(p.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Delete Passport"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Issuing Country:</span>
                          <span className="font-semibold text-slate-800">{p.issuingCountry || 'IND'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Place of Issue:</span>
                          <span className="font-semibold text-slate-800">{p.placeOfIssue || 'Tamil Nadu'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Issue Date:</span>
                          <span className="font-semibold text-slate-800">
                            {p.issueDate ? p.issueDate.split('T')[0] : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Expiry Date:</span>
                          <span className="font-bold text-slate-900">{p.expiryDate.split('T')[0]}</span>
                        </div>
                      </div>

                      {validity.alert && (
                        <div className="bg-amber-100/80 border border-amber-300 text-amber-900 p-2 rounded-lg text-[11px] leading-tight flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>{validity.alert}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visas Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Visa Credentials & Entry Clearances</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracks valid tourist, business, employment, and transit visas with allowed stays.
                </p>
              </div>
              <button
                onClick={() => setShowVisaModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Visa</span>
              </button>
            </div>

            {customer.visas?.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Shield className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No active visas recorded.</p>
                <button
                  onClick={() => setShowVisaModal(true)}
                  className="text-xs text-[#E85A18] font-bold hover:underline"
                >
                  + Add Visa Record
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.visas?.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs relative hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{v.country}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase">
                          {v.visaCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {v.entriesPermitted || 'SINGLE'} ENTRY
                        </span>
                        <button
                          onClick={() => handleDeleteVisa(v.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete Visa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Duration of Stay:</span>
                        <span className="font-semibold text-slate-800">
                          {v.durationOfStayDays ? `${v.durationOfStayDays} Days` : 'As per stamp'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Valid Until:</span>
                        <span className="font-bold text-slate-900">{v.expiryDate.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Travel Bookings */}
      {activeTab === 'bookings' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-4 h-4 text-[#E85A18]" />
                <span>Travel History & Upcoming Bookings</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Flight itineraries, PNR records, and hotel booking vouchers for customer trips.
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Travel Booking</span>
            </button>
          </div>

          {customer.bookings?.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Plane className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No travel bookings recorded yet.</p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="text-xs text-[#E85A18] font-bold hover:underline"
              >
                + Record Flight or Hotel Booking
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.bookings?.map((b: any) => {
                const isFlight = !!b.flightNumber || !!b.pnr || !!b.airline;
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isFlight ? (
                          <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E85A18] flex items-center justify-center">
                            <Plane className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Hotel className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {isFlight ? `${b.airline || 'Flight'} ${b.flightNumber || ''}` : b.hotelName}
                          </span>
                          <span className="text-slate-400 block text-[11px]">
                            Booking Ref: <strong className="text-slate-700">{b.bookingRef}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.pnr && (
                          <button
                            onClick={() => copyToClipboard(b.pnr)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] font-bold text-slate-800 hover:bg-slate-100 transition"
                            title="Click to copy PNR"
                          >
                            <span>PNR: {b.pnr}</span>
                            {copiedPnr === b.pnr ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isFlight && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">From:</span>
                          <span className="font-bold text-slate-800">{b.originAirport || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">To:</span>
                          <span className="font-bold text-slate-800">{b.destAirport || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Departure:</span>
                          <span className="font-medium text-slate-800">
                            {b.departureTime ? formatDateTime(b.departureTime) : 'TBD'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Arrival:</span>
                          <span className="font-medium text-slate-800">
                            {b.arrivalTime ? formatDateTime(b.arrivalTime) : 'TBD'}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isFlight && b.hotelName && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Hotel:</span>
                          <span className="font-bold text-slate-800">{b.hotelName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Check-in Date:</span>
                          <span className="font-medium text-slate-800">
                            {b.checkInDate ? b.checkInDate.split('T')[0] : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Check-out Date:</span>
                          <span className="font-medium text-slate-800">
                            {b.checkOutDate ? b.checkOutDate.split('T')[0] : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Document Vault */}
      {activeTab === 'documents' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <DocumentVault
            customerId={customer.id}
            customerName={customer.fullName}
            onDocumentChange={loadCustomer}
          />
        </div>
      )}

      {/* Tab 5: Staff Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#E85A18]" />
                <span>Internal Staff Notes & Interaction Records</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Categorized communication logs, service observations, and compliance history.
              </p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Staff Note</span>
            </button>
          </div>

          {parseNotes(customer.notes).length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-2">
              <FileText className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No staff notes entered for this customer.</p>
              <button
                onClick={() => setShowNoteModal(true)}
                className="text-xs text-[#E85A18] font-bold hover:underline"
              >
                + Add First Note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {parseNotes(customer.notes).map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-orange-100 text-[#E85A18] px-2 py-0.5 rounded uppercase">
                        {n.category}
                      </span>
                      <span className="font-semibold text-slate-800">{n.author}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pt-1">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Family & Co-Travelers */}
      {activeTab === 'family' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Linked Family Members & Group Co-Travelers</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Group and family profiles linked for bundled ticketing, visa packages, or tour groups.
              </p>
            </div>
            <button
              onClick={() => setShowFamilyModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Link Relative</span>
            </button>
          </div>

          {customer.relationshipsFrom?.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Users className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No linked family members or co-travelers.</p>
              <button
                onClick={() => setShowFamilyModal(true)}
                className="text-xs text-[#E85A18] font-bold hover:underline"
              >
                + Link Customer Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.relationshipsFrom?.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs relative hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#E85A18] bg-orange-50 px-1.5 py-0.5 rounded">
                        {r.relative?.customerNumber}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                        {r.relationship}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteRelationship(r.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Unlink Relationship"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{r.relative?.fullName}</h4>
                    <p className="text-slate-500 text-[11px]">Mobile: {r.relative?.primaryPhone}</p>
                    {r.groupName && (
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Tour Group: <strong className="text-slate-700">{r.groupName}</strong>
                      </p>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-200/60">
                    <Link
                      href={`/customers/${r.relative?.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E85A18] hover:underline"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E85A18]" />
            <span>Chronological Audit Trail & Activity History</span>
          </h3>

          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recorded activity events.</p>
          ) : (
            <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 ml-2 py-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#E85A18] border-2 border-white" />
                  <p className="text-xs font-bold text-slate-900">{event.title}</p>
                  <p className="text-[11px] text-slate-600">{event.description}</p>
                  <span className="text-[10px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD PASSPORT MODAL */}
      {/* ======================================================== */}
      {showPassportModal && (
        <AddPassportModal
          customerId={customerId}
          onClose={() => setShowPassportModal(false)}
          onSuccess={() => {
            setShowPassportModal(false);
            loadCustomer();
            setStatusFeedback({ type: 'success', message: 'Passport added successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD VISA MODAL */}
      {/* ======================================================== */}
      {showVisaModal && (
        <AddVisaModal
          customerId={customerId}
          onClose={() => setShowVisaModal(false)}
          onSuccess={() => {
            setShowVisaModal(false);
            loadCustomer();
            setStatusFeedback({ type: 'success', message: 'Visa record saved successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD TRAVEL BOOKING MODAL */}
      {/* ======================================================== */}
      {showBookingModal && (
        <AddBookingModal
          customerId={customerId}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            loadCustomer();
            setStatusFeedback({ type: 'success', message: 'Travel booking added successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADD STAFF NOTE MODAL */}
      {/* ======================================================== */}
      {showNoteModal && (
        <AddNoteModal
          customerId={customerId}
          onClose={() => setShowNoteModal(false)}
          onSuccess={() => {
            setShowNoteModal(false);
            loadCustomer();
            setStatusFeedback({ type: 'success', message: 'Staff note recorded successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 5: LINK FAMILY MEMBER MODAL */}
      {/* ======================================================== */}
      {showFamilyModal && (
        <LinkFamilyModal
          customerId={customerId}
          onClose={() => setShowFamilyModal(false)}
          onSuccess={() => {
            setShowFamilyModal(false);
            loadCustomer();
            setStatusFeedback({ type: 'success', message: 'Family relationship linked successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 6: MERGE CUSTOMER MODAL */}
      {/* ======================================================== */}
      {showMergeModal && selectedDuplicate && (
        <MergeCustomerModal
          targetCustomer={customer}
          duplicateCustomer={selectedDuplicate}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            setShowMergeModal(false);
            loadCustomer();
            loadDuplicates();
            setStatusFeedback({
              type: 'success',
              message: `Successfully merged profile ${selectedDuplicate.customerNumber} into ${customer.customerNumber}`,
            });
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// SUB-MODALS
// ----------------------------------------------------

function AddPassportModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    passportNumber: '',
    issuingCountry: 'IND',
    issueDate: '',
    expiryDate: '',
    placeOfIssue: 'Madurai',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${customerId}/passports`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add passport');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Add Passport Credential</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Passport Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. V1234567"
              value={formData.passportNumber}
              onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Issuing Country *</label>
              <input
                type="text"
                required
                value={formData.issuingCountry}
                onChange={(e) => setFormData({ ...formData, issuingCountry: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Place of Issue</label>
              <input
                type="text"
                placeholder="e.g. Madurai"
                value={formData.placeOfIssue}
                onChange={(e) => setFormData({ ...formData, placeOfIssue: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg font-bold transition flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Passport</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddVisaModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    country: 'Singapore',
    visaNumber: '',
    visaCategory: 'TOURIST',
    issueDate: '',
    expiryDate: '',
    durationOfStayDays: 30,
    entriesPermitted: 'SINGLE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${customerId}/visas`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add visa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Add Visa Credential</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Country *</label>
              <input
                type="text"
                required
                placeholder="e.g. Singapore, UAE"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Visa Category *</label>
              <select
                value={formData.visaCategory}
                onChange={(e) => setFormData({ ...formData, visaCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value="TOURIST">Tourist Visa</option>
                <option value="BUSINESS">Business Visa</option>
                <option value="EMPLOYMENT">Employment / Work</option>
                <option value="STUDENT">Student Visa</option>
                <option value="TRANSIT">Transit Visa</option>
                <option value="UMRAH_HAJJ">Umrah / Hajj Visa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Visa Number</label>
            <input
              type="text"
              placeholder="e.g. SG1234567X"
              value={formData.visaNumber}
              onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Entries Permitted</label>
              <select
                value={formData.entriesPermitted}
                onChange={(e) => setFormData({ ...formData, entriesPermitted: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value="SINGLE">Single Entry</option>
                <option value="DOUBLE">Double Entry</option>
                <option value="MULTIPLE">Multiple Entry</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Duration of Stay (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.durationOfStayDays}
                onChange={(e) => setFormData({ ...formData, durationOfStayDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg font-bold transition flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Visa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBookingModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [bookingType, setBookingType] = useState<'FLIGHT' | 'HOTEL'>('FLIGHT');
  const [formData, setFormData] = useState({
    bookingRef: `BK-${Date.now().toString().slice(-6)}`,
    airline: 'Air India Express',
    flightNumber: 'IX-682',
    pnr: '',
    originAirport: 'TRZ',
    destAirport: 'SIN',
    departureTime: '',
    arrivalTime: '',
    hotelName: '',
    checkInDate: '',
    checkOutDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${customerId}/bookings`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-[#E85A18]" />
            <h3 className="font-bold text-sm text-slate-900">Add Travel Booking</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Booking type switcher */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBookingType('FLIGHT')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              bookingType === 'FLIGHT'
                ? 'bg-[#E85A18] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight Booking</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('HOTEL')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              bookingType === 'HOTEL'
                ? 'bg-[#E85A18] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hotel className="w-3.5 h-3.5" />
            <span>Hotel Stay</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Booking Reference *</label>
            <input
              type="text"
              required
              value={formData.bookingRef}
              onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          {bookingType === 'FLIGHT' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Airline</label>
                  <input
                    type="text"
                    placeholder="e.g. Air India Express, IndiGo"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Flight Number</label>
                  <input
                    type="text"
                    placeholder="e.g. IX-682"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PNR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E4XYZ"
                    value={formData.pnr}
                    onChange={(e) => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Origin Airport</label>
                  <input
                    type="text"
                    placeholder="IXM / TRZ"
                    value={formData.originAirport}
                    onChange={(e) => setFormData({ ...formData, originAirport: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dest Airport</label>
                  <input
                    type="text"
                    placeholder="SIN / DXB"
                    value={formData.destAirport}
                    onChange={(e) => setFormData({ ...formData, destAirport: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departure Time</label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Arrival Time</label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
              </div>
            </>
          )}

          {bookingType === 'HOTEL' && (
            <>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hotel / Resort Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marina Bay Sands, Singapore"
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Check-in Date</label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Check-out Date</label>
                  <input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddNoteModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    category: 'GENERAL',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${customerId}/notes`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E85A18]" />
            <h3 className="font-bold text-sm text-slate-900">Add Staff Note</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Note Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            >
              <option value="GENERAL">General Communication</option>
              <option value="VISA">Visa Process / Embassy Update</option>
              <option value="PASSPORT">Passport Renewal / Tatkal</option>
              <option value="TICKETING">Ticketing & Airline Preference</option>
              <option value="PAYMENT">Payment & Invoicing Followup</option>
              <option value="COMPLIANCE">DPDPA / Security Note</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Note Content *</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Customer confirmed Singapore travel for next month. Physical passport collected for verification."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg font-bold transition flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkFamilyModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedRelative, setSelectedRelative] = useState<any | null>(null);
  const [relationship, setRelationship] = useState('SPOUSE');
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCustomers = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      setError(null);
      const res: any = await apiClient.get(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
      if (res?.data) {
        setCandidates(res.data.filter((c: any) => c.id !== customerId));
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelative) {
      setError('Please search and select a relative first');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${customerId}/relationships`, {
        relativeId: selectedRelative.id,
        relationship,
        groupName: groupName.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to link relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Link Family or Co-Traveler</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLink} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Search Customer to Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name, phone, or SAI ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchCustomers();
                  }
                }}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
              <button
                type="button"
                onClick={searchCustomers}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {candidates.length > 0 && !selectedRelative && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {candidates.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedRelative(c)}
                  className="w-full text-left p-2 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900">{c.fullName}</p>
                    <p className="text-[11px] text-slate-500">{c.customerNumber} • {c.primaryPhone}</p>
                  </div>
                  <span className="text-[10px] text-[#E85A18] font-bold">Select</span>
                </button>
              ))}
            </div>
          )}

          {selectedRelative && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950">{selectedRelative.fullName}</p>
                <p className="text-[11px] text-emerald-700">{selectedRelative.customerNumber} • {selectedRelative.primaryPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRelative(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[11px] underline"
              >
                Change
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship Type *</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value="SPOUSE">Spouse</option>
                <option value="CHILD">Child / Dependent</option>
                <option value="PARENT">Parent</option>
                <option value="SIBLING">Sibling</option>
                <option value="CO_TRAVELER">Co-Traveler / Friend</option>
                <option value="COLLEAGUE">Colleague</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Group Tag (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Dubai Tour 2026"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRelative}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Link Relationship</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MergeCustomerModal({
  targetCustomer,
  duplicateCustomer,
  onClose,
  onSuccess,
}: {
  targetCustomer: any;
  duplicateCustomer: DuplicateCandidateDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('Duplicate registration detected with identical contact information.');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box to proceed with the profile merge.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/customers/${targetCustomer.id}/merge`, {
        duplicateCustomerId: duplicateCustomer.id,
        resolutionReason: reason.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Merge failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Merge Duplicate Customer Profiles</h3>
              <p className="text-[11px] text-slate-500">Atomic consolidation under DPDPA 2023 audit standards</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/50 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">PRIMARY PROFILE (KEPT)</span>
            <p className="font-bold text-slate-900">{targetCustomer.fullName}</p>
            <p className="font-mono text-[11px] text-[#E85A18]">{targetCustomer.customerNumber}</p>
            <p className="text-slate-600 text-[11px]">Phone: {targetCustomer.primaryPhone}</p>
          </div>

          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">DUPLICATE PROFILE (ARCHIVED)</span>
            <p className="font-bold text-slate-900">{duplicateCustomer.fullName}</p>
            <p className="font-mono text-[11px] text-slate-600">{duplicateCustomer.customerNumber}</p>
            <p className="text-slate-600 text-[11px]">Phone: {duplicateCustomer.primaryPhone}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-800">What happens during this merge?</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500">
            <li>All documents, passports, visas, bookings & reminders are moved to the primary profile.</li>
            <li>Duplicate profile {duplicateCustomer.customerNumber} is marked ARCHIVED with merge reference.</li>
            <li>An immutable audit log event (`CUSTOMERS_MERGED`) is recorded.</li>
          </ul>
        </div>

        <form onSubmit={handleMerge} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Reason for Merge Resolution *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-[#E85A18] focus:ring-[#E85A18]"
            />
            <span className="text-[11px] text-slate-700">
              I confirm that I have verified both profiles and authorize this irreversible profile consolidation.
            </span>
          </label>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmed}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Execute Profile Merge</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
