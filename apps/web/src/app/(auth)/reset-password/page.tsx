'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordDto } from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordDto) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await apiClient.post('/auth/reset-password', {
        resetToken: data.resetToken || token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setSuccessMessage(
        'Your password has been reset successfully. Please log in using your new password.',
      );

      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to update password. Your reset authorization may have expired.',
      );
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
            SET NEW PASSWORD
          </h1>
          <p className="text-xs text-[#E85A18] font-bold">SAI TOURS & TRAVELS</p>
          <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Choose a strong new passphrase (minimum 12 characters).
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{successMessage}</span>
              </div>
              <p className="text-[11px] text-emerald-700">Redirecting to login in a moment...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('resetToken')} value={token} />

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('newPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 12 characters"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-slate-50/50 hover:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-slate-50/50 hover:bg-white"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Requirements Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Security Requirement:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[10px]">
                  <li>Minimum 12 characters in length</li>
                  <li>All prior active login sessions will be immediately revoked</li>
                  <li>Hashed securely with Argon2id</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password Hash...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Password & Invalidate Sessions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-600 hover:text-[#E85A18] font-semibold transition"
            >
              Cancel and return to Login
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Session revocation enforced upon completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B192C] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-[#E85A18] animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
