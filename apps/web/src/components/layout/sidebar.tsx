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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Document Vault', href: '/documents', icon: FolderLock },
  { name: 'AI Verification Queue', href: '/ai-review', icon: FileCheck2, badge: 'AI' },
  { name: 'AI Smart Search', href: '/search', icon: Search },
  { name: 'Expiry Reminders', href: '/reminders', icon: BellRing, badge: 'Alerts' },
  { name: 'Travel Bookings', href: '/travel', icon: PlaneTakeoff },
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Audit & Compliance', href: '/audit-logs', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B192C] text-white flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="relative w-12 h-12 bg-white rounded-lg p-1 overflow-hidden shrink-0 shadow-md">
          <Image
            src="/branding/logo.jpg"
            alt="SAI Tours & Travels"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm tracking-wide text-white truncate">SAI SMART VAULT</h1>
          <p className="text-[11px] text-orange-400 font-medium truncate">SAI Tours & Travels</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400">Madurai & Trichy</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group',
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

      {/* Agency Contacts Card */}
      <div className="p-3 mx-3 mb-4 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
        <div className="font-semibold text-orange-400 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          <span>Direct Helpline</span>
        </div>
        <p className="text-slate-400">HO Madurai: <span className="text-white">+91 9894821561</span></p>
        <p className="text-slate-400">Branch Trichy: <span className="text-white">+91 9894619921</span></p>
        <p className="text-slate-400">Passport Desk: <span className="text-white">+91 9790233711</span></p>
      </div>
    </aside>
  );
}
