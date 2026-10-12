import { DocumentType, ServiceCategory } from './enums.js';

export interface SmartSearchQueryDto {
  q: string;
  branchId?: string;
  limit?: number;
  offset?: number;
  documentType?: DocumentType;
  serviceCategory?: ServiceCategory;
  fromDate?: string;
  toDate?: string;
  expiresWithinDays?: number;
}

export type SearchIntentType =
  | 'GENERAL'
  | 'CUSTOMER'
  | 'DOCUMENT'
  | 'PASSPORT_EXPIRY'
  | 'VISA_DESTINATION'
  | 'FLIGHT_BOOKING'
  | 'RECENT_UPLOADS';

export interface DetectedEntities {
  customerName?: string;
  phone?: string;
  customerNumber?: string;
  passportNumber?: string;
  destination?: string;
  branchName?: string;
  expiryDays?: number;
  dateRange?: { from?: string; to?: string };
  documentType?: string;
  serviceCategory?: string;
}

export interface SearchIntent {
  intentType: SearchIntentType;
  detectedEntities: DetectedEntities;
  suggestedFilterSummary: string;
}

export type SearchResultEntityType =
  | 'CUSTOMER'
  | 'DOCUMENT'
  | 'PASSPORT'
  | 'VISA'
  | 'TRAVEL_BOOKING';

export interface SearchResultItem {
  id: string;
  entityType: SearchResultEntityType;
  title: string;
  subtitle: string;
  snippet: string;
  customerId: string;
  customerNumber: string;
  branchId: string;
  branchName: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  deepLink: string;
}

export interface SmartSearchResultDto {
  query: string;
  interpretedIntent: SearchIntent;
  totalCount: number;
  items: SearchResultItem[];
  executionTimeMs: number;
}
