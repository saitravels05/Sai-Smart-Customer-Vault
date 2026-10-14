'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { UserRole } from '@sai/shared-types';
import {
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface PendingRegistration {
  id: string;
  applicantEmail: string;
  fullName: string;
  mobile: string;
  branchId: string;
  createdAt: string;
  status: string;
}

export default function OwnerApprovalsPage() {
  const { user, isOwner } = useAuth();
  const [requests, setRequests] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      const res: any = await apiClient.get('/owner/approvals');
      if (res && res.data) {
        setRequests(res.data);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to fetch pending registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchApprovals();
    }
  }, [isOwner]);

  const handleApprove = async (id: string, role: UserRole) => {
    try {
      setActionLoadingId(id);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res: any = await apiClient.post(`/owner/approvals/${id}/approve`, { role });
      setSuccessNotice(res.message || `User approved successfully as ${role}.`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setErrorNotice(err.message || `Failed to approve registration as ${role}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this registration request?')) return;

    try {
      setActionLoadingId(id);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res: any = await apiClient.post(`/owner/approvals/${id}/reject`, {
        reason: 'Application rejected by Owner discretion.',
      });
      setSuccessNotice(res.message || 'Registration request rejected.');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to reject registration request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Owner Access Required</h2>
        <p className="text-xs text-slate-500">
          This management console is strictly restricted to the primary Owner account (
          <strong>saipassportmdu@gmail.com</strong>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OWNER CONTROL PANEL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Registration Approval Queue
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Owner controls all system access. Review pending staff registration requests and
              assign <strong>ADMIN</strong> or <strong>STAFF</strong> roles.
            </p>
          </div>

          <button
            onClick={fetchApprovals}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur border border-white/10 transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Approvals Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E85A18]" />
            <h2 className="text-xs font-bold text-slate-800">
              Pending Applications ({requests.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Assigned roles can be changed at any time in User Management
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E85A18] mx-auto" />
            <p className="text-xs font-medium">Loading pending applications...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">No Pending Registration Requests</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              All staff applications have been reviewed. New registration requests from{' '}
              <code className="text-[#E85A18]">/signup</code> will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{req.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      PENDING OWNER APPROVAL
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.applicantEmail}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.mobile}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.branchId === 'IXM-HO' ? 'Madurai HO' : 'Trichy Branch'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                {/* Owner Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req.id, UserRole.STAFF)}
                    disabled={actionLoadingId === req.id}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Approve as STAFF</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req.id, UserRole.ADMIN)}
                    disabled={actionLoadingId === req.id}
                    className="inline-flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-white" />
                    <span>Approve as ADMIN</span>
                  </button>

                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
