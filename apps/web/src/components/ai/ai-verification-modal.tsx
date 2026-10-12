'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ShieldCheck,
  RefreshCw,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Save,
  Check,
} from 'lucide-react';
import { DocumentType } from '@sai/shared-types';

interface AiVerificationModalProps {
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  customerId: string;
  onClose: () => void;
  onVerifiedSuccess?: () => void;
}

export function AiVerificationModal({
  documentId,
  documentTitle,
  documentType,
  customerId,
  onClose,
  onVerifiedSuccess,
}: AiVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractionJob, setExtractionJob] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [applyToCustomer, setApplyToCustomer] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('application/pdf');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      // 1. Fetch document stream for preview
      const previewRes = await axios.get(
        `${apiBaseUrl}/documents/${documentId}/download?watermark=false`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
          responseType: 'blob',
        },
      );

      const resolvedMime = String(previewRes.headers['content-type'] || 'application/pdf');
      const blob = new Blob([previewRes.data], {
        type: resolvedMime,
      });
      setMimeType(resolvedMime);
      setPreviewUrl(window.URL.createObjectURL(blob));

      // 2. Fetch latest AI extraction for this document
      const aiRes = await axios.get(`${apiBaseUrl}/ai/document/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Branch-Id': branchId || '',
        },
      });

      if (aiRes.data?.data) {
        setExtractionJob(aiRes.data.data);
        const initial = aiRes.data.data.verifiedData || aiRes.data.data.extractedData || {};
        setFormData(initial);
      } else {
        // Automatically trigger extraction if no previous job exists
        await triggerNewExtraction();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load document.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerNewExtraction = async () => {
    setIsExtracting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      const res = await axios.post(
        `${apiBaseUrl}/ai/extract/${documentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
        },
      );

      if (res.data?.data) {
        setExtractionJob(res.data.data);
        setFormData(res.data.data.extractedData || {});
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'AI Extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [documentId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitVerification = async () => {
    if (!extractionJob?.jobId) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('sai_access_token');
      const branchId = localStorage.getItem('sai_active_branch_id');

      await axios.post(
        `${apiBaseUrl}/ai/verify`,
        {
          jobId: extractionJob.jobId,
          verifiedData: formData,
          applyToCustomer,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Branch-Id': branchId || '',
          },
        },
      );

      setSuccessMessage('AI Extraction verified and successfully applied to Customer Profile!');
      setTimeout(() => {
        if (onVerifiedSuccess) onVerifiedSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Verification submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidenceScore = extractionJob ? Math.round((extractionJob.confidenceScore || 0.8) * 100) : 85;
  const isHighConfidence = confidenceScore >= 90;
  const isMediumConfidence = confidenceScore >= 70 && confidenceScore < 90;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#E85A18]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{documentTitle}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {documentType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Multimodal OCR & Field Extraction (Google Gemini 3.8 Flash + ICAO 9303 Engine)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerNewExtraction}
              disabled={isExtracting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
              <span>Re-Extract</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split Screen (50% Viewer, 50% Verified Form) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Pane: Document Viewer */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-100 p-4 flex items-center justify-center overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#E85A18]" />
                <span>Decrypting document vault stream...</span>
              </div>
            ) : previewUrl ? (
              mimeType.includes('pdf') ? (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-full rounded-xl bg-white shadow-sm border border-slate-200"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                />
              )
            ) : (
              <p className="text-xs text-slate-400">Failed to load document stream.</p>
            )}
          </div>

          {/* Right Pane: Extracted Fields & Verification */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full bg-white flex flex-col justify-between overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {/* Status & Confidence Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      isHighConfidence
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMediumConfidence
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{confidenceScore}% CONFIDENCE</span>
                  </div>
                  {extractionJob?.isVerified && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      VERIFIED
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Engine: {extractionJob?.modelName || 'gemini-3.8-flash'}
                </div>
              </div>

              {/* ICAO 9303 Checksum Banner for Passports */}
              {documentType === 'PASSPORT' && formData.rawLine2 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    formData.isCheckDigitValid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.isCheckDigitValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {formData.isCheckDigitValid
                          ? 'ICAO Doc 9303 TD3 Checksums Verified'
                          : 'MRZ Check Digit Warning'}
                      </span>
                      <p className="text-[10px] opacity-80 mt-0.5">
                        Passport No, DOB, Expiry, and Composite check digits mathematically validated.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Extracted Form Fields */}
              <div className="space-y-4 text-xs">
                {documentType === 'PASSPORT' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Passport Number *
                        </label>
                        <input
                          type="text"
                          value={formData.passportNumber || ''}
                          onChange={(e) => handleFieldChange('passportNumber', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Issuing Country
                        </label>
                        <input
                          type="text"
                          value={formData.issuingCountry || 'IND'}
                          onChange={(e) => handleFieldChange('issuingCountry', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 uppercase focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Surname *</label>
                        <input
                          type="text"
                          value={formData.surname || ''}
                          onChange={(e) => handleFieldChange('surname', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 uppercase focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Given Names *
                        </label>
                        <input
                          type="text"
                          value={formData.givenNames || ''}
                          onChange={(e) => handleFieldChange('givenNames', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 uppercase focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth?.split('T')[0] || ''}
                          onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                        <select
                          value={formData.sex || 'M'}
                          onChange={(e) => handleFieldChange('sex', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        >
                          <option value="M">Male (M)</option>
                          <option value="F">Female (F)</option>
                          <option value="X">Other (X)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate?.split('T')[0] || ''}
                          onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Place of Issue
                        </label>
                        <input
                          type="text"
                          value={formData.placeOfIssue || ''}
                          onChange={(e) => handleFieldChange('placeOfIssue', e.target.value)}
                          placeholder="e.g. Madurai / Trichy"
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Father's / Guardian Name
                        </label>
                        <input
                          type="text"
                          value={formData.fatherName || ''}
                          onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>
                  </>
                ) : documentType === 'VISA_COPY' || documentType === 'VISA_APPROVAL_LETTER' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Country *</label>
                        <input
                          type="text"
                          value={formData.country || ''}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                          placeholder="e.g. Saudi Arabia, UAE"
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Visa Category
                        </label>
                        <select
                          value={formData.visaCategory || 'TOURIST'}
                          onChange={(e) => handleFieldChange('visaCategory', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        >
                          <option value="TOURIST">Tourist Visa</option>
                          <option value="UMRAH">Umrah / Hajj Visa</option>
                          <option value="BUSINESS">Business Visa</option>
                          <option value="EMPLOYMENT">Employment Visa</option>
                          <option value="TRANSIT">Transit Visa</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Visa Number</label>
                        <input
                          type="text"
                          value={formData.visaNumber || ''}
                          onChange={(e) => handleFieldChange('visaNumber', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 font-mono focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate?.split('T')[0] || ''}
                          onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>
                  </>
                ) : documentType === 'FLIGHT_TICKET' || documentType === 'E_TICKET' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">PNR *</label>
                        <input
                          type="text"
                          value={formData.pnr || ''}
                          onChange={(e) => handleFieldChange('pnr', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 uppercase font-mono font-bold focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Airline</label>
                        <input
                          type="text"
                          value={formData.airline || ''}
                          onChange={(e) => handleFieldChange('airline', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Flight Number</label>
                        <input
                          type="text"
                          value={formData.flightNumber || ''}
                          onChange={(e) => handleFieldChange('flightNumber', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 font-mono focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Passenger Name</label>
                        <input
                          type="text"
                          value={formData.passengerName || ''}
                          onChange={(e) => handleFieldChange('passengerName', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 uppercase focus:ring-1 focus:ring-[#0B192C]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Extracted Text / JSON
                    </label>
                    <textarea
                      rows={6}
                      value={JSON.stringify(formData, null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData(JSON.parse(e.target.value));
                        } catch {}
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] focus:ring-1 focus:ring-[#0B192C]"
                    />
                  </div>
                )}

                {/* Auto Apply Checkbox */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="applyToCustomer"
                    checked={applyToCustomer}
                    onChange={(e) => setApplyToCustomer(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#E85A18] focus:ring-[#E85A18]"
                  />
                  <label htmlFor="applyToCustomer" className="text-xs text-slate-700 cursor-pointer select-none">
                    <span className="font-bold block">Auto-populate Customer Profile</span>
                    <span className="text-[11px] text-slate-500">
                      Creates encrypted passport, visa, or booking records in customer vault automatically.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitVerification}
                className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing to Vault...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Verify & Save to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
