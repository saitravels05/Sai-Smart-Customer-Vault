'use client';

import React, { useState } from 'react';
import {
  Search,
  Building2,
  Languages,
  PlusCircle,
  UploadCloud,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { user, logout, activeBranchId, setActiveBranchId } = useAuth();
  const { language, toggleLanguage, t, isTamil } = useLanguage();
  const [selectedBranch, setSelectedBranch] = useState<'madurai' | 'trichy'>('madurai');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBranchSelect = (branch: 'madurai' | 'trichy') => {
    setSelectedBranch(branch);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Mobile Hamburger & Logo (Mobile Only) */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Global Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }
        }}
        className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg relative"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTamil
                ? 'வாடிக்கையாளர், கடவுச்சீட்டு, PNR தேடவும்...'
                : 'Search customer, passport, phone, or PNR...'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 sm:pr-12 py-1.5 sm:py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            ↵
          </kbd>
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Branch Switcher (Responsive) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
          <button
            onClick={() => handleBranchSelect('madurai')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              selectedBranch === 'madurai'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTamil ? 'மதுரை (HO)' : 'Madurai (HO)'}
          </button>
          <button
            onClick={() => handleBranchSelect('trichy')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              selectedBranch === 'trichy'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTamil ? 'திருச்சி (BO)' : 'Trichy (BO)'}
          </button>
        </div>

        {/* Bilingual Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-lg text-xs font-semibold text-[#E85A18] transition shadow-xs"
          title={isTamil ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
        >
          <Languages className="w-3.5 h-3.5 text-[#E85A18]" />
          <span className="font-bold tracking-wide">
            {isTamil ? 'தமிழ் (TA)' : 'English (EN)'}
          </span>
        </button>

        {/* Quick Actions (Desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="truncate">{t('nav.newCustomer', 'New Customer')}</span>
          </Link>
          <Link
            href="/documents/upload"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
            <span className="truncate">{t('nav.uploadVault', 'Upload Vault')}</span>
          </Link>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-500/20 shrink-0">
            {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
              {user?.fullName || 'Administrator'}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium truncate block">
              {user?.branchName || (isTamil ? 'மதுரை (HO)' : 'Madurai (HO)')}
            </span>
          </div>
          {user && (
            <button
              onClick={logout}
              title={t('nav.logout', 'Logout')}
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
