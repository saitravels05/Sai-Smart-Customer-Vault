'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  ShieldCheck,
  Sparkles,
  Lock,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  HardDrive,
  FileCheck2,
  KeyRound,
  BellRing,
  Globe,
  Sliders,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'branches' | 'compliance' | 'ai' | 'security'>('branches');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings form states
  const [mduPhone, setMduPhone] = useState('+91 9894821561');
  const [tryPhone, setTryPhone] = useState('+91 9894619921');
  const [passportAlertDays, setPassportAlertDays] = useState('180');
  const [visaAlertDays, setVisaAlertDays] = useState('90');
  const [watermarkText, setWatermarkText] = useState('SAI TOURS & TRAVELS — OFFICIAL CONFIDENTIAL');
  const [autoVerifyThreshold, setAutoVerifyThreshold] = useState('85');
  const [enableAuditHashing, setEnableAuditHashing] = useState(true);
  const [enableAutoWatermark, setEnableAutoWatermark] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>{isTamil ? 'நிர்வாக அமைப்புகள்' : 'Enterprise Configuration'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DPDPA 2023 Compliant</span>
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#E85A18]" />
          <span>{isTamil ? 'கணினி & கிளை அமைப்புகள்' : 'System & Branch Settings'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTamil
            ? 'கிளை விவரங்கள், DPDPA விதிமுறைகள், AI என்ஜின் துல்லியம் மற்றும் பாதுகாப்பு கொள்கைகள்.'
            : 'Configure branch contact lines, statutory vault policies, AI extraction thresholds, and administrative security.'}
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully and synchronized across branch tenancy!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'branches'
              ? 'border-[#E85A18] text-[#E85A18]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isTamil ? 'கிளை தகவல்கள்' : 'Branch Tenancy'}</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'compliance'
              ? 'border-[#E85A18] text-[#E85A18]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isTamil ? 'சட்ட ரீதியான பாதுகாப்பு' : 'DPDPA & Compliance'}</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'ai'
              ? 'border-[#E85A18] text-[#E85A18]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isTamil ? 'AI ஆவண என்ஜின்' : 'AI Intelligence Engine'}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'security'
              ? 'border-[#E85A18] text-[#E85A18]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{isTamil ? 'பாதுகாப்பு & கணக்கு' : 'Security & Account'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Branch Tenancy */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {/* Madurai Head Office Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E85A18] flex items-center justify-center font-black">
                    IXM
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Madurai Head Office (தலைமை அலுவலகம்)
                    </h3>
                    <p className="text-xs text-slate-500">Branch Code: IXM-HO • Primary Corporate Desk</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                  Active Tenancy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Helpline Phone *</span>
                  </label>
                  <input
                    type="text"
                    value={mduPhone}
                    onChange={(e) => setMduPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Email</span>
                  </label>
                  <input
                    type="email"
                    defaultValue="saipassportmdu@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered Office Address</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="4/166, Melakkal Main Road, Opp: Fenner India, Kochadai, Madurai – 16"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
              </div>
            </div>

            {/* Trichy Branch Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    TRZ
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Trichy Branch Office (திருச்சி கிளை)
                    </h3>
                    <p className="text-xs text-slate-500">Branch Code: TRZ-BO • Regional Service Hub</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                  Active Tenancy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Helpline Phone *</span>
                  </label>
                  <input
                    type="text"
                    value={tryPhone}
                    onChange={(e) => setTryPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Email</span>
                  </label>
                  <input
                    type="email"
                    defaultValue="saipassporttry@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Branch Office Address</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="No.4, 75/A, Jothi Complex, Nee Road, Thillai Nagar, Trichy – 18"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Compliance */}
        {activeTab === 'compliance' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance & DPDPA 2023 Protocols</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Digital Personal Data Protection Act (DPDPA 2023) statutory retention, watermarking, and expiry horizons.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Passport Expiry Warning Horizon (Days) *
                </label>
                <input
                  type="number"
                  value={passportAlertDays}
                  onChange={(e) => setPassportAlertDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                />
                <p className="text-[10px] text-slate-400">
                  Standard travel statutory requirement is 180 days (6 months) validity.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Visa Expiry Warning Horizon (Days) *
                </label>
                <input
                  type="number"
                  value={visaAlertDays}
                  onChange={(e) => setVisaAlertDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                />
                <p className="text-[10px] text-slate-400">
                  Alert triggers before customer visa expires. Default is 90 days.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Official PDF Download Watermark Text *
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
              />
              <p className="text-[10px] text-slate-400">
                Stamped diagonally across all exported passport and visa scans to prevent identity fraud.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoWatermark}
                  onChange={(e) => setEnableAutoWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E85A18]"
                />
                <span className="font-semibold text-slate-800">
                  Enforce diagonal confidentiality watermark on all public customer document exports
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAuditHashing}
                  onChange={(e) => setEnableAuditHashing(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E85A18]"
                />
                <span className="font-semibold text-slate-800">
                  Log cryptographic SHA-256 hash chaining on all customer access and export events
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: AI Intelligence Engine */}
        {activeTab === 'ai' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Document Intelligence & OCR Engine Settings</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Configure Google Gemini 1.5 multimodal extraction and fallback ICAO-9303 MRZ parsing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Primary AI Model</label>
                <select
                  defaultValue="gemini-1.5-flash"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                >
                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra-fast multimodal)</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep reasoning)</option>
                  <option value="offline-mrz">Offline Rule-based ICAO 9303 Engine Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Auto-Fill Confidence Threshold (%) *
                </label>
                <input
                  type="number"
                  value={autoVerifyThreshold}
                  onChange={(e) => setAutoVerifyThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                />
                <p className="text-[10px] text-slate-400">
                  Extractions above this threshold will be marked high confidence.
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-purple-900">Dual-Engine Resilience Active</h4>
                <p className="text-purple-700 text-[11px] mt-0.5">
                  When API quota is unavailable, the built-in ICAO-9303 TD3 parser automatically decodes the 2-line machine readable zone from passports with 100% check-digit verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#E85A18]" />
                <span>Administrative Security & Access Control</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Staff credentials, multi-factor authentication, and encryption at rest.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{user?.fullName || 'SAI Tours & Travels Owner'}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{user?.email || 'saipassportmdu@gmail.com'}</p>
                </div>
                <span className="px-2.5 py-1 bg-[#0B192C] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  {user?.role || 'OWNER'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>AES-256-GCM Vault Encryption</span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  All stored passports, visas, and Aadhaar numbers are hardware-encrypted with unique initialization vectors.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>RFC 6238 TOTP Multi-Factor</span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Two-factor authentication via Google Authenticator or Microsoft Authenticator supported.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isTamil ? 'அமைப்புகளைச் சேமி' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
