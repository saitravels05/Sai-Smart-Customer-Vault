'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  FolderLock,
  Search,
  Download,
  Eye,
  Filter,
  FileText,
  FileBadge,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  Phone,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DocumentCategory, DocumentType } from '@sai/shared-types';

export default function GlobalDocumentsExplorerPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const params: any = { limit: 50 };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedType !== 'ALL') params.type = selectedType;

      const res = await axios.get(`${apiBaseUrl}/documents`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
        },
      });

      if (res.data?.data) {
        setDocuments(res.data.data.items || []);
        setTotalCount(res.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load global documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const downloadDoc = async (docId: string, title: string) => {
    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const res = await axios.get(`${apiBaseUrl}/documents/${docId}/download?watermark=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
        },
        responseType: 'blob',
      });

      let filename = `${title}_WATERMARKED.pdf`;
      const disposition = res.headers ? (res.headers['content-disposition'] || (res.headers as any).get?.('content-disposition')) : null;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
        }
      }

      const contentType = (res.headers ? (res.headers['content-type'] || (res.headers as any).get?.('content-type')) : null) || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleBulkZipDownload = async () => {
    if (selectedDocIds.length === 0) return;

    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const res = await axios.post(
        `${apiBaseUrl}/documents/bulk-download`,
        { documentIds: selectedDocIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
          responseType: 'blob',
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SAI_VAULT_BATCH_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(`Bulk ZIP download failed: ${err.message}`);
    }
  };

  const toggleSelectDoc = (id: string) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter((item) => item !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E85A18] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Document Vault (AES-256-GCM)</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Central Travel Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, preview, and download verified customer passports, visas, tickets, and vouchers across branches.
          </p>
        </div>

        {selectedDocIds.length > 0 && (
          <button
            onClick={handleBulkZipDownload}
            className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Selected ZIP ({selectedDocIds.length})</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, document tags, customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0B192C] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            >
              <option value="ALL">All Categories</option>
              <option value="IDENTITY_DOCUMENT">Identity Documents</option>
              <option value="TRAVEL_DOCUMENT">Travel Documents</option>
              <option value="BUSINESS_DOCUMENT">Invoices & Receipts</option>
              <option value="APPLICATION_DOCUMENT">Applications</option>
              <option value="ATTESTATION_DOCUMENT">Attestations</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            >
              <option value="ALL">All Types</option>
              <option value="PASSPORT">Passport</option>
              <option value="VISA_COPY">Visa Copy</option>
              <option value="FLIGHT_TICKET">Flight Ticket</option>
              <option value="AADHAAR_MASKED">Aadhaar (Masked)</option>
              <option value="TRAVEL_INSURANCE">Travel Insurance</option>
              <option value="HOTEL_BOOKING_CONFIRMATION">Hotel Booking</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#E85A18]" />
            <span>Scanning secure vault index...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No stored travel documents match your filter criteria or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.length > 0 && selectedDocIds.length === documents.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-[#E85A18]"
                    />
                  </th>
                  <th className="py-3 px-4">Document Title & Details</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Category & Type</th>
                  <th className="py-3 px-4">Version & Size</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  const isPdf = doc.mimeType === 'application/pdf';

                  return (
                    <tr key={doc.id} className={isSelected ? 'bg-orange-50/30' : 'hover:bg-slate-50/70 transition'}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.id)}
                          className="w-3.5 h-3.5 rounded text-[#E85A18]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-red-500" />
                            ) : (
                              <FileBadge className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{doc.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SHA-256: {doc.sha256Checksum?.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {doc.customer ? (
                          <div>
                            <Link
                              href={`/customers/${doc.customer.id}`}
                              className="font-semibold text-slate-900 hover:text-[#E85A18] inline-flex items-center gap-1"
                            >
                              <span>{doc.customer.fullName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {doc.customer.customerNumber} • {doc.customer.primaryPhone || doc.customer.mobileNumber || ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-800 block">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-700">
                          v{doc.currentVersion}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDateTime(doc.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/customers/${doc.customerId}?tab=documents`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" /> View Vault
                        </Link>
                        <button
                          onClick={() => downloadDoc(doc.id, doc.title)}
                          className="px-2.5 py-1 rounded bg-orange-100 hover:bg-orange-200 text-[#E85A18] font-bold inline-flex items-center gap-1 text-[11px]"
                          title="Download Document"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
