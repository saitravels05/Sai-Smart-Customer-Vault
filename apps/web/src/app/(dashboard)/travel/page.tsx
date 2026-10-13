'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlaneTakeoff,
  Hotel,
  Calendar,
  Search,
  Filter,
  PlusCircle,
  Building2,
  Phone,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Compass,
  MapPin,
  Ticket,
  ChevronRight,
  Users,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/context/language-context';

interface TravelBookingItem {
  id: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  primaryPhone: string;
  bookingRef: string;
  pnr?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  originAirport?: string | null;
  destAirport?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  hotelName?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  createdAt: string;
}

export default function TravelBookingsPage() {
  const { isTamil } = useLanguage();
  const [bookings, setBookings] = useState<TravelBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FLIGHT' | 'HOTEL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  // New Booking Form State
  const [formData, setFormData] = useState({
    customerId: '',
    bookingRef: '',
    pnr: '',
    airline: '',
    flightNumber: '',
    originAirport: 'IXM',
    destAirport: 'DXB',
    departureTime: '',
    arrivalTime: '',
    hotelName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get('/customers/bookings/all');
      if (res?.data && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerList = async () => {
    try {
      const res: any = await apiClient.get('/customers', { params: { limit: 50 } });
      if (res?.data && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchCustomerList();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.bookingRef) {
      alert('Please select a customer and enter a booking reference.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post(`/customers/${formData.customerId}/bookings`, {
        bookingRef: formData.bookingRef,
        pnr: formData.pnr || undefined,
        airline: formData.airline || undefined,
        flightNumber: formData.flightNumber || undefined,
        originAirport: formData.originAirport || undefined,
        destAirport: formData.destAirport || undefined,
        departureTime: formData.departureTime || undefined,
        arrivalTime: formData.arrivalTime || undefined,
        hotelName: formData.hotelName || undefined,
      });

      setIsAddModalOpen(false);
      setFormData({
        customerId: '',
        bookingRef: '',
        pnr: '',
        airline: '',
        flightNumber: '',
        originAirport: 'IXM',
        destAirport: 'DXB',
        departureTime: '',
        arrivalTime: '',
        hotelName: '',
      });
      fetchBookings();
    } catch (err: any) {
      alert(`Booking creation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (typeFilter === 'FLIGHT' && !b.flightNumber && !b.pnr) return false;
    if (typeFilter === 'HOTEL' && !b.hotelName) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPnr = b.pnr?.toLowerCase().includes(q);
      const matchRef = b.bookingRef?.toLowerCase().includes(q);
      const matchClient = b.customerName?.toLowerCase().includes(q);
      const matchAirline = b.airline?.toLowerCase().includes(q);
      if (!matchPnr && !matchRef && !matchClient && !matchAirline) return false;
    }
    return true;
  });

  const flightCount = bookings.filter((b) => !!b.pnr || !!b.flightNumber).length;
  const hotelCount = bookings.filter((b) => !!b.hotelName).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTamil ? 'பயண முன்பதிவு மையம்' : 'Travel Operations Desk'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Madurai HO & Trichy BO</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlaneTakeoff className="w-6 h-6 text-[#E85A18]" />
            <span>{isTamil ? 'பயண முன்பதிவுகள் & டிக்கெட்டுகள்' : 'Travel Bookings & Itineraries'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTamil
              ? 'விமான முன்பதிவுகள், PNR நிலைகள், ஹோட்டல் முன்பதிவுகள் மற்றும் புறப்பாடு அட்டவணைகள்.'
              : 'Flight PNRs, airline tickets, hotel reservations, and customer travel schedules.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isTamil ? '+ புதிய முன்பதிவு' : '+ Add Booking'}</span>
          </button>
        </div>
      </div>

      {/* 4 Travel Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'மொத்த பயணங்கள்' : 'Total Bookings'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#E85A18] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'பதிவு செய்யப்பட்ட பயணங்கள்' : 'Confirmed bookings'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'விமான டிக்கெட்டுகள் (PNR)' : 'Flight PNRs'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{flightCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'நேரடி விமான அட்டவணைகள்' : 'Airlines & routes'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'ஹோட்டல் முன்பதிவுகள்' : 'Hotel Bookings'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{hotelCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? 'தங்குமிட உறுதிப்படுத்தல்கள்' : 'Accommodations confirmed'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {isTamil ? 'அடுத்த புறப்பாடு' : 'Next Departure'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {bookings.length > 0 ? 'Scheduled' : 'None Scheduled'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTamil ? '7 நாள் எல்லைக்குள்' : 'Within 7-day horizon'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isTamil
                  ? 'PNR, வாடிக்கையாளர் பெயர் அல்லது விமான எண்ணைத் தேடவும்...'
                  : 'Search by PNR, customer name, airline, or booking reference...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                  typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('FLIGHT')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                  typeFilter === 'FLIGHT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Flights
              </button>
              <button
                onClick={() => setTypeFilter('HOTEL')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                  typeFilter === 'HOTEL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Hotels
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table or Pristine Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-[#E85A18]" />
            <span>{isTamil ? 'பயண முன்பதிவுகள் ஏற்றப்படுகிறது...' : 'Loading travel bookings...'}</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#E85A18] shadow-xs">
              <PlaneTakeoff className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">
                {isTamil ? 'பயண முன்பதிவுகள் எதுவும் இல்லை' : 'No Travel Bookings Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isTamil
                  ? 'தற்போது வரவிருக்கும் விமான பயணங்கள் அல்லது ஹோட்டல் முன்பதிவுகள் எதுவும் இல்லை. வாடிக்கையாளருக்கு புதிய முன்பதிவைச் சேர்க்கவும்.'
                  : 'No upcoming flights or hotel reservations currently scheduled. Create a booking to track PNRs and departure schedules.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isTamil ? '+ புதிய முன்பதிவு சேர்க்க' : '+ Add Travel Booking'}</span>
              </button>
              <Link
                href="/customers"
                className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Users className="w-4 h-4 text-orange-400" />
                <span>{isTamil ? 'வாடிக்கையாளர் பட்டியல்' : 'Customer CRM'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Booking Ref / PNR</th>
                  <th className="py-3 px-4">Passenger Name</th>
                  <th className="py-3 px-4">Flight / Airline</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-[#E85A18]">{b.pnr || b.bookingRef}</p>
                      <span className="text-[10px] text-slate-400">Ref: {b.bookingRef}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{b.customerName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{b.primaryPhone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{b.airline || 'Air Travel'}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{b.flightNumber || '-'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {b.originAirport || 'IXM'} → {b.destAirport || 'DXB'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.departureTime ? new Date(b.departureTime).toLocaleDateString() : 'Confirmed'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customers/${b.customerId}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-[#E85A18] hover:text-white rounded-lg text-slate-700 font-semibold text-[11px] transition"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Booking Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-4 h-4 text-[#E85A18]" />
                <span>Create Travel Booking</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                >
                  <option value="">-- Select Registered Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerNumber}) - {c.primaryPhone}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[11px] text-amber-600">
                    No customers found. Please register a customer first or test with demo customer.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Booking Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAI-TRV-2026-001"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Flight PNR</label>
                  <input
                    type="text"
                    placeholder="e.g. Y7Z4KQ"
                    value={formData.pnr}
                    onChange={(e) => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Airline Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Air India / IndiGo / Emirates"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Flight Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6E-241"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Origin (IATA)</label>
                  <input
                    type="text"
                    placeholder="IXM (Madurai)"
                    value={formData.originAirport}
                    onChange={(e) => setFormData({ ...formData, originAirport: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Destination (IATA)</label>
                  <input
                    type="text"
                    placeholder="DXB (Dubai)"
                    value={formData.destAirport}
                    onChange={(e) => setFormData({ ...formData, destAirport: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hotel Accommodation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Millennium Hotel Dubai"
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85A18]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#E85A18] hover:bg-[#D44E0F] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Travel Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
