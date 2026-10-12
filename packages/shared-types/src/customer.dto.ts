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
  documentCount: number;
}
