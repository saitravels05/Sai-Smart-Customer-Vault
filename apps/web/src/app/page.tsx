'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function RootRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#0B192C] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center bg-white/10 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-sm">
        <ShieldCheck className="w-8 h-8 text-[#E85A18]" />
      </div>
      <h1 className="text-sm font-extrabold text-white tracking-widest uppercase mb-1">
        SAI SMART CUSTOMER VAULT
      </h1>
      <p className="text-xs text-[#E85A18] font-bold mb-4">SAI TOURS & TRAVELS</p>
      <div className="inline-flex items-center gap-2 text-xs text-slate-300">
        <Loader2 className="w-4 h-4 text-[#E85A18] animate-spin" />
        <span>Authenticating Secure Connection...</span>
      </div>
    </div>
  );
}
