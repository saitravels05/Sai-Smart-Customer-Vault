import { z } from 'zod';

export enum ConsentPurpose {
  PASSPORT_PROCESSING = 'PASSPORT_PROCESSING',
  VISA_APPLICATION = 'VISA_APPLICATION',
  FLIGHT_BOOKING = 'FLIGHT_BOOKING',
  WHATSAPP_ALERTS = 'WHATSAPP_ALERTS',
  DOCUMENT_VAULT_STORAGE = 'DOCUMENT_VAULT_STORAGE',
  MARKETING_UPDATES = 'MARKETING_UPDATES',
}

export const createConsentSchema = z.object({
  purpose: z.nativeEnum(ConsentPurpose),
  language: z.enum(['ENGLISH', 'TAMIL']).default('ENGLISH'),
  noticeVersion: z.string().default('v2023.1'),
  notes: z.string().optional(),
});

export type CreateConsentDto = z.infer<typeof createConsentSchema>;

export const revokeConsentSchema = z.object({
  reason: z.string().min(3, 'Revocation reason is required'),
});

export type RevokeConsentDto = z.infer<typeof revokeConsentSchema>;

export const anonymizeCustomerSchema = z.object({
  reason: z.string().min(5, 'Legal justification or customer erasure request reason is required'),
  confirmAnonymization: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly confirm permanent anonymization' }),
  }),
});

export type AnonymizeCustomerDto = z.infer<typeof anonymizeCustomerSchema>;

export const auditLogQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type AuditLogQueryDto = z.infer<typeof auditLogQuerySchema>;

/**
 * UIDAI Aadhaar Masking Validator & Sanitizer
 * Ensures NO raw 12-digit Aadhaar number is stored or processed without masking.
 */
export function sanitizeAadhaarNumber(rawAadhaar: string): string {
  const digitsOnly = rawAadhaar.replace(/\D/g, '');
  if (digitsOnly.length === 12) {
    const last4 = digitsOnly.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return rawAadhaar;
}

export function isValidMaskedAadhaar(aadhaar: string): boolean {
  // Format: XXXX-XXXX-1234 or XXXXXXXXXXXX with first 8 X
  return /^X{4}-X{4}-\d{4}$/.test(aadhaar) || /^X{8}\d{4}$/.test(aadhaar);
}
