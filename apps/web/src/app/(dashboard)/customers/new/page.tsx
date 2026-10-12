'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCustomerSchema,
  CreateCustomerDto,
  ServiceCategory,
  Gender,
} from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Users,
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateCustomerDto>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      fullName: '',
      branchId: user?.branchId || '',
      gender: Gender.UNSPECIFIED,
      nationality: 'Indian',
      primaryPhone: '',
      whatsappNumber: '',
      email: '',
      addressLine: '',
      city: '',
      state: 'Tamil Nadu',
      country: 'India',
      primaryCategory: ServiceCategory.PASSPORT_SERVICES,
      notes: '',
      consentGranted: true,
    },
  });

  const phoneValue = watch('primaryPhone');

  const checkDuplicatePhone = async (phone: string) => {
    if (!phone || phone.length < 10) return;
    try {
      const res: any = await apiClient.post('/customers/check-duplicate', {
        primaryPhone: phone,
      });
      if (res?.data?.hasDuplicate) {
        setDuplicateWarning(res.data.duplicates);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignored during passive check
    }
  };

  const onSubmit = async (data: CreateCustomerDto) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Super Admin or staff branch fallback
      if (!data.branchId && user?.branchId) {
        data.branchId = user.branchId;
      }

      const res: any = await apiClient.post('/customers', data);
      if (res?.data?.id) {
        router.push(`/customers/${res.data.id}`);
      } else {
        router.push('/customers');
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to register customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Register New Customer Profile
            </h1>
            <p className="text-xs text-slate-500">
              Create an authorized customer record with DPDPA 2023 statutory consent.
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Registration Error: </span>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* Duplicate Customer Warning Card */}
      {duplicateWarning && duplicateWarning.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Possible Duplicate Customer Detected!</span>
          </div>
          <p className="text-[11px] text-amber-800">
            A customer profile with this mobile number already exists in the system:
          </p>
          <div className="space-y-1">
            {duplicateWarning.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2 rounded bg-white/80 border border-amber-200 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-[#E85A18]">{d.customerNumber}</span>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="font-bold text-slate-800">{d.fullName}</span>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="text-slate-600">{d.branch?.name}</span>
                </div>
                <Link
                  href={`/customers/${d.id}`}
                  className="font-bold text-[#E85A18] hover:underline"
                >
                  View Existing Record →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Identity Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-[#E85A18]" />
            <span>1. Basic Customer Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Customer Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('fullName')}
                type="text"
                placeholder="e.g. S. Kumaravel / Shanmugam"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
              {errors.fullName && (
                <p className="text-[11px] text-red-600 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Gender</label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value={Gender.UNSPECIFIED}>Unspecified</option>
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
                <option value={Gender.OTHER}>Other</option>
              </select>
            </div>

            {/* Nationality */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nationality</label>
              <input
                {...register('nationality')}
                type="text"
                defaultValue="Indian"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Channels */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Phone className="w-4 h-4 text-[#E85A18]" />
            <span>2. Communication & Contact Channels</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Mobile */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Primary Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('primaryPhone')}
                onBlur={() => checkDuplicatePhone(phoneValue)}
                type="tel"
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
              {errors.primaryPhone && (
                <p className="text-[11px] text-red-600 font-medium">{errors.primaryPhone.message}</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">WhatsApp Number</label>
              <input
                {...register('whatsappNumber')}
                type="tel"
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="customer@gmail.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Service Category & Branch */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#E85A18]" />
            <span>3. Primary Service & Assigned Branch</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Primary Service Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('primaryCategory')}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value={ServiceCategory.PASSPORT_SERVICES}>Passport Services</option>
                <option value={ServiceCategory.TOURIST_VISA}>Tourist Visa</option>
                <option value={ServiceCategory.BUSINESS_VISA}>Business Visa</option>
                <option value={ServiceCategory.FLIGHT_BOOKING}>Flight Booking</option>
                <option value={ServiceCategory.HOTEL_BOOKING}>Hotel Booking</option>
                <option value={ServiceCategory.TOUR_PACKAGES}>Tour Packages</option>
                <option value={ServiceCategory.CERTIFICATE_ATTESTATION}>Certificate Attestation</option>
                <option value={ServiceCategory.GAZETTE_SERVICES}>Gazette Services</option>
                <option value={ServiceCategory.TRANSPORT_RENTALS}>Transport Rentals</option>
                <option value={ServiceCategory.OTHER_TRAVEL_SERVICES}>Other Travel Services</option>
              </select>
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Residential City</label>
              <input
                {...register('city')}
                type="text"
                placeholder="e.g. Madurai, Trichy, Chennai"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>

          {/* Residential Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Complete Address</label>
            <textarea
              {...register('addressLine')}
              rows={2}
              placeholder="Door No, Street name, Area..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Special Notes or Requirements</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Client travel preferences, urgent deadlines, minor details..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>
        </div>

        {/* Section 4: DPDPA 2023 Consent Checkbox */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register('consentGranted')}
              type="checkbox"
              className="mt-0.5 rounded text-[#E85A18] focus:ring-[#E85A18]"
            />
            <div className="text-xs text-emerald-950">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Statutory DPDPA 2023 Consent Confirmation</span>
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Customer has granted consent for SAI Tours & Travels to process personal identity details,
                travel itineraries, and document files exclusively for travel booking and passport/visa processing services.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/customers"
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register Customer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
