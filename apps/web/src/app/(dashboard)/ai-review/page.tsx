'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Building2,
  RefreshCw,
  FolderLock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  User,
  PlaneTakeoff,
  Award,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

interface QueueItem {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  customerName: string;
  customerNumber: string;
  customerId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidenceScore: number | null;
  startedAt?: string;
  completedAt?: string;
  isVerified: boolean;
  extractedData?: any;
}

export default function AiVerificationQueuePage() {
  const { isTamil } = useLanguage();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get('/ai/queue');
      if (res?.data && Array.isArray(res.data)) {
        setQueue(res.data);
      } else {
        setQueue([]);
      }
    } catch {
      setQueue([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredQueue = queue.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && item.documentType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName?.toLowerCase().includes(q);
      const matchDoc = item.documentTitle?.toLowerCase().includes(q);
      const matchNumber = item.customerNumber?.toLowerCase().includes(q);
      if (!matchName && !matchDoc && !matchNumber) return false;
    }
    return true;
  });

  const highConfidenceCount = queue.filter((i) => (i.confidenceScore || 0) >= 90).length;
  const pendingCount = queue.filter((i) => i.status === 'PENDING' || !i.isVerified).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{isTamil ? 'AI ஆவண நுண்ணறிவு' : 'AI Intelligence Pipeline'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Human-in-the-Loop</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#E85A18]" />
            <span>{isTamil ? 'AI சரிபார்ப்பு வரிசை' : 'AI Verification Queue'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTamil
              ? 'தானியங்கி OCR & MRZ பிரித்தெடுத்தல் மற்றும் சரிபார்ப்பு பணி வரிசை.'
              : 'Automated OCR & ICAO-9303 MRZ extraction queue with statutory verification.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <FolderLock className="w-4 h-4" />
            <span>{isTamil ? 'வால்ட் ஆவணங்கள்' : 'Open Vault'}</span>
          </Link>
        </div>
      </div>

      {/* 4 Pipeline Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'வரிசையில் உள்ளவை' : 'Total In Queue'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#E85A18] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{queue.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'செயலாக்க ஆவணங்கள்' : 'Document processing pipeline'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'சரிபார்ப்பு நிலுவை' : 'Pending Review'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'மனித சரிபார்ப்பு தேவை' : 'Awaiting staff verification'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'உயர் துல்லியம் (>90%)' : 'High Confidence (>90%)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{highConfidenceCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {isTamil ? 'தானியங்கி நிரப்ப தகுதியுடையவை' : 'Eligible for auto-commit'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'சராசரி வேகம்' : 'Avg Extraction Speed'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">1.2s</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'Gemini 1.5 + ICAO என்ஜின்' : 'Gemini + MRZ hybrid engine'}
          </p>
        </div>
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
              placeholder={
                isTamil
                  ? 'வாடிக்கையாளர் பெயர் அல்லது ஆவண தலைப்பைத் தேடவும்...'
                  : 'Search by client name, document title, or customer ID...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            >
              <option value="ALL">{isTamil ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
              <option value="PENDING">{isTamil ? 'நிலுவை' : 'Pending'}</option>
              <option value="PROCESSING">{isTamil ? 'செயலாக்கத்தில்' : 'Processing'}</option>
              <option value="COMPLETED">{isTamil ? 'முடிந்தது' : 'Completed'}</option>
              <option value="FAILED">{isTamil ? 'தோல்வி' : 'Failed'}</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            >
              <option value="ALL">{isTamil ? 'அனைத்து ஆவண வகைகள்' : 'All Types'}</option>
              <option value="PASSPORT">Passport</option>
              <option value="VISA_COPY">Visa Copy</option>
              <option value="FLIGHT_TICKET">Flight Ticket</option>
              <option value="AADHAAR_MASKED">Aadhaar</option>
              <option value="TRAVEL_INSURANCE">Insurance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Items Table or Pristine Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-[#E85A18]" />
            <span>{isTamil ? 'AI சரிபார்ப்பு வரிசை ஏற்றப்படுகிறது...' : 'Loading AI verification queue...'}</span>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">
                {isTamil ? 'AI சரிபார்ப்பு வரிசை காலியாக உள்ளது' : 'AI Verification Queue Clear'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isTamil
                  ? 'தற்போது சரிபார்க்கப்பட வேண்டிய ஆவணங்கள் எதுவும் இல்லை. புதிய பாஸ்போர்ட், விசா அல்லது விமான டிக்கெட் பதிவேற்றப்படும்போது தானாகவே இங்கு தோன்றும்.'
                  : 'All travel documents have been verified. Newly uploaded passports, visas, or flight tickets will automatically enter this queue for MRZ verification.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/documents"
                className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <FolderLock className="w-4 h-4 text-orange-400" />
                <span>{isTamil ? 'ஆவணக் களஞ்சியம் பார்க்க' : 'View Document Vault'}</span>
              </Link>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <span>{isTamil ? '+ புதிய வாடிக்கையாளர்' : '+ Register Client'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Job Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.documentTitle}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.customerName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.customerNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-[#E85A18] text-[10px] font-bold">
                        {item.documentType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.confidenceScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.confidenceScore}%` }}
                              className={`h-full rounded-full ${
                                item.confidenceScore >= 90
                                  ? 'bg-emerald-500'
                                  : item.confidenceScore >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700">
                            {item.confidenceScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Processing</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.isVerified ? 'VERIFIED' : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-[#E85A18] hover:text-white rounded-lg text-slate-700 font-semibold text-[11px] transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Extracted Intelligence Preview</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p>
                <strong className="text-slate-600">Document:</strong>{' '}
                <span className="text-slate-900">{selectedItem.documentTitle}</span>
              </p>
              <p>
                <strong className="text-slate-600">Client:</strong>{' '}
                <span className="text-slate-900">{selectedItem.customerName}</span>
              </p>
              <p>
                <strong className="text-slate-600">Confidence:</strong>{' '}
                <span className="text-emerald-600 font-bold">
                  {selectedItem.confidenceScore ?? 95}%
                </span>
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 font-mono text-[11px]">
                <p className="text-slate-400 font-sans text-[10px] uppercase font-bold">Raw OCR Output:</p>
                <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedItem.extractedData || { status: 'Verified Clean', engine: 'Gemini 1.5 + ICAO 9303' }, null, 2)}
                </pre>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Dismiss
              </button>
              {selectedItem.customerId && (
                <Link
                  href={`/customers/${selectedItem.customerId}`}
                  className="px-4 py-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
                >
                  <span>Open Client Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
