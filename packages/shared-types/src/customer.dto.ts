import { z } from 'zod';
import { Gender, CustomerStatus, ServiceCategory } from './enums.js';

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters').max(150),
  branchId: z.string().uuid('Valid Branch ID is required'),
  assignedStaffId: z.string().uuid().optional().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable(),
  gender: z.nativeEnum(Gender).default(Gender.UNSPECIFIED),
  nationality: z.string().default('Indian'),
  primaryPhone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  whatsappNumber: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid WhatsApp number format').optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  addressLine: z.string().max(500).optional().nullable(),
  city: z.string().max(60).optional().nullable(),
  state: z.string().max(60).default('Tamil Nadu'),
  postalCode: z.string().max(15).optional().nullable(),
  country: z.string().max(60).default('India'),
  primaryCategory: z.nativeEnum(ServiceCategory).default(ServiceCategory.PASSPORT_SERVICES),
  notes: z.string().max(2000).optional().nullable(),
  // Travel & Financial Calculations
  registrationDate: z.string().optional().nullable(),
  travelDate: z.string().optional().nullable(),
  departure: z.string().max(100).optional().nullable(),
  arrival: z.string().max(100).optional().nullable(),
  customerAmount: z.coerce.number().min(0).optional().nullable(),
  agentAmount: z.coerce.number().min(0).optional().nullable(),
  serviceCharge: z.coerce.number().optional().nullable(),
  // Initial consent flag per DPDPA
  consentGranted: z.boolean().default(true),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  status: z.nativeEnum(CustomerStatus).optional(),
});

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['fullName', 'registeredAt', 'createdAt']).default('registeredAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CustomerFilterDto = z.infer<typeof customerFilterSchema>;

export interface CustomerSummaryDto {
  id: string;
  customerNumber: string;
  fullName: string;
  primaryPhone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  city?: string | null;
  primaryCategory: ServiceCategory;
  status: CustomerStatus;
  branchName: string;
  branchCode: string;
  registeredAt: string;
  registrationDate?: string | null;
  travelDate?: string | null;
  departure?: string | null;
  arrival?: string | null;
  customerAmount?: number | null;
  agentAmount?: number | null;
  serviceCharge?: number | null;
  documentCount: number;
}

export const addPassportSchema = z.object({
  passportNumber: z.string().min(5).max(20),
  issuingCountry: z.string().default('IND'),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().min(4),
  placeOfIssue: z.string().optional().nullable(),
});

export type AddPassportDto = z.infer<typeof addPassportSchema>;

export const addVisaSchema = z.object({
  country: z.string().min(2).max(80),
  visaNumber: z.string().optional().nullable(),
  visaCategory: z.string().default('TOURIST'),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().min(4),
  durationOfStayDays: z.coerce.number().optional().nullable(),
  entriesPermitted: z.string().default('SINGLE'),
});

export type AddVisaDto = z.infer<typeof addVisaSchema>;

export const addBookingSchema = z.object({
  bookingRef: z.string().min(2).max(50),
  pnr: z.string().optional().nullable(),
  airline: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  originAirport: z.string().optional().nullable(),
  destAirport: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  hotelName: z.string().optional().nullable(),
  checkInDate: z.string().optional().nullable(),
  checkOutDate: z.string().optional().nullable(),
});

export type AddBookingDto = z.infer<typeof addBookingSchema>;

export const addNoteSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.string().default('GENERAL'),
});

export type AddNoteDto = z.infer<typeof addNoteSchema>;

export interface DuplicateCandidateDto {
  id: string;
  customerNumber: string;
  fullName: string;
  primaryPhone: string;
  whatsappNumber?: string | null;
  matchScore: number; // 0 - 100%
  matchReason: string;
}

export const mergeCustomersSchema = z.object({
  duplicateCustomerId: z.string().uuid(),
  resolutionReason: z.string().min(3).max(500),
});

export type MergeCustomersDto = z.infer<typeof mergeCustomersSchema>;

