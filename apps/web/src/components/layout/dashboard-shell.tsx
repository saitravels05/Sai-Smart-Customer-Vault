'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Authentication routes render directly without dashboard chrome
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/verify-otp' ||
    pathname === '/reset-password' ||
    pathname === '/mfa';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthRoute) {
        // Safe internal redirect
        router.replace('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, isAuthRoute, pathname, router]);

  if (isAuthRoute) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  // Prevent flash of protected dashboard content before authentication resolves
  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-[#0B192C] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#E85A18] animate-spin mb-3" />
        <p className="text-xs text-slate-300 font-semibold tracking-wider uppercase">
          Verifying Session Authorization...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      {/* Desktop & Mobile Responsive Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 lg:pb-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Quick Navigation */}
      <MobileBottomNav />
    </div>
  );
}
