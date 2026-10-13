'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Users,
  FolderLock,
  Sparkles,
  Search,
  BellRing,
  PlaneTakeoff,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Phone,
  FileCheck2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isTamil } = useLanguage();

  const navigationItems = [
    {
      name: t('nav.dashboard', 'Executive Dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: t('nav.customers', 'Customer Directory'),
      href: '/customers',
      icon: Users,
    },
    {
      name: t('nav.documentVault', 'Secure Document Vault'),
      href: '/documents',
      icon: FolderLock,
    },
    {
      name: t('nav.aiReviewQueue', 'AI Verification Queue'),
      href: '/ai-review',
      icon: FileCheck2,
      badge: 'AI',
    },
    {
      name: t('nav.aiSearch', 'AI Smart Search'),
      href: '/search',
      icon: Search,
    },
    {
      name: t('nav.aiAssistant', 'SAI AI Assistant'),
      href: '/ai-assistant',
      icon: Sparkles,
      badge: 'Copilot',
    },
    {
      name: t('nav.expiryReminders', 'Expiry Reminders'),
      href: '/reminders',
      icon: BellRing,
      badge: 'Alerts',
    },
    {
      name: t('nav.travelBookings', 'Travel Bookings'),
      href: '/travel',
      icon: PlaneTakeoff,
    },
    {
      name: t('nav.branches', 'Branch Management'),
      href: '/branches',
      icon: Building2,
    },
    {
      name: t('nav.auditCompliance', 'Audit & Compliance'),
      href: '/audit-logs',
      icon: ShieldCheck,
    },
    {
      name: t('nav.settings', 'Settings'),
      href: '/settings',
      icon: Settings,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0B192C] text-white">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 bg-white rounded-lg p-1 overflow-hidden shrink-0 shadow-md">
            <Image
              src="/branding/logo.jpg"
              alt="SAI Tours & Travels"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-wide text-white truncate">
              {isTamil ? 'சாய் ஸ்மார்ட் வால்ட்' : 'SAI SMART VAULT'}
            </h1>
            <p className="text-[11px] text-orange-400 font-medium truncate">
              {isTamil ? 'சாய் டூர்ஸ் & டிராவல்ஸ்' : 'SAI Tours & Travels'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 truncate">
                {isTamil ? 'மதுரை & திருச்சி' : 'Madurai & Trichy'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group min-h-[42px]',
                isActive
                  ? 'bg-[#E85A18] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400',
                )}
              />
              <span className="truncate flex-1">{item.name}</span>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-500/20 text-orange-300 group-hover:bg-orange-500/30',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Branch Helplines Card */}
      <div className="p-3 mx-3 mb-4 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 shrink-0">
        <div className="font-semibold text-orange-400 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          <span>{isTamil ? 'நேரடி உதவி எண்' : 'Direct Helpline'}</span>
        </div>
        <p className="text-slate-400 truncate">
          {isTamil ? 'மதுரை (HO):' : 'HO Madurai:'}{' '}
          <span className="text-white font-mono">+91 9894821561</span>
        </p>
        <p className="text-slate-400 truncate">
          {isTamil ? 'திருச்சி (BO):' : 'Branch Trichy:'}{' '}
          <span className="text-white font-mono">+91 9894619921</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0B192C] text-white flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0B192C] shadow-2xl z-50 transform transition-transform ease-in-out duration-300">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
