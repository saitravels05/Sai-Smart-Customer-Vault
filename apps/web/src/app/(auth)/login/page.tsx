'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginDto } from '@sai/shared-types';
import { useAuth } from '@/context/auth-context';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  KeyRound,
  UserPlus,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginDto) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await login(data.email, data.password, rememberMe);

      if (res.requiresMfa && res.userId) {
        router.push(`/mfa?userId=${encodeURIComponent(res.userId)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify credentials or account status.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B192C] via-[#0F223D] to-[#0B192C] flex items-center justify-center p-4 selection:bg-[#E85A18] selection:text-white">
      {/* Decorative Gold & Navy Radial Highlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E85A18]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all duration-300">
        {/* Brand Header */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 relative">
          <div className="relative w-20 h-20 mx-auto mb-3 bg-white rounded-2xl p-2 shadow-lg border border-amber-200/60 ring-4 ring-amber-500/10 transition-transform duration-300 hover:scale-105">
            <Image
              src="/branding/logo.jpg"
              alt="SAI Tours & Travels"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#E85A18]" />
            <span>Official Travel Portal</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            SAI SMART CUSTOMER VAULT
          </h1>
          <p className="text-xs text-[#E85A18] font-extrabold tracking-wide mt-0.5">
            SAI TOURS & TRAVELS
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Madurai Head Office & Trichy Branch</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Official Email Address</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="saipassportmdu@gmail.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  <span>Account Password</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#E85A18] hover:text-[#D44E0F] hover:underline font-bold transition flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:border-transparent transition bg-slate-50/50 hover:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me Control */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E85A18] border-slate-300 focus:ring-[#E85A18] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Remember this device (30 days)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 cursor-pointer duration-200 transform active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Session...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
          </form>

          {/* Request Account Link */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center space-y-1">
            <p className="text-xs text-slate-700 font-medium">New staff or branch personnel?</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs text-[#E85A18] hover:text-[#D44E0F] font-bold hover:underline transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Submit Registration Request for Owner Approval</span>
            </Link>
          </div>

          {/* Security & Regulatory Footnote */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Argon2id Hashing & HttpOnly Session Security</span>
            </div>
            <p className="text-[10px] text-slate-400">
              SAI TOURS & TRAVELS • All logins are audited in compliance with DPDPA 2023.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
