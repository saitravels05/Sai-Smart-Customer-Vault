'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 60-second Resend cooldown timer
  const [cooldown, setCooldown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Handle paste of whole 6-digit code
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');

    if (otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setErrorMessage('Email address is missing. Please return to the request page.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res: any = await apiClient.post('/auth/verify-otp', { email, otp });
      const resetToken = res.data?.resetToken;

      setSuccessMessage('Verification successful. Directing to password update...');
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`,
        );
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Verification failed. Please check the code or request a new one.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    try {
      setCanResend(false);
      setCooldown(60);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res: any = await apiClient.post('/auth/resend-otp', { email });
      if (res.data?.emailUnconfigured || res.emailUnconfigured) {
        setErrorMessage(
          res.data?.message ||
            res.message ||
            'Email delivery provider is not configured on the server. Please set SMTP or Resend credentials in .env.',
        );
        setCanResend(true);
        return;
      }
      setSuccessMessage('A fresh verification code has been dispatched.');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification code.');
      setCanResend(true);
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
            VERIFY 6-DIGIT CODE
          </h1>
          <p className="text-xs text-[#E85A18] font-bold">SAI TOURS & TRAVELS</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Code is valid for 5 minutes (Max 5 attempts)</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Registered Email confirmation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="saipassportmdu@gmail.com"
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-slate-50"
              />
            </div>

            {/* 6-Digit Code Input Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-black border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:border-transparent transition bg-slate-50/50 hover:bg-white text-slate-900"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code Authenticity...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown Strip */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-1.5 font-bold transition ${
                canResend
                  ? 'text-[#E85A18] hover:underline cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${!canResend ? 'animate-spin' : ''}`} />
              <span>{canResend ? 'Resend Code' : `Resend in ${cooldown}s`}</span>
            </button>
          </div>

          {/* Links */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#E85A18] font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Single-use OTP with rate-limited brute-force lockout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B192C] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-[#E85A18] animate-spin" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
