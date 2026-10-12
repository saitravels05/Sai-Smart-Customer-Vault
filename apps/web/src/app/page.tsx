'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderLock,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const [apiHealth, setApiHealth] = useState<{ status: string; uptime: number } | null>(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((res: any) => {
        if (res?.data) {
          setApiHealth({
            status: res.data.status,
            uptime: res.data.uptimeSeconds,
          });
        }
      })
      .catch(() => {
        // Expected when API server isn't actively running during initial setup
        setApiHealth(null);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[11px] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SAI SMART CUSTOMER VAULT — PRODUCTION FOUNDATION</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">SAI TOURS & TRAVELS</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              AI-Powered Customer CRM & Document Vault. Scoped multi-branch architecture for Madurai Head Office and Trichy Branch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Users className="w-4 h-4" />
              <span>Open Customer CRM</span>
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-medium backdrop-blur transition"
            >
              <FolderLock className="w-4 h-4" />
              <span>Document Vault</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real Infrastructure Readiness Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Backend API Service */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">NestJS Backend API</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                apiHealth
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {apiHealth ? 'ONLINE' : 'CONFIGURED'}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">Port 4000 (/api/v1)</p>
          <p className="text-[11px] text-slate-500 mt-1">OpenAPI Swagger & Helmet Armed</p>
        </div>

        {/* Database Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">PostgreSQL & pgvector</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              SCHEMA READY
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">22 Normalized Models</p>
          <p className="text-[11px] text-slate-500 mt-1">UUIDs & Encrypted PII Fields</p>
        </div>

        {/* Document Storage Vault */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Private S3 Object Vault</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
              SECURE
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">Signed Direct Uploads</p>
          <p className="text-[11px] text-slate-500 mt-1">300s TTL Presigned URLs</p>
        </div>

        {/* AI Processing Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">AI & MRZ Engine</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
              HUMAN-IN-LOOP
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">ICAO Doc 9303 TD3</p>
          <p className="text-[11px] text-slate-500 mt-1">Algorithmic Check-Digit Verification</p>
        </div>
      </div>

      {/* Operational Highlights & Branch Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Operations Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E85A18]" />
                <span>Multi-Branch Operational Scope</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-based data isolation actively prevents cross-branch PII leaks.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700">
              Tamil Nadu, India
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Madurai Head Office</h4>
                <span className="text-[10px] bg-orange-100 text-[#E85A18] font-bold px-1.5 py-0.5 rounded">
                  HEAD OFFICE
                </span>
              </div>
              <p className="text-xs text-slate-600">Contact: +91 9894821561</p>
              <p className="text-xs text-slate-600">Passport Enquiry: +91 9790233711</p>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Super Admin & Executive Oversight Enabled</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Trichy Branch Office</h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                  BRANCH
                </span>
              </div>
              <p className="text-xs text-slate-600">Contact: +91 9894619921</p>
              <p className="text-xs text-slate-600">Ticket Enquiry: +91 9600421561</p>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isolated Branch Staff & Client Vault</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">DPDPA 2023 & UIDAI Mandatory Rule:</span> All Aadhaar cards must be
              stored in masked format (<code className="font-mono font-bold">XXXX-XXXX-1234</code>). Never upload
              unmasked Aadhaar identity cards.
            </div>
          </div>
        </div>

        {/* Quick Launch & Workflows */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Operational Quick Launch</h3>
          <div className="space-y-2.5">
            <Link
              href="/customers"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E85A18] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#E85A18]">Customer CRM</p>
                  <p className="text-[10px] text-slate-500">Register, search, and manage profiles</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#E85A18]" />
            </Link>

            <Link
              href="/documents"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <FolderLock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Secure Document Vault</p>
                  <p className="text-[10px] text-slate-500">Encrypted private storage with versions</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/ai-review"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E85A18] flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#E85A18]">AI Review Queue</p>
                  <p className="text-[10px] text-slate-500">Passport MRZ check-digit verification</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#E85A18]" />
            </Link>

            <Link
              href="/reminders"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Expiry Reminders</p>
                  <p className="text-[10px] text-slate-500">180, 90, 30, and 7-day alert triggers</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
