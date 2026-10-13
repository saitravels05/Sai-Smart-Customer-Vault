'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    {
      label: t('nav.dashboard', 'Dashboard'),
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: t('nav.customers', 'Customers'),
      href: '/customers',
      icon: Users,
      active: pathname.startsWith('/customers'),
    },
    {
      label: t('nav.uploadVault', 'Upload'),
      href: '/documents/upload',
      icon: UploadCloud,
      active: pathname === '/documents/upload',
      highlight: true,
    },
    {
      label: t('nav.expiryReminders', 'Alerts'),
      href: '/reminders',
      icon: BellRing,
      active: pathname === '/reminders',
    },
    {
      label: t('nav.aiAssistant', 'AI Assistant'),
      href: '/ai-assistant',
      icon: Sparkles,
      active: pathname === '/ai-assistant',
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B192C]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all min-w-[56px] min-h-[48px]',
              item.active
                ? 'text-[#E85A18] font-semibold'
                : 'text-slate-400 hover:text-slate-200',
              item.highlight &&
                'relative -top-2 bg-[#E85A18] text-white shadow-lg rounded-full p-2.5 min-w-[48px] min-h-[48px] border-2 border-[#0B192C]'
            )}
          >
            <Icon className={cn('w-5 h-5', item.highlight ? 'w-5 h-5 text-white' : '')} />
            {!item.highlight && (
              <span className="text-[10px] mt-0.5 max-w-[64px] truncate text-center">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
