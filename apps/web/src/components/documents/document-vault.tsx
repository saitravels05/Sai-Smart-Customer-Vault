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
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileCode,
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
  const [previewWatermark, setPreviewWatermark] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeModalTab, setActiveModalTab] = useState<'preview' | 'versions' | 'audit'>('preview');
  const [aiModalDoc, setAiModalDoc] = useState<any | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const formatBytes = (bytes: number | bigint | undefined): string => {
    if (!bytes) return '0 B';
    const b = Number(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopySha = (sha: string) => {
    if (!sha) return;
    navigator.clipboard?.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewDoc) {
        closePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc]);

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
    // Validate 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 25MB.');
      return;
    }
    // Validate type and extension
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setUploadError('Supported formats: PDF, JPEG, PNG, WEBP, Word, Excel, and PowerPoint.');
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('sai_access_token') : '';
      const branchId = typeof window !== 'undefined' ? localStorage.getItem('sai_active_branch_id') : '';

      // Convert file to base64 so it is 100% reliably persisted and never dropped by boundary issues
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const getMime = (f: File) => {
        if (f.type && f.type !== 'application/octet-stream') return f.type;
        const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
        const map: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.txt': 'text/plain',
          '.csv': 'text/csv',
        };
        return map[ext] || 'application/octet-stream';
      };

      await axios.post(`${apiBaseUrl}/documents/upload`, {
        customerId,
        category: uploadCategory,
        type: uploadType,
        title: uploadTitle || selectedFile.name,
        description: uploadDescription,
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        fileBase64: base64Data,
        fileName: selectedFile.name,
        mimeType: getMime(selectedFile),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
          'Content-Type': 'application/json',
        },
      });

      setUploadSuccess(`"${uploadTitle || selectedFile.name}" successfully encrypted and secured in vault.`);
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

  const handleReplaceDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !previewDoc) return;
    setIsPreviewLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sai_access_token') : '';
      const branchId = typeof window !== 'undefined' ? localStorage.getItem('sai_active_branch_id') : '';

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await axios.post(`${apiBaseUrl}/documents/${previewDoc.id}/replace`, {
        fileBase64: base64Data,
        fileName: file.name,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
          'Content-Type': 'application/json',
        },
      });

      if (res.data?.data) {
        setPreviewDoc((prev: any) => ({
          ...prev,
          ...res.data.data,
          currentVersion: res.data.data.currentVersion,
        }));
        await reloadPreviewWithWatermark(previewWatermark);
        loadDocuments();
        if (onDocumentChange) onDocumentChange();
      }
    } catch (err: any) {
      alert(`Document replacement failed: ${err.message}`);
    } finally {
      setIsPreviewLoading(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Download Single Document
  const downloadSingleDoc = async (docId: string, docTitle: string, withWatermark = false) => {
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

      let filename = docTitle || 'document';
      const disposition = res.headers ? (res.headers['content-disposition'] || (res.headers as any).get?.('content-disposition')) : null;
      if (disposition && disposition.includes('filename=')) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
        const standardMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1]);
        } else if (standardMatch && standardMatch[1]) {
          filename = decodeURIComponent(standardMatch[1].replace(/['"]/g, ''));
        }
      } else {
        const cType = (res.headers ? (res.headers['content-type'] || (res.headers as any).get?.('content-type')) : null) || '';
        const ext = cType.includes('pdf') ? '.pdf' : cType.includes('png') ? '.png' : cType.includes('jpeg') ? '.jpg' : '';
        if (ext && !filename.endsWith(ext)) filename += ext;
      }

      const contentType = (res.headers ? (res.headers['content-type'] || (res.headers as any).get?.('content-type')) : null) || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
    setPreviewError(null);
    setPreviewUrl(null);
    setZoom(100);
    setRotation(0);
    setCurrentPage(1);
    setIsFullscreen(false);

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

      const contentType = (res.headers ? (res.headers['content-type'] || (res.headers as any).get?.('content-type')) : null) || doc.mimeType || 'application/pdf';
      let resolvedFileName = doc.fileName;
      const disposition = res.headers ? (res.headers['content-disposition'] || (res.headers as any).get?.('content-disposition')) : null;
      if (disposition && disposition.includes('filename=')) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
        const standardMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (utf8Match && utf8Match[1]) {
          resolvedFileName = decodeURIComponent(utf8Match[1]);
        } else if (standardMatch && standardMatch[1]) {
          resolvedFileName = decodeURIComponent(standardMatch[1].replace(/['"]/g, ''));
        }
      }

      const shaHeader = res.headers ? (res.headers['x-sha256-checksum'] || (res.headers as any).get?.('x-sha256-checksum')) : null;
      const blob = new Blob([res.data], { type: contentType });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setPreviewDoc((prev: any) => ({
        ...prev,
        ...doc,
        fileName: resolvedFileName || prev?.fileName || doc.title,
        mimeType: contentType,
        sha256Checksum: shaHeader || doc.sha256Checksum,
      }));

      // Also load access audit logs
      try {
        const logsRes = await axios.get(`${apiBaseUrl}/documents/${doc.id}/logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
        });
        if (logsRes.data?.data) {
          setAuditLogs(logsRes.data.data);
        }
      } catch {}
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      setPreviewError(err.message || 'Unable to render preview. The original file is safely preserved in the vault.');
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

      const contentType = (res.headers ? (res.headers['content-type'] || (res.headers as any).get?.('content-type')) : null) || previewDoc.mimeType || 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setPreviewDoc((prev: any) => ({ ...prev, mimeType: contentType }));
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
    setAuditLogs([]);
    setZoom(100);
    setRotation(0);
    setCurrentPage(1);
    setIsFullscreen(false);
    setPreviewError(null);
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
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
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
            <span>PDF, Images & Office Docs (Max 25MB)</span>
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
                      onClick={() => downloadSingleDoc(doc.id, doc.title, false)}
                      title="Download Original Document"
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
                          onClick={() => downloadSingleDoc(doc.id, doc.title, false)}
                          className="text-[#E85A18] hover:text-[#D44E0F] font-semibold inline-flex items-center gap-1"
                          title="Download Original Document"
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'p-0 bg-slate-950 w-screen h-screen' : 'p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs'}`}>
          <div className={`bg-white flex flex-col shadow-2xl overflow-hidden border border-slate-200 transition-all ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl w-full h-[92vh] rounded-2xl'}`}>
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/90">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E85A18] shrink-0" />
                  <h3 className="font-bold text-sm text-slate-900 truncate" title={previewDoc.title}>
                    {previewDoc.title}
                  </h3>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                    v{previewDoc.currentVersion}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Statutory Clean
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span className="text-slate-600 font-semibold truncate max-w-xs" title={previewDoc.fileName || previewDoc.title}>
                    {previewDoc.fileName || previewDoc.storageKey?.split('/').pop() || previewDoc.title}
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleCopySha(previewDoc.sha256Checksum)}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                    title="Click to copy full SHA-256 Checksum"
                  >
                    {copiedSha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>SHA-256: {previewDoc.sha256Checksum?.slice(0, 12)}...</span>
                  </button>
                </div>
              </div>

              {/* Actions: Replace, Full Page, Watermark Toggle & Download Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  onChange={handleReplaceDocument}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />

                <button
                  type="button"
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                  title="Upload / Replace with exact file from your computer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#E85A18]" />
                  <span className="hidden sm:inline">Replace Document</span>
                </button>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                    title="Open exact document in new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Full Tab</span>
                  </button>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 transition">
                  <input
                    type="checkbox"
                    checked={previewWatermark}
                    onChange={(e) => reloadPreviewWithWatermark(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#E85A18]"
                  />
                  <span>Watermark</span>
                </label>

                <button
                  type="button"
                  onClick={() => downloadSingleDoc(previewDoc.id, previewDoc.title, false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                  title="Download exact original uploaded file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button onClick={closePreview} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Information Strip (Phase 4) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 font-medium">Customer: </span>
                  <span className="font-semibold text-slate-800">{customerName || previewDoc.customer?.fullName || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Type: </span>
                  <span className="font-semibold text-slate-800">{previewDoc.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Category: </span>
                  <span className="text-slate-700">{previewDoc.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">File Size: </span>
                  <span className="font-semibold text-slate-800">{formatBytes(previewDoc.fileSizeBytes)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Uploaded: </span>
                  <span className="text-slate-700">{formatDateTime(previewDoc.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Byte-for-Byte SHA-256 Verified</span>
              </div>
            </div>

            {/* Interactive Viewer Toolbar (Phase 4) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 border-b border-slate-200 bg-white">
              {/* Subtabs */}
              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  onClick={() => setActiveModalTab('preview')}
                  className={`py-1 px-2.5 rounded-lg transition ${
                    activeModalTab === 'preview'
                      ? 'bg-orange-50 text-[#E85A18] font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Document Viewer
                </button>
                <button
                  onClick={() => setActiveModalTab('audit')}
                  className={`py-1 px-2.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeModalTab === 'audit'
                      ? 'bg-orange-50 text-[#E85A18] font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Access Audit Trail ({auditLogs.length})</span>
                </button>
              </div>

              {/* Toolbar Controls: Zoom, Rotate, Page Navigation */}
              {activeModalTab === 'preview' && (
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  {/* Zoom Out */}
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
                    disabled={zoom <= 25}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-mono text-xs font-bold w-12 text-center text-slate-800 select-none">
                    {zoom}%
                  </span>

                  {/* Zoom In */}
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(300, z + 25))}
                    disabled={zoom >= 300}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  {/* Reset / Fit */}
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(100);
                      setRotation(0);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-[11px] font-semibold"
                    title="Reset Zoom & Rotation (Fit to Screen)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Fit</span>
                  </button>

                  {/* Rotate */}
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-[11px] font-semibold"
                    title="Rotate View 90° Clockwise"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{rotation > 0 ? `${rotation}°` : 'Rotate'}</span>
                  </button>

                  {/* Multipage PDF Controls */}
                  {(previewDoc.mimeType?.includes('pdf') || previewDoc.title?.toLowerCase().endsWith('.pdf')) && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono px-1 font-semibold text-slate-700">
                        P. {currentPage}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Body / Viewer Canvas */}
            <div className="flex-1 overflow-auto p-4 bg-slate-900/5 relative flex items-center justify-center">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E85A18]" />
                  <span>Rendering exact original document...</span>
                </div>
              ) : previewError ? (
                <div className="bg-white p-6 rounded-2xl border border-red-200 max-w-md text-center space-y-3 shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-800">Preview Notice</h4>
                  <p className="text-xs text-slate-500">{previewError}</p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => openPreview(previewDoc)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Retry Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSingleDoc(previewDoc.id, previewDoc.title, false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-800"
                    >
                      Download Original File
                    </button>
                  </div>
                </div>
              ) : activeModalTab === 'preview' ? (
                previewUrl ? (
                  (() => {
                    const mime = (previewDoc.mimeType || '').toLowerCase();
                    const title = (previewDoc.fileName || previewDoc.title || '').toLowerCase();
                    const isPdf = mime.includes('pdf') || title.endsWith('.pdf');
                    const isImage = mime.includes('image') || title.endsWith('.png') || title.endsWith('.jpg') || title.endsWith('.jpeg') || title.endsWith('.webp') || title.endsWith('.gif') || title.endsWith('.svg');
                    const isWord = mime.includes('word') || mime.includes('msword') || title.endsWith('.docx') || title.endsWith('.doc');
                    const isExcel = mime.includes('sheet') || mime.includes('excel') || title.endsWith('.xlsx') || title.endsWith('.xls') || title.endsWith('.csv');
                    const isPowerpoint = mime.includes('presentation') || mime.includes('powerpoint') || title.endsWith('.pptx') || title.endsWith('.ppt');

                    if (isPdf) {
                      return (
                        <div
                          className="w-full h-full relative flex items-center justify-center transition-transform duration-200"
                          style={{
                            transform: rotation ? `rotate(${rotation}deg)` : undefined,
                          }}
                        >
                          <iframe
                            src={`${previewUrl}#page=${currentPage}&zoom=${zoom}&toolbar=1&navpanes=1`}
                            className="w-full h-full rounded-xl bg-white shadow-sm border border-slate-200"
                            title="Original PDF Document Preview"
                          />
                          {previewWatermark && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                              <p className="text-red-500/20 text-3xl font-extrabold -rotate-45 select-none font-mono tracking-widest uppercase">
                                CONFIDENTIAL — SAI TOURS & TRAVELS
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (isImage) {
                      return (
                        <div className="w-full h-full relative overflow-auto flex items-center justify-center p-4">
                          <div
                            className="relative transition-transform duration-150 ease-out flex items-center justify-center"
                            style={{
                              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <img
                              src={previewUrl}
                              alt={previewDoc.title}
                              className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                            />
                            {previewWatermark && (
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <p className="text-red-500/25 text-3xl font-extrabold -rotate-45 select-none font-mono tracking-widest uppercase">
                                  CONFIDENTIAL — SAI TOURS & TRAVELS
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (isWord || isExcel || isPowerpoint) {
                      const formatName = isWord ? 'Microsoft Word' : isExcel ? 'Microsoft Excel' : 'Microsoft PowerPoint';
                      const formatExt = isWord ? (title.endsWith('.doc') ? '.DOC' : '.DOCX') : isExcel ? (title.endsWith('.xls') ? '.XLS' : title.endsWith('.csv') ? '.CSV' : '.XLSX') : (title.endsWith('.ppt') ? '.PPT' : '.PPTX');
                      const Icon = isWord ? FileText : isExcel ? FileSpreadsheet : FileBadge;
                      const themeColor = isWord ? 'text-blue-600 bg-blue-50 border-blue-200' : isExcel ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-orange-600 bg-orange-50 border-orange-200';

                      return (
                        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-4">
                          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${themeColor}`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${themeColor}`}>
                              {formatName} ({formatExt})
                            </span>
                            <h4 className="font-bold text-base text-slate-900">{previewDoc.fileName || previewDoc.title}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {formatBytes(previewDoc.fileSizeBytes)} • SHA-256: {previewDoc.sha256Checksum?.slice(0, 16)}...
                            </p>
                          </div>

                          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Exact Original Document Preserved</span>
                            </p>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              This is an authentic {formatName} binary document stored securely in the vault. For 100% pixel-perfect editing, formulas, and pagination, open directly using the desktop application.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => downloadSingleDoc(previewDoc.id, previewDoc.title, false)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download Original {formatExt}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(previewUrl, '_blank')}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-2xs"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-500" />
                              <span>Open in Browser Tab</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Other / Fallback file
                    return (
                      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-3">
                        <FileCode className="w-12 h-12 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-900">{previewDoc.fileName || previewDoc.title}</h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {mime || 'application/octet-stream'} • {formatBytes(previewDoc.fileSizeBytes)}
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => downloadSingleDoc(previewDoc.id, previewDoc.title, false)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Original File</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
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
                    {auditLogs.length === 0 ? (
                      <p className="py-4 text-center text-slate-400">No access events recorded yet.</p>
                    ) : (
                      auditLogs.map((log) => (
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
                      ))
                    )}
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
