'use client';

import React, { useState } from 'react';
import {
  Search,
  Building2,
  Languages,
  UserCheck,
  PlusCircle,
  UploadCloud,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export function Header() {
  const { user, logout, activeBranchId, setActiveBranchId } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<'madurai' | 'trichy'>('madurai');
  const [currentLang, setCurrentLang] = useState<'en' | 'ta'>('en');

  const handleBranchSelect = (branch: 'madurai' | 'trichy') => {
    setSelectedBranch(branch);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, passport number, phone, or PNR... (Press / to focus)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-12 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Branch Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
          <button
            onClick={() => handleBranchSelect('madurai')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              selectedBranch === 'madurai'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Madurai (HO)
          </button>
          <button
            onClick={() => handleBranchSelect('trichy')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              selectedBranch === 'trichy'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trichy (BO)
          </button>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setCurrentLang(currentLang === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
          title="Switch Language / மொழி மாற்றம்"
        >
          <Languages className="w-3.5 h-3.5 text-[#E85A18]" />
          <span>{currentLang === 'en' ? 'English' : 'தமிழ்'}</span>
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </Link>
          <Link
            href="/documents/upload"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
            <span>Upload Vault</span>
          </Link>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-500/20">
            {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">
              {user?.fullName || 'Administrator'}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">
              {user?.branchName || 'Madurai (HO)'}
            </span>
          </div>
          {user && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
