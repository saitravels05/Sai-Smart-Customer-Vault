'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Archive,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Search,
  Grid,
  List,
  History,
  Lock,
  Loader2,
  X,
  FileSpreadsheet,
  FileBadge,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DocumentCategory, DocumentType } from '@sai/shared-types';
import { AiVerificationModal } from '@/components/ai/ai-verification-modal';

interface DocumentVaultProps {
  customerId: string;
  customerName?: string;
  onDocumentChange?: () => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'IDENTITY_DOCUMENT', label: 'Identity' },
  { id: 'TRAVEL_DOCUMENT', label: 'Travel & Tickets' },
  { id: 'BUSINESS_DOCUMENT', label: 'Invoices & Receipts' },
  { id: 'APPLICATION_DOCUMENT', label: 'Application & Letters' },
  { id: 'ATTESTATION_DOCUMENT', label: 'Attestations' },
];

const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passport Scan' },
  { value: 'AADHAAR_MASKED', label: 'Aadhaar Card (Masked)' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'DRIVING_LICENCE', label: 'Driving License' },
  { value: 'FLIGHT_TICKET', label: 'Flight Ticket / E-Ticket' },
  { value: 'VISA_COPY', label: 'Visa Copy' },
  { value: 'VISA_APPROVAL_LETTER', label: 'Visa Approval Letter' },
  { value: 'TRAVEL_INSURANCE', label: 'Travel Insurance Policy' },
  { value: 'HOTEL_BOOKING_CONFIRMATION', label: 'Hotel Booking Voucher' },
  { value: 'TOUR_ITINERARY', label: 'Tour Itinerary' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PAYMENT_RECEIPT', label: 'Payment Receipt' },
  { value: 'CUSTOMER_APPLICATION', label: 'Customer Application Form' },
  { value: 'EMPLOYER_NOC_LETTER', label: 'Employer NOC Letter' },
  { value: 'ATTESTATION_CERTIFICATE', label: 'Attestation Certificate' },
  { value: 'OTHER', label: 'Other Document' },
];

export function DocumentVault({
  customerId,
  customerName,
  onDocumentChange,
}: DocumentVaultProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(
    DocumentCategory.IDENTITY_DOCUMENT,
  );
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.PASSPORT);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');

  // Preview & Audit Log modal state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewWatermark, setPreviewWatermark] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeModalTab, setActiveModalTab] = useState<'preview' | 'versions' | 'audit'>('preview');
  const [aiModalDoc, setAiModalDoc] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sai_access_token') : '';
      const branchId = typeof window !== 'undefined' ? localStorage.getItem('sai_active_branch_id') : '';

      const res = await axios.get(`${apiBaseUrl}/documents`, {
        params: { customerId, limit: 100 },
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
        },
      });

      if (res.data?.data?.items) {
        setDocuments(res.data.data.items);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadDocuments();
    }
  }, [customerId]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    // Validate 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 10MB.');
      return;
    }
    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PDF, JPEG, and PNG files are supported.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Infer category and type from filename
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('passport')) {
      setUploadCategory(DocumentCategory.IDENTITY_DOCUMENT);
      setUploadType(DocumentType.PASSPORT);
    } else if (lowerName.includes('visa')) {
      setUploadCategory(DocumentCategory.TRAVEL_DOCUMENT);
      setUploadType(DocumentType.VISA_COPY);
    } else if (lowerName.includes('ticket')) {
      setUploadCategory(DocumentCategory.TRAVEL_DOCUMENT);
      setUploadType(DocumentType.FLIGHT_TICKET);
    } else if (lowerName.includes('aadhaar')) {
      setUploadCategory(DocumentCategory.IDENTITY_DOCUMENT);
      setUploadType(DocumentType.AADHAAR_MASKED);
    } else if (lowerName.includes('insurance')) {
      setUploadCategory(DocumentCategory.TRAVEL_DOCUMENT);
      setUploadType(DocumentType.TRAVEL_INSURANCE);
    }

    setShowUploadModal(true);
  };

  const executeUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', customerId);
      formData.append('category', uploadCategory);
      formData.append('type', uploadType);
      formData.append('title', uploadTitle || selectedFile.name);
      if (uploadDescription) formData.append('description', uploadDescription);
      if (uploadTags) formData.append('tags', uploadTags);

      await axios.post(`${apiBaseUrl}/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess(`"${uploadTitle}" successfully encrypted and secured in vault.`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTags('');
      loadDocuments();
      if (onDocumentChange) onDocumentChange();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Download Single Document
  const downloadSingleDoc = async (docId: string, docTitle: string, withWatermark = true) => {
    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const res = await axios.get(
        `${apiBaseUrl}/documents/${docId}/download?watermark=${withWatermark ? 'true' : 'false'}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
          responseType: 'blob',
        },
      );

      let filename = `${docTitle}${withWatermark ? '_WATERMARKED' : ''}.pdf`;
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

  // Bulk Download as ZIP
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
      const cleanCustomer = (customerName || 'CUSTOMER').replace(/\s+/g, '_');
      link.setAttribute('download', `SAI_VAULT_${cleanCustomer}_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(`Bulk ZIP download failed: ${err.message}`);
    }
  };

  // Open Preview Modal
  const openPreview = async (doc: any) => {
    setPreviewDoc(doc);
    setActiveModalTab('preview');
    setIsPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      // Fetch file blob
      const res = await axios.get(
        `${apiBaseUrl}/documents/${doc.id}/download?watermark=${previewWatermark ? 'true' : 'false'}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
          responseType: 'blob',
        },
      );

      const blob = new Blob([res.data], { type: doc.mimeType });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);

      // Also load access audit logs
      const logsRes = await axios.get(`${apiBaseUrl}/documents/${doc.id}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
        },
      });
      if (logsRes.data?.data) {
        setAuditLogs(logsRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const reloadPreviewWithWatermark = async (newWatermarkState: boolean) => {
    if (!previewDoc) return;
    setPreviewWatermark(newWatermarkState);
    setIsPreviewLoading(true);

    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const res = await axios.get(
        `${apiBaseUrl}/documents/${previewDoc.id}/download?watermark=${newWatermarkState ? 'true' : 'false'}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
          responseType: 'blob',
        },
      );

      const blob = new Blob([res.data], { type: previewDoc.mimeType });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
    } catch (err: any) {
      console.error('Failed to reload preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const toggleSelectDoc = (id: string) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter((item) => item !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map((d) => d.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
          isDragOver
            ? 'border-[#E85A18] bg-orange-50/50 scale-[1.005]'
            : 'border-slate-200 bg-white hover:border-[#0B192C] hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-[#E85A18]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Drag & Drop Travel Documents Here
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              or <span className="text-[#E85A18] font-bold">browse files</span> on your computer
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> AES-256-GCM Encrypted
            </span>
            <span>•</span>
            <span>PDF, JPEG, PNG (Max 10MB)</span>
            <span>•</span>
            <span>Dynamic Watermarking Enabled</span>
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vault Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#0B192C] focus:outline-none"
            />
          </div>

          {/* Bulk Download Button */}
          {selectedDocIds.length > 0 && (
            <button
              onClick={handleBulkZipDownload}
              className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP ({selectedDocIds.length})</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'}`}
              title="Gallery Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400'}`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Gallery / List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#E85A18]" />
          <span>Decrypting and loading customer vault...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">No Documents Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Drag and drop customer files above to securely upload passports, visas, flight tickets, and travel vouchers.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            const isPdf = doc.mimeType === 'application/pdf';

            return (
              <div
                key={doc.id}
                className={`group bg-white rounded-xl border transition p-4 flex flex-col justify-between space-y-3 relative ${
                  isSelected ? 'border-[#E85A18] ring-1 ring-[#E85A18] shadow-xs' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Select Checkbox */}
                <div className="flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectDoc(doc.id)}
                    className="w-4 h-4 rounded text-[#E85A18] border-slate-300 focus:ring-[#E85A18]"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      v{doc.currentVersion}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> CLEAN
                    </span>
                  </div>
                </div>

                {/* Card Icon & Metadata */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-orange-50 group-hover:text-[#E85A18] transition">
                    {isPdf ? <FileText className="w-5 h-5 text-red-500" /> : <FileBadge className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-slate-800 truncate" title={doc.title}>
                      {doc.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {doc.type}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {(doc.fileSizeBytes / 1024).toFixed(1)} KB • {formatDateTime(doc.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPreview(doc)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setAiModalDoc(doc)}
                      className="inline-flex items-center gap-1 text-[#E85A18] hover:text-[#D44E0F] font-bold text-[11px] px-1.5 py-0.5 rounded bg-orange-50 hover:bg-orange-100 transition"
                      title="AI Multimodal OCR & Field Extraction"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Extract</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => downloadSingleDoc(doc.id, doc.title, true)}
                      title="Download with Official Watermark"
                      className="p-1 text-slate-400 hover:text-[#E85A18] transition rounded hover:bg-slate-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.length > 0 && selectedDocIds.length === filteredDocuments.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-[#E85A18]"
                    />
                  </th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Uploaded</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className={isSelected ? 'bg-orange-50/30' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.id)}
                          className="w-3.5 h-3.5 rounded text-[#E85A18]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{doc.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">{doc.category}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{doc.type}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          v{doc.currentVersion}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{(doc.fileSizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(doc.createdAt)}</td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => setAiModalDoc(doc)}
                          className="text-[#E85A18] hover:text-[#D44E0F] font-bold inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded text-[11px]"
                          title="AI OCR & Extraction"
                        >
                          <Sparkles className="w-3 h-3" /> AI Extract
                        </button>
                        <button
                          onClick={() => openPreview(doc)}
                          className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => downloadSingleDoc(doc.id, doc.title, true)}
                          className="text-[#E85A18] hover:text-[#D44E0F] font-semibold inline-flex items-center gap-1"
                          title="Download with watermark"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Details Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#E85A18]" />
                <span>Classify & Secure Uploaded Document</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Selected File</label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 truncate">
                  {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Passport Front Page Scan"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
                  >
                    <option value="IDENTITY_DOCUMENT">Identity Document</option>
                    <option value="TRAVEL_DOCUMENT">Travel Document</option>
                    <option value="BUSINESS_DOCUMENT">Business Document</option>
                    <option value="APPLICATION_DOCUMENT">Application Document</option>
                    <option value="ATTESTATION_DOCUMENT">Attestation Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Document Type *</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., Umrah 2026, FastTrack, Original"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional staff handling notes..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={executeUpload}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#E85A18] hover:bg-[#D44E0F] text-white flex items-center gap-1.5 shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Encrypting & Storing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure in Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview & Audit Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E85A18]" />
                  <span>{previewDoc.title}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                    v{previewDoc.currentVersion}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  SHA-256: {previewDoc.sha256Checksum?.slice(0, 16)}...
                </p>
              </div>

              {/* Watermark Toggle & Download Controls */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={previewWatermark}
                    onChange={(e) => reloadPreviewWithWatermark(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#E85A18]"
                  />
                  <span>Watermark Preview</span>
                </label>

                <button
                  onClick={() => downloadSingleDoc(previewDoc.id, previewDoc.title, previewWatermark)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button onClick={closePreview} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subtabs (Preview vs Audit Log) */}
            <div className="flex items-center gap-4 px-6 border-b border-slate-100 text-xs font-semibold bg-white">
              <button
                onClick={() => setActiveModalTab('preview')}
                className={`py-2.5 border-b-2 transition ${
                  activeModalTab === 'preview'
                    ? 'border-[#E85A18] text-[#E85A18]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Document Viewer
              </button>
              <button
                onClick={() => setActiveModalTab('audit')}
                className={`py-2.5 border-b-2 transition flex items-center gap-1 ${
                  activeModalTab === 'audit'
                    ? 'border-[#E85A18] text-[#E85A18]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Access Audit Trail ({auditLogs.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E85A18]" />
                  <span>Applying dynamic watermarking & loading viewer...</span>
                </div>
              ) : activeModalTab === 'preview' ? (
                previewUrl ? (
                  previewDoc.mimeType === 'application/pdf' ? (
                    <iframe
                      src={`${previewUrl}#toolbar=0`}
                      className="w-full h-full rounded-lg bg-white shadow-sm border border-slate-200"
                      title="PDF Document Preview"
                    />
                  ) : (
                    <div className="relative max-w-full max-h-full flex items-center justify-center bg-white p-4 rounded-xl shadow-sm">
                      <img
                        src={previewUrl}
                        alt="Document Preview"
                        className="max-h-[65vh] object-contain rounded"
                      />
                      {previewWatermark && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <p className="text-red-500/25 text-2xl font-bold -rotate-45 select-none font-mono">
                            CONFIDENTIAL — SAI TOURS & TRAVELS
                          </p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-500">Preview could not be rendered.</p>
                )
              ) : (
                /* Audit Trail View */
                <div className="w-full h-full bg-white rounded-xl p-5 overflow-auto shadow-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
                    Statutory Document Access Log (ISO 27001 & DPDPA 2023 Compliant)
                  </h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">
                            {log.action} • {log.user?.email || 'System'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            IP: {log.ipAddress} • Client: {log.userAgent?.slice(0, 30)}...
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(log.accessedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Human-in-the-Loop Verification Modal */}
      {aiModalDoc && (
        <AiVerificationModal
          documentId={aiModalDoc.id}
          documentTitle={aiModalDoc.title}
          documentType={aiModalDoc.type}
          customerId={customerId}
          onClose={() => setAiModalDoc(null)}
          onVerifiedSuccess={() => {
            loadDocuments();
            if (onDocumentChange) onDocumentChange();
          }}
        />
      )}
    </div>
  );
}
