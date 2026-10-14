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
  PlaneTakeoff,
  TrendingUp,
  TrendingDown,
  Calculator,
  IndianRupee,
} from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      registrationDate: todayStr,
      travelDate: '',
      departure: '',
      arrival: '',
      customerAmount: 0,
      agentAmount: 0,
      serviceCharge: 0,
      notes: '',
      consentGranted: true,
    },
  });

  const phoneValue = watch('primaryPhone');
  const watchedCustomerAmount = watch('customerAmount');
  const watchedAgentAmount = watch('agentAmount');

  // Live real-time calculation: Customer Amount - Agent Amount = Service Charge (Profit)
  const customerAmount = Number(watchedCustomerAmount) || 0;
  const agentAmount = Number(watchedAgentAmount) || 0;
  const serviceCharge = customerAmount - agentAmount;

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

      // Ensure calculated service charge is submitted
      data.customerAmount = customerAmount;
      data.agentAmount = agentAmount;
      data.serviceCharge = serviceCharge;

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
              Create an authorized customer record with travel itinerary, automatic profit calculation, and DPDPA 2023 statutory consent.
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

            {/* Registration Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E85A18]" />
                <span>Registration Date <span className="text-red-500">*</span></span>
              </label>
              <input
                {...register('registrationDate')}
                type="date"
                defaultValue={todayStr}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18] bg-slate-50 font-medium text-slate-800"
              />
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

        {/* Section 3: Service Category & Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#E85A18]" />
            <span>3. Primary Service Category & Location</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Category with Extended Options */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Primary Service Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('primaryCategory')}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              >
                <option value={ServiceCategory.PASSPORT_SERVICES}>Passport Services</option>
                <option value={ServiceCategory.TOURIST_VISA}>Tourist Visa</option>
                <option value={ServiceCategory.BUSINESS_VISA}>Business Visa</option>
                <option value={ServiceCategory.FLIGHT_BOOKING}>Flight Booking</option>
                <option value={ServiceCategory.TRAIN_TICKET}>Train Ticket</option>
                <option value={ServiceCategory.FERRY_TICKET}>Ferry Ticket</option>
                <option value={ServiceCategory.BUS_TICKET}>Bus Ticket</option>
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
              placeholder="Door No, Street name, Area, Landmarks..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>
        </div>

        {/* Section 4: Travel Itinerary & Routing */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <PlaneTakeoff className="w-4 h-4 text-[#E85A18]" />
            <span>4. Travel Itinerary & Journey Routing</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Travel Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Travel Date</span>
              </label>
              <input
                {...register('travelDate')}
                type="date"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>

            {/* Departure */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Departure (Origin)</span>
              </label>
              <input
                {...register('departure')}
                type="text"
                placeholder="e.g. Madurai (IXM) / Chennai (MAA)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>

            {/* Arrival */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Arrival (Destination)</span>
              </label>
              <input
                {...register('arrival')}
                type="text"
                placeholder="e.g. Singapore (SIN) / Dubai (DXB)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Pricing, Agency Costs & Service Charge (Profit Calculation) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#E85A18]" />
              <span>5. Financials & Real-Time Service Charge (Profit Calculation)</span>
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-orange-50 text-[#E85A18] rounded border border-orange-200">
              Customer Amount − Agent Amount = Service Charge
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Customer Amount (Gross Receivable)</span>
                <span className="text-[10px] text-slate-400">Total charged to client</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  {...register('customerAmount')}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                />
              </div>
            </div>

            {/* Agent Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Agent Amount (Net Cost / Payable)</span>
                <span className="text-[10px] text-slate-400">Direct booking / vendor cost</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  {...register('agentAmount')}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
                />
              </div>
            </div>
          </div>

          {/* Interactive Real-Time Calculated Profit Display Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              serviceCharge >= 0
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
                : 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {serviceCharge >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-xs font-bold tracking-tight text-slate-800">
                    Calculated Service Charge (Agency Net Profit)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      serviceCharge >= 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {serviceCharge >= 0 ? 'PROFIT' : 'LOSS WARNING'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Formula: ₹{customerAmount.toLocaleString('en-IN')} (Customer) − ₹{agentAmount.toLocaleString('en-IN')} (Agent) ={' '}
                  <strong className={serviceCharge >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    ₹{serviceCharge.toLocaleString('en-IN')}
                  </strong>
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Service Charge Amount
                </span>
                <span
                  className={`text-2xl font-black font-mono tracking-tight ${
                    serviceCharge >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  ₹{serviceCharge.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Customer Details Notes */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-[#E85A18]" />
            <span>6. Customer Details Notes</span>
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Customer Details Notes & Booking Remarks
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Enter customer travel preferences, passport application file number, urgent deadlines, special requests, family references..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A18]"
            />
          </div>
        </div>

        {/* Section 7: DPDPA 2023 Consent Checkbox */}
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
                travel itineraries, and document files exclusively for travel booking, ticket reservation, and passport/visa processing services.
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
            className="flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Register Customer Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

