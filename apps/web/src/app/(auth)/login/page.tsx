'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const res = await login(data.email, data.password);

      if (res.requiresMfa && res.userId) {
        router.push(`/mfa?userId=${encodeURIComponent(res.userId)}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B192C] via-[#112233] to-[#0B192C] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="relative w-20 h-20 mx-auto mb-3 bg-white rounded-xl p-1 shadow-md border border-slate-200">
            <Image
              src="/branding/logo.jpg"
              alt="SAI Tours & Travels"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            SAI SMART CUSTOMER VAULT
          </h1>
          <p className="text-xs text-[#E85A18] font-bold mt-0.5">SAI TOURS & TRAVELS</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-slate-200/80 text-[11px] text-slate-700 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Madurai Head Office & Trichy Branch</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Staff Official Email</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@saitravelservices.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:border-transparent transition"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Password</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-2.5 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Regulatory Footnote */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Argon2id & RFC 6238 TOTP Multi-Factor Security</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Authorized personnel only. Access is monitored and logged in compliance with DPDPA 2023.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
