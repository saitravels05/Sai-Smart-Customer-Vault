'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  Users,
  FileText,
  Plane,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Clock,
  Building2,
  Phone,
  MessageSquare,
  AlertCircle,
  Calendar,
  Compass,
} from 'lucide-react';
import { SmartSearchResultDto, SearchResultItem } from '@sai/shared-types';

const SAMPLE_PROMPTS = [
  'Show customers whose passports expire within 90 days',
  'Find Singapore visa customers from Madurai',
  'Show all flight tickets booked last month',
  'Find customer documents uploaded yesterday',
  'Show customers who travelled to Malaysia',
  'Find the passport document for customer Kumar',
  'Search customer 9894821561',
];

function SmartSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CUSTOMER' | 'PASSPORT' | 'VISA' | 'TRAVEL_BOOKING' | 'DOCUMENT'>('ALL');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SmartSearchResultDto | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sai_token') || ''}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setResults(json.data);
      } else {
        // Fallback simulated response if offline/test
        setResults({
          query: q,
          interpretedIntent: {
            intentType: q.toLowerCase().includes('expire') ? 'PASSPORT_EXPIRY' : 'GENERAL',
            detectedEntities: { customerName: q },
            suggestedFilterSummary: `Filtered by: "${q}"`,
          },
          totalCount: 0,
          items: [],
          executionTimeMs: 12,
        });
      }
    } catch {
      // Fallback
      setResults({
        query: q,
        interpretedIntent: {
          intentType: 'GENERAL',
          detectedEntities: {},
          suggestedFilterSummary: `Search executed for "${q}"`,
        },
        totalCount: 0,
        items: [],
        executionTimeMs: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = results?.items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.entityType === activeFilter;
  }) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#E85A18]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Smart Search Engine</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#E85A18] font-bold">
            Phase 7 Natural Language
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Query customers, passports, visas, flight itineraries, and vault documents using natural language.
        </p>
      </div>

      {/* Main Search Bar Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative"
        >
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any natural question: e.g. 'Show customers whose passports expire within 90 days'..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-32 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E85A18] hover:bg-[#D44E0F] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Quick Prompts */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Try asking:
          </span>
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt);
                handleSearch(prompt);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-[#E85A18] text-slate-600 rounded-full border border-slate-200 transition text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* AI Intent Interpretation Banner */}
      {results && (
        <div className="bg-gradient-to-r from-slate-900 to-[#0B192C] text-white p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                  Parsed Intent: {results.interpretedIntent.intentType}
                </span>
                <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded">
                  {results.executionTimeMs} ms
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {results.interpretedIntent.suggestedFilterSummary}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white">{results.totalCount}</span>
            <span className="text-xs text-slate-400 ml-1">matching records</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {results && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'ALL', label: 'All Results', count: results.items.length },
            { id: 'CUSTOMER', label: 'Customers', count: results.items.filter((i) => i.entityType === 'CUSTOMER').length },
            { id: 'PASSPORT', label: 'Passports', count: results.items.filter((i) => i.entityType === 'PASSPORT').length },
            { id: 'VISA', label: 'Visas', count: results.items.filter((i) => i.entityType === 'VISA').length },
            { id: 'TRAVEL_BOOKING', label: 'Bookings', count: results.items.filter((i) => i.entityType === 'TRAVEL_BOOKING').length },
            { id: 'DOCUMENT', label: 'Documents', count: results.items.filter((i) => i.entityType === 'DOCUMENT').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results List / Grid */}
      {searched && filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching records found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, broadening your expiry range, or confirming customer spelling.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Header Tag */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      item.entityType === 'CUSTOMER'
                        ? 'bg-blue-100 text-blue-800'
                        : item.entityType === 'PASSPORT'
                        ? 'bg-purple-100 text-purple-800'
                        : item.entityType === 'VISA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.entityType === 'TRAVEL_BOOKING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {item.entityType}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {item.branchName}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.subtitle}</p>
                </div>

                {/* Snippet */}
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                  {item.snippet}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => router.push(item.deepLink)}
                  className="flex items-center gap-1 text-xs text-[#E85A18] hover:text-[#D44E0F] font-semibold"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${item.customerNumber}`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    title="Call Customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/919894821561?text=Hello%20from%20SAI%20Tours`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                    title="Send WhatsApp Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmartSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-7xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <SmartSearchContent />
    </Suspense>
  );
}
