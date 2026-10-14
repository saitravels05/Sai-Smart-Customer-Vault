'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordDto } from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordDto) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res: any = await apiClient.post('/auth/forgot-password', data);
      if (res.data?.emailUnconfigured || res.emailUnconfigured) {
        setErrorMessage(
          res.data?.message ||
            res.message ||
            'Email delivery provider is not configured on the server. Please set SMTP or Resend credentials in .env to receive OTP emails.',
        );
        return;
      }
      if (res.data?.success === false || res.success === false) {
        setErrorMessage(
          res.data?.message || res.message || 'Email delivery failed. Please check provider settings.',
        );
        return;
      }
      const msg = res.message || 'If this email is registered, a verification code has been sent.';
      setSuccessInfo(msg);

      // Short delay then navigate to OTP verification screen with query param
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B192C] via-[#0F223D] to-[#0B192C] flex items-center justify-center p-4 selection:bg-[#E85A18] selection:text-white">
      {/* Decorative Radial Highlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E85A18]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10">
        {/* Brand Header */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="relative w-16 h-16 mx-auto mb-2 bg-white rounded-2xl p-1.5 shadow-md border border-amber-200/60 ring-2 ring-amber-500/10">
            <Image
              src="/branding/logo.jpg"
              alt="SAI Tours & Travels"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            RESET ACCOUNT PASSWORD
          </h1>
          <p className="text-xs text-[#E85A18] font-bold">SAI TOURS & TRAVELS</p>
          <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Enter your registered email address to receive a password reset verification code.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {successInfo && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successInfo}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Redirecting to code verification...</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="saipassportmdu@gmail.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-slate-50/50 hover:bg-white"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Verification Code...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send OTP Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#E85A18] font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
            <Link
              href="/signup"
              className="text-[#E85A18] hover:underline font-semibold"
            >
              Request Account
            </Link>
          </div>

          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cryptographic 5-minute single-use OTP security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
