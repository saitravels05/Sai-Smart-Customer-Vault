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
  ShieldCheck,
  ShieldAlert,
  FileSignature,
  EyeOff,
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
  ConsentPurpose,
} from '@sai/shared-types';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { user } = useAuth();

  const [customer, setCustomer] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidateDto[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'credentials' | 'documents' | 'bookings' | 'notes' | 'family' | 'timeline' | 'compliance'
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
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showErasureModal, setShowErasureModal] = useState(false);
  const [consentToRevoke, setConsentToRevoke] = useState<any | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCandidateDto | null>(null);

  // Copy state helper
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
      loadDuplicates();
      loadConsents();
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

  const loadConsents = async () => {
    try {
      setLoadingConsents(true);
      const res: any = await apiClient.get(`/compliance/customers/${customerId}/consents`);
      if (res?.data) {
        setConsents(res.data);
      }
    } catch (err) {
      console.warn('Could not load customer consents:', err);
    } finally {
      setLoadingConsents(false);
    }
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
    user?.role === 'OWNER' || user?.role === 'ADMIN';

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
            { id: 'compliance', label: `DPDPA & Privacy (${consents.length})`, onClick: loadConsents },
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
              <div className="flex justify-between py-1 border-b border-slate-50 items-center">
                <span className="text-slate-500">DPDPA 2023 Consent:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('compliance');
                    loadConsents();
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {consents.length > 0
                      ? `${consents.filter((c: any) => c.isGranted).length} Active Consents Recorded`
                      : 'DPDPA Notice v2023.1 Recorded'}
                  </span>
                </button>
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

      {/* Tab 8: DPDPA & Privacy Compliance */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Statutory DPDPA & UIDAI Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0B192C] to-[#1E3E62] text-white p-6 rounded-xl border border-slate-700 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DPDPA 2023 Compliant
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    UIDAI Masking (XXXX-XXXX-####)
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Notice Version: v2023.1
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Statutory Privacy & Data Fiduciary Compliance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <p className="font-semibold text-white mb-0.5 flex items-center gap-1">
                      <span>English Notice (DPDPA 2023)</span>
                    </p>
                    <p className="leading-relaxed text-slate-300">
                      Personal identity documents and credentials collected by SAI TOURS & TRAVELS (Madurai & Trichy) are strictly protected under AES-256-GCM encryption. Data is processed solely for authorized consular visa processing and air ticketing.
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <p className="font-semibold text-white mb-0.5 flex items-center gap-1">
                      <span>தமிழ் சட்டப்பூர்வ அறிவிப்பு (DPDPA 2023)</span>
                    </p>
                    <p className="leading-relaxed text-slate-300">
                      சாய் டூர்ஸ் & டிராவல்ஸ் நிறுவனத்தால் சேகரிக்கப்படும் கடவுச்சீட்டு மற்றும் விசா விபரங்கள் AES-256-GCM மூலம் மறைகுறியாக்கப்பட்டு பாதுகாக்கப்படுகின்றன. இவை தூதரக விசா மற்றும் பயணச்சீட்டு பணிகளுக்கு மட்டுமே சட்டப்பூர்வமாகப் பயன்படுத்தப்படுகின்றன.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consents Management Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-[#E85A18]" />
                  <span>Statutory Consent Registry</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Legal consent ledger recording specific authorizations for travel operations and alerts.
                </p>
              </div>
              <button
                onClick={() => setShowConsentModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record New Consent</span>
              </button>
            </div>

            {loadingConsents ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E85A18]" />
                <p className="text-xs">Loading statutory consents...</p>
              </div>
            ) : consents.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileSignature className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No explicit consent records logged yet.</p>
                <button
                  onClick={() => setShowConsentModal(true)}
                  className="text-xs text-[#E85A18] font-bold hover:underline"
                >
                  + Record Customer Consent
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consents.map((consent: any) => (
                  <div
                    key={consent.id}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                      consent.isGranted
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/70 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                              consent.isGranted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {consent.isGranted ? 'ACTIVE CONSENT' : 'REVOKED'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {consent.noticeVersion}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs">
                          {consent.purpose.replace(/_/g, ' ')}
                        </h5>
                      </div>

                      {consent.isGranted && (
                        <button
                          onClick={() => setConsentToRevoke(consent)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Granted On:</span>
                        <span className="font-medium text-slate-800">
                          {formatDateTime(consent.recordedAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Client IP:</span>
                        <span className="font-mono text-slate-800">{consent.ipAddress || 'Internal Staff'}</span>
                      </div>
                    </div>

                    {!consent.isGranted && consent.revokedAt && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 space-y-0.5">
                        <span className="font-bold block">Revoked on {formatDateTime(consent.revokedAt)}</span>
                        <p className="italic">Reason: {consent.revocationReason || 'Customer requested withdrawal.'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DPDPA Section 12: Statutory Right to Erasure */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wide">
                    DPDPA 2023 Section 12 — Right to Erasure / Profile Anonymization
                  </h4>
                  <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    Statutory Mandate
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Under the Digital Personal Data Protection Act (DPDPA 2023), customers are entitled to request the permanent erasure and anonymization of their personally identifiable information (PII) once travel requirements have concluded.
                </p>
                <div className="text-[11px] text-slate-500 pt-1 space-y-1">
                  <p>• Full Name will be irreversibly replaced with <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-800 font-mono">[DPDPA ANONYMIZED]</code>.</p>
                  <p>• Mobile numbers, WhatsApp, Email, and physical addresses are scrubbed.</p>
                  <p>• Passports and sensitive travel documents are deleted, while preserving non-identifiable financial UUIDs for mandatory GST audit trails.</p>
                </div>
              </div>
            </div>

            {isSuperAdminOrBranchManager && (
              <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">
                  {customer.fullName.includes('DPDPA ANONYMIZED') || customer.notes?.includes('CUSTOMER_DPDPA_ANONYMIZED')
                    ? 'Customer record has already been statutory anonymized.'
                    : 'Requires Manager or Super Admin statutory authorization.'}
                </span>
                <button
                  onClick={() => setShowErasureModal(true)}
                  disabled={
                    customer.fullName.includes('DPDPA ANONYMIZED') ||
                    customer.notes?.includes('CUSTOMER_DPDPA_ANONYMIZED')
                  }
                  className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Execute Right to Erasure</span>
                </button>
              </div>
            )}
          </div>
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

      {/* ======================================================== */}
      {/* MODAL 7: RECORD DPDPA CONSENT */}
      {/* ======================================================== */}
      {showConsentModal && (
        <RecordConsentModal
          customerId={customerId}
          onClose={() => setShowConsentModal(false)}
          onSuccess={() => {
            setShowConsentModal(false);
            loadConsents();
            setStatusFeedback({ type: 'success', message: 'Statutory DPDPA consent recorded successfully' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 8: REVOKE CONSENT */}
      {/* ======================================================== */}
      {consentToRevoke && (
        <RevokeConsentModal
          customerId={customerId}
          consent={consentToRevoke}
          onClose={() => setConsentToRevoke(null)}
          onSuccess={() => {
            setConsentToRevoke(null);
            loadConsents();
            setStatusFeedback({ type: 'success', message: 'Consent successfully revoked' });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 9: DPDPA RIGHT TO ERASURE / ANONYMIZATION */}
      {/* ======================================================== */}
      {showErasureModal && (
        <AnonymizeCustomerModal
          customer={customer}
          onClose={() => setShowErasureModal(false)}
          onSuccess={() => {
            setShowErasureModal(false);
            loadCustomer();
            loadConsents();
            setStatusFeedback({
              type: 'success',
              message: 'Customer PII has been permanently anonymized pursuant to DPDPA 2023 Section 12.',
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

// ----------------------------------------------------
// DPDPA & STATUTORY COMPLIANCE MODALS
// ----------------------------------------------------

function RecordConsentModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [purpose, setPurpose] = useState<ConsentPurpose>(ConsentPurpose.PASSPORT_PROCESSING);
  const [language, setLanguage] = useState<'ENGLISH' | 'TAMIL'>('ENGLISH');
  const [noticeVersion, setNoticeVersion] = useState('v2023.1');
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must confirm statutory customer authorization');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/compliance/customers/${customerId}/consents`, {
        purpose,
        language,
        noticeVersion,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#E85A18]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Record Statutory DPDPA Consent</h3>
              <p className="text-[11px] text-slate-500">Digital Personal Data Protection Act (DPDPA 2023)</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Consent Purpose *</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as ConsentPurpose)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            >
              <option value={ConsentPurpose.PASSPORT_PROCESSING}>Passport Processing & Verification</option>
              <option value={ConsentPurpose.VISA_APPLICATION}>Consular Visa Application Submission</option>
              <option value={ConsentPurpose.FLIGHT_BOOKING}>Air Ticket Booking & Passenger Name Records</option>
              <option value={ConsentPurpose.WHATSAPP_ALERTS}>WhatsApp Flight & Expiry Notifications</option>
              <option value={ConsentPurpose.DOCUMENT_VAULT_STORAGE}>Encrypted Document Vault Storage</option>
              <option value={ConsentPurpose.MARKETING_UPDATES}>Travel Updates & Package Announcements</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Notice Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value="ENGLISH">English (ஆங்கிலம்)</option>
                <option value="TAMIL">Tamil (தமிழ்)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Notice Version</label>
              <input
                type="text"
                value={noticeVersion}
                onChange={(e) => setNoticeVersion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Authorization Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Counter form signed / verbal WhatsApp confirmation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Statutory Notice Disclaimer:</p>
            <p className="leading-relaxed">
              Customer gives informed consent for SAI TOURS & TRAVELS to store and process their personal identity details strictly for the chosen service.
            </p>
            <p className="leading-relaxed font-tamil text-slate-500 pt-0.5">
              வாடிக்கையாளர் தனது தனிப்பட்ட விபரங்களை பயண பணிகளுக்குப் பயன்படுத்த முழு மனதுடன் சம்மதம் தெரிவிக்கிறார்.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-[#E85A18] focus:ring-[#E85A18]"
            />
            <span className="text-[11px] text-slate-700">
              I verify that informed consent has been obtained from the customer as required by DPDPA 2023.
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
              disabled={isSubmitting || !agreed}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Record Consent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevokeConsentModal({
  customerId,
  consent,
  onClose,
  onSuccess,
}: {
  customerId: string;
  consent: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError('Revocation reason must be at least 3 characters');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/compliance/customers/${customerId}/consents/${consent.id}/revoke`, {
        reason,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Revoke Customer Consent</h3>
              <p className="text-[11px] text-slate-500">DPDPA 2023 Consent Withdrawal</p>
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

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold">Revoking Consent for:</p>
          <p className="font-semibold text-slate-800">{consent.purpose.replace(/_/g, ' ')}</p>
          <p className="text-[11px] text-slate-600">
            Once revoked, the agency must stop processing data for this specific purpose.
          </p>
        </div>

        <form onSubmit={handleRevoke} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Revocation Reason *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Customer requested stop of promotional messages / travel contract completed"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              disabled={isSubmitting || reason.trim().length < 3}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Revocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnonymizeCustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnonymize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim() !== 'ANONYMIZE') {
      setError('You must type ANONYMIZE in capital letters to confirm');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Statutory erasure justification must be at least 5 characters');
      return;
    }
    if (!confirmed) {
      setError('Please check the acknowledgement box');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/compliance/customers/${customer.id}/anonymize`, {
        reason,
        confirmAnonymization: true,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to anonymize customer record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-rose-700" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Execute DPDPA Right to Erasure</h3>
              <p className="text-[11px] text-slate-500">Section 12 Statutory Anonymization</p>
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

        <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>CRITICAL WARNING: This action cannot be reversed!</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800">
            <li>Customer Name <strong className="font-semibold">{customer.fullName}</strong> will be permanently replaced with <span className="font-mono">[DPDPA ANONYMIZED]</span>.</li>
            <li>All phone numbers, emails, and address strings will be deleted.</li>
            <li>Passports and document files will be purged.</li>
            <li>Financial transaction ledger UUIDs will remain for GST compliance.</li>
          </ul>
        </div>

        <form onSubmit={handleAnonymize} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Legal / Customer Request Reason *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Formal request under DPDPA 2023 Sec 12 received via written notice"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Type <span className="font-mono text-rose-700 font-bold">ANONYMIZE</span> to confirm *
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ANONYMIZE"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-[11px] text-slate-700">
              I certify that this statutory erasure request complies with DPDPA 2023 and has been approved by authorized management.
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
              disabled={isSubmitting || confirmText !== 'ANONYMIZE' || !confirmed || reason.trim().length < 5}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Execute Irreversible Erasure</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

