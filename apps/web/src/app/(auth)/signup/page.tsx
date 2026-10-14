'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupRequestSchema, SignupRequestDto } from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';
import {
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  UserPlus,
  Clock,
} from 'lucide-react';

export default function SignupRequestPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupRequestDto>({
    resolver: zodResolver(signupRequestSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      branch: 'IXM-HO',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupRequestDto) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await apiClient.post('/auth/signup-request', data);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to submit registration request. Please try again.',
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

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8">
        {/* Brand Header */}
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
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
            STAFF REGISTRATION REQUEST
          </h1>
          <p className="text-xs text-[#E85A18] font-bold">SAI TOURS & TRAVELS</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-50 text-[11px] text-amber-800 font-semibold border border-amber-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E85A18]" />
            <span>Owner Authorization Required Before Activation</span>
          </div>
        </div>

        {/* Form Body or Success State */}
        <div className="p-6 sm:p-8">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Registration Request Submitted
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your application has been received and queued with status{' '}
                  <span className="font-bold text-amber-600">PENDING</span>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#E85A18] shrink-0 mt-0.5" />
                  <span>
                    The Owner (<strong>saipassportmdu@gmail.com</strong>) reviews all applications.
                    Once approved and assigned a role (ADMIN or STAFF), you will be notified and
                    granted access to log in.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="e.g. S. Ramanathan"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="name@saitravelservices.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Mobile Number & Branch Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        {...register('mobile')}
                        type="text"
                        placeholder="+91 9894821561"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.mobile.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Designated Branch</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        {...register('branch')}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition bg-white"
                      >
                        <option value="IXM-HO">Madurai Head Office (IXM-HO)</option>
                        <option value="TRZ-BR">Trichy Branch Office (TRZ-BR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 12 characters"
                        className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A18] transition"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-red-600 font-medium">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 cursor-pointer duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Submit Request for Owner Review</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#E85A18] font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already have an active account? Sign in</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
