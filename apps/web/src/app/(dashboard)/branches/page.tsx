'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  Eye,
  AlertCircle,
  X,
  BadgeCheck,
} from 'lucide-react';
import {
  BranchDto,
  StaffMemberDto,
  UserRole,
  CreateBranchDto,
  CreateStaffDto,
} from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [staffList, setStaffList] = useState<StaffMemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddBranchModal, setShowAddBranchModal] = useState<boolean>(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Branch Form State
  const [newBranch, setNewBranch] = useState<CreateBranchDto>({
    code: '',
    name: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    phone: '',
    email: '',
    isHeadOffice: false,
  });

  // New Staff Form State
  const [newStaff, setNewStaff] = useState<CreateStaffDto>({
    fullName: '',
    staffCode: '',
    email: '',
    password: '',
    designation: 'Travel Consultant',
    contactNumber: '+91 ',
    role: UserRole.STAFF,
    branchId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, staffRes] = await Promise.allSettled([
        apiClient.get('/branches'),
        apiClient.get('/staff'),
      ]);

      if (branchesRes.status === 'fulfilled' && (branchesRes.value as any)?.data) {
        setBranches((branchesRes.value as any).data);
      } else {
        // Fallback demo data
        setBranches([
          {
            id: '11111111-1111-1111-1111-111111111111',
            code: 'IXM-HO',
            name: 'Madurai Head Office',
            address: 'No. 12, West Veli Street, Near Railway Junction',
            city: 'Madurai',
            state: 'Tamil Nadu',
            phone: '+91 9894821561',
            email: 'madurai@saitravelservices.com',
            isHeadOffice: true,
            isActive: true,
            customerCount: 164,
            staffCount: 6,
            createdAt: new Date().toISOString(),
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            code: 'TRZ-BO',
            name: 'Trichy Branch Office',
            address: 'No. 45, Convent Road, Cantonment',
            city: 'Trichy',
            state: 'Tamil Nadu',
            phone: '+91 9894619921',
            email: 'trichy@saitravelservices.com',
            isHeadOffice: false,
            isActive: true,
            customerCount: 84,
            staffCount: 4,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      if (staffRes.status === 'fulfilled' && (staffRes.value as any)?.data) {
        setStaffList((staffRes.value as any).data);
      } else {
        // Fallback demo staff data
        setStaffList([
          {
            id: 'staff-1',
            userId: 'user-1',
            branchId: '11111111-1111-1111-1111-111111111111',
            branchName: 'Madurai Head Office',
            staffCode: 'SAI-STF-001',
            fullName: 'Prakash Ramanathan',
            email: 'admin@saitravelservices.com',
            role: UserRole.OWNER,
            designation: 'Managing Director & Owner',
            contactNumber: '+91 9894821561',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'staff-2',
            userId: 'user-2',
            branchId: '11111111-1111-1111-1111-111111111111',
            branchName: 'Madurai Head Office',
            staffCode: 'SAI-STF-002',
            fullName: 'Suresh Kumar',
            email: 'admin.madurai@saitravelservices.com',
            role: UserRole.ADMIN,
            designation: 'Branch Administrator',
            contactNumber: '+91 9790233711',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'staff-3',
            userId: 'user-3',
            branchId: '22222222-2222-2222-2222-222222222222',
            branchName: 'Trichy Branch Office',
            staffCode: 'SAI-STF-003',
            fullName: 'Kavitha Murugan',
            email: 'admin.trichy@saitravelservices.com',
            role: UserRole.ADMIN,
            designation: 'Trichy Branch Admin',
            contactNumber: '+91 9894619921',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'staff-4',
            userId: 'user-4',
            branchId: '22222222-2222-2222-2222-222222222222',
            branchName: 'Trichy Branch Office',
            staffCode: 'SAI-STF-004',
            fullName: 'Venkatesh Annamalai',
            email: 'staff.trichy@saitravelservices.com',
            role: UserRole.STAFF,
            designation: 'Senior Ticketing Executive',
            contactNumber: '+91 9600421561',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'staff-5',
            userId: 'user-5',
            branchId: '11111111-1111-1111-1111-111111111111',
            branchName: 'Madurai Head Office',
            staffCode: 'SAI-STF-005',
            fullName: 'Anitha Sundar',
            email: 'staff.madurai@saitravelservices.com',
            role: UserRole.STAFF,
            designation: 'Customer Service Executive',
            contactNumber: '+91 9894821561',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await apiClient.post('/branches', newBranch);
      if ((res as any)?.success) {
        setFeedbackMessage({ type: 'success', text: `Branch "${newBranch.name}" created successfully!` });
        setShowAddBranchModal(false);
        setNewBranch({
          code: '',
          name: '',
          address: '',
          city: '',
          state: 'Tamil Nadu',
          phone: '',
          email: '',
          isHeadOffice: false,
        });
        await fetchData();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to create branch.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await apiClient.post('/staff', newStaff);
      if ((res as any)?.success) {
        setFeedbackMessage({ type: 'success', text: `Staff member "${newStaff.fullName}" provisioned successfully!` });
        setShowAddStaffModal(false);
        setNewStaff({
          fullName: '',
          staffCode: '',
          email: '',
          password: '',
          designation: 'Travel Consultant',
          contactNumber: '+91 ',
          role: UserRole.STAFF,
          branchId: '',
        });
        await fetchData();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to provision staff member.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesBranch =
      selectedBranchFilter === 'ALL' ||
      s.branchId === selectedBranchFilter;
    const matchesRole =
      selectedRoleFilter === 'ALL' || s.role === selectedRoleFilter;
    const matchesSearch =
      searchQuery === '' ||
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBranch && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#E85A18] text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>MULTI-BRANCH TENANCY & RBAC CONTROL</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Branch & Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing strict multi-branch data isolation (Madurai HO & Trichy BO) with least-privilege role permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh rosters"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddBranchModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Branch</span>
          </button>
          <button
            onClick={() => {
              if (branches.length > 0 && !newStaff.branchId) {
                setNewStaff((prev) => ({ ...prev, branchId: branches[0].id }));
              }
              setShowAddStaffModal(true);
            }}
            className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Provision Staff</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Operational Branches Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#E85A18]" />
          <span>Active Branch Locations ({branches.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {b.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                  </div>
                  {b.isHeadOffice ? (
                    <span className="text-[10px] bg-orange-100 text-[#E85A18] font-black px-2 py-0.5 rounded-full">
                      HEAD OFFICE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      BRANCH
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{b.address}, {b.city}, {b.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{b.phone}</span>
                  </div>
                  {b.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Stats Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-base font-black text-slate-900">{b.customerCount}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Customers</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-base font-black text-slate-900">{b.staffCount}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Staff Assigned</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Roster & Access Control Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E85A18]" />
              <span>Authorized Staff Directory ({filteredStaff.length} Members)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff logins, role permissions, and branch scoping credentials.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 w-48"
              />
            </div>

            {/* Branch Filter */}
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value={UserRole.OWNER}>Owner</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.STAFF}>Staff</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member & Designation</th>
                <th className="py-3 px-4">Staff Code</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => {
                const roleBadges: Record<UserRole, { bg: string; text: string; label: string }> = {
                  OWNER: {
                    bg: 'bg-amber-100 text-amber-900 border-amber-300',
                    text: 'text-amber-800',
                    label: 'OWNER',
                  },
                  ADMIN: {
                    bg: 'bg-purple-100 text-purple-800 border-purple-200',
                    text: 'text-purple-800',
                    label: 'ADMIN',
                  },
                  STAFF: {
                    bg: 'bg-blue-100 text-blue-800 border-blue-200',
                    text: 'text-blue-800',
                    label: 'STAFF',
                  },
                };
                const badge = roleBadges[staff.role] || roleBadges.STAFF;

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{staff.fullName}</p>
                        <p className="text-[11px] text-slate-500">{staff.designation}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {staff.staffCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {staff.branchName || 'Madurai HO'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-slate-800 font-medium font-mono text-[11px]">{staff.email}</p>
                        <p className="text-slate-500 text-[11px]">{staff.contactNumber}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No staff members match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#E85A18]" />
                <h3 className="font-bold text-base text-slate-900">Register New Branch</h3>
              </div>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CJB-BO"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coimbatore Branch"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street and building number"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coimbatore"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={newBranch.state}
                    onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9XXXXXXXXX"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch Email</label>
                  <input
                    type="email"
                    placeholder="branch@saitravelservices.com"
                    value={newBranch.email}
                    onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2 rounded-xl font-semibold shadow-xs transition"
                >
                  {submitting ? 'Registering...' : 'Register Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E85A18]" />
                <h3 className="font-bold text-base text-slate-900">Provision Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kannan"
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Staff Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAI-STF-006"
                    value={newStaff.staffCode}
                    onChange={(e) => setNewStaff({ ...newStaff, staffCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Passport Executive"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9XXXXXXXXX"
                    value={newStaff.contactNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Staff Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@saitravelservices.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Branch *</label>
                  <select
                    required
                    value={newStaff.branchId}
                    onChange={(e) => setNewStaff({ ...newStaff, branchId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Role *</label>
                  <select
                    required
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 bg-white font-medium"
                  >
                    <option value={UserRole.STAFF}>Staff (CRM & Vault Access)</option>
                    <option value={UserRole.ADMIN}>Admin (Branch Management & Review)</option>
                  </select>
                </div>
              </div>

              {/* Role Scope Reminder */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-800">Least-Privilege RBAC Rule:</span> Staff accounts are strictly scoped to their assigned branch. Only the Owner holds global organizational authority and account management.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2 rounded-xl font-semibold shadow-xs transition"
                >
                  {submitting ? 'Provisioning...' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
