'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FolderLock,
  FileText,
  FileBadge,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  User,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

export default function DocumentUploadPage() {
  const router = useRouter();
  const { isTamil } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [category, setCategory] = useState('PERSONAL_IDENTIFICATION');
  const [docType, setDocType] = useState('PASSPORT');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res: any = await apiClient.get('/customers', { params: { limit: 100 } });
        if (res?.data && Array.isArray(res.data)) {
          setCustomers(res.data);
        }
      } catch {
        setCustomers([]);
      }
    }
    loadCustomers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file to upload.');
      return;
    }
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer to link this document with.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('customerId', selectedCustomerId);
      formData.append('category', category);
      formData.append('type', docType);
      if (title.trim()) {
        formData.append('title', title.trim());
      }

      const res: any = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess(res.data || res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Document upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isTamil ? 'ஆவணக் களஞ்சியம் செல்ல' : 'Back to Document Vault'}</span>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#E85A18] text-[11px] font-bold border border-orange-200">
            <UploadCloud className="w-3.5 h-3.5 text-[#E85A18]" />
            <span>AES-256 Vault Ingestion</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Malware Scanned</span>
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FolderLock className="w-6 h-6 text-[#E85A18]" />
          <span>{isTamil ? 'வால்டில் ஆவணம் பதிவேற்றவும்' : 'Upload Document to Secure Vault'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTamil
            ? 'கடவுச்சீட்டு, விசா மற்றும் டிக்கெட்டுகளை DPDPA விதிமுறைகளுடன் பாதுகாப்பாகப் பதிவேற்றவும்.'
            : 'Securely upload client passports, visas, flight tickets, and attestations with statutory AES-256 encryption.'}
        </p>
      </div>

      {uploadSuccess ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">
              {isTamil ? 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது!' : 'Document Uploaded Successfully!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Document has been scanned clean, encrypted with AES-256-GCM, and placed into the client vault.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/documents"
              className="px-4 py-2 bg-[#0B192C] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              <span>View In Vault</span>
            </Link>
            <button
              onClick={() => {
                setUploadSuccess(null);
                setFile(null);
                setTitle('');
              }}
              className="px-4 py-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white rounded-xl text-xs font-bold transition"
            >
              <span>+ Upload Another Document</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Customer / Client *</span>
            </label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
            >
              <option value="">-- Choose Registered Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.customerNumber}) - {c.primaryPhone}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-[11px] text-amber-600">
                No customers currently registered. You can register a customer first in Customer CRM.
              </p>
            )}
          </div>

          {/* Category & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
              >
                <option value="PERSONAL_IDENTIFICATION">Personal Identification</option>
                <option value="VISA_DOCUMENT">Visa Documents</option>
                <option value="TRAVEL_DOCUMENT">Travel Documents</option>
                <option value="BUSINESS_DOCUMENT">Business Documents</option>
                <option value="APPLICATION_DOCUMENT">Applications</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
              >
                <option value="PASSPORT">Passport</option>
                <option value="VISA_COPY">Visa Copy</option>
                <option value="FLIGHT_TICKET">Flight Ticket</option>
                <option value="AADHAAR_MASKED">Aadhaar (Masked)</option>
                <option value="TRAVEL_INSURANCE">Travel Insurance</option>
                <option value="HOTEL_BOOKING_CONFIRMATION">Hotel Booking</option>
              </select>
            </div>
          </div>

          {/* Document Title */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700">Document Title</label>
            <input
              type="text"
              placeholder="e.g. John Doe Passport Front Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
            />
          </div>

          {/* Drag & Drop File Zone */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700">Select File (PDF, PNG, JPG up to 25MB) *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-[#E85A18] transition bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                {file ? (
                  <div>
                    <p className="font-bold text-slate-800">{file.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-800">
                      Click to browse or drag file here
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Passports, Visas, and Tickets are automatically encrypted
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end gap-3">
            <Link
              href="/documents"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isUploading ? 'Encrypting & Uploading...' : 'Upload To Vault'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
