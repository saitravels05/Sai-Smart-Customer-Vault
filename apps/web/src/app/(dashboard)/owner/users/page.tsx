'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { UserRole } from '@sai/shared-types';
import {
  Users,
  Search,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Lock,
  Unlock,
  LogOut,
  ArrowRightLeft,
  Crown,
  KeyRound,
  Filter,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export default function OwnerUsersPage() {
  const { isOwner } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      const res: any = await apiClient.get('/owner/users');
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchUsers();
    }
  }, [isOwner]);

  const handleChangeRole = async (userId: string, targetRole: UserRole) => {
    try {
      setActionLoadingId(userId);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res: any = await apiClient.patch(`/owner/users/${userId}/role`, { role: targetRole });
      setSuccessNotice(res.message || `Role updated successfully to ${targetRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)),
      );
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update user role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    try {
      setActionLoadingId(userId);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res: any = await apiClient.patch(`/owner/users/${userId}/status`, {
        isActive: nextStatus,
      });
      setSuccessNotice(
        res.message || `User account ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u)),
      );
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to toggle account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    if (!confirm('Revoke all active login sessions for this user? They will be forced to log in again.')) {
      return;
    }

    try {
      setActionLoadingId(userId);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res: any = await apiClient.post(`/owner/users/${userId}/revoke-sessions`);
      setSuccessNotice(res.message || 'All user sessions have been terminated.');
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to revoke user sessions.');
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
          User administration is reserved strictly for the primary Owner (
          <strong>saipassportmdu@gmail.com</strong>).
        </p>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBranch =
      branchFilter === 'ALL' ||
      u.branchId === branchFilter ||
      (u.branchName && u.branchName.toLowerCase().includes(branchFilter.toLowerCase()));
    return matchesSearch && matchesRole && matchesBranch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 mb-2">
              <Crown className="w-3.5 h-3.5" />
              <span>OWNER USER DIRECTORY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              User & Role Management
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Owner alone controls system roles (<strong>ADMIN</strong> & <strong>STAFF</strong>),
              account activation, session revocation, and security policies.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur border border-white/10 transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Users</span>
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

      {/* Search & Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-slate-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
            >
              <option value="ALL">All Branches</option>
              <option value="IXM-HO">Madurai HO</option>
              <option value="TRZ-BR">Trichy Branch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E85A18] mx-auto" />
            <p className="text-xs font-medium">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-xs font-bold text-slate-700">No users match filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Owner Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrentOwner = u.role === UserRole.OWNER;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCurrentOwner
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isCurrentOwner ? <Crown className="w-3.5 h-3.5" /> : u.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.role === UserRole.OWNER
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === UserRole.ADMIN
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {u.role === UserRole.OWNER && <Crown className="w-3 h-3 text-[#E85A18]" />}
                          {u.role}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4 text-slate-600">
                        {u.branchName || (u.branchId === 'IXM-HO' ? 'Madurai HO' : 'Trichy Branch')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      {/* Owner Actions */}
                      <td className="py-3 px-4 text-right">
                        {isCurrentOwner ? (
                          <span className="text-[11px] text-amber-700 font-semibold italic">
                            Protected Owner
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Role Switch */}
                            {u.role === UserRole.STAFF ? (
                              <button
                                onClick={() => handleChangeRole(u.id, UserRole.ADMIN)}
                                disabled={actionLoadingId === u.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                title="Promote to Admin"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Make ADMIN</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeRole(u.id, UserRole.STAFF)}
                                disabled={actionLoadingId === u.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                title="Change to Staff"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Make STAFF</span>
                              </button>
                            )}

                            {/* Status Toggle */}
                            <button
                              onClick={() => handleToggleStatus(u.id, u.isActive)}
                              disabled={actionLoadingId === u.id}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                u.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Deactivate account' : 'Activate account'}
                            >
                              {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            {/* Revoke Sessions */}
                            <button
                              onClick={() => handleRevokeSessions(u.id)}
                              disabled={actionLoadingId === u.id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Revoke active sessions"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
