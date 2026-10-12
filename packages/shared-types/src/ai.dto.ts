import { z } from 'zod';
import { AIJobStatus } from './enums.js';

export const passportMrzExtractionSchema = z.object({
  documentCode: z.string().default('P'),
  issuingCountry: z.string().default('IND'),
  surname: z.string().min(1),
  givenNames: z.string().min(1),
  passportNumber: z.string().min(6).max(12),
  passportNumberCheckDigit: z.string().length(1),
  nationality: z.string().min(2),
  dateOfBirth: z.string().regex(/^\d{6}$/, 'YYMMDD format'),
  dobCheckDigit: z.string().length(1),
  sex: z.enum(['M', 'F', '<', 'X']),
  expiryDate: z.string().regex(/^\d{6}$/, 'YYMMDD format'),
  expiryCheckDigit: z.string().length(1),
  compositeCheckDigit: z.string().length(1),
  rawLine1: z.string().length(44),
  rawLine2: z.string().length(44),
  isCheckDigitValid: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type PassportMrzExtraction = z.infer<typeof passportMrzExtractionSchema>;

export const flightTicketExtractionSchema = z.object({
  passengerName: z.string().min(2),
  airline: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  pnr: z.string().optional().nullable(),
  originAirport: z.string().max(10).optional().nullable(),
  destAirport: z.string().max(10).optional().nullable(),
  departureDateTime: z.string().optional().nullable(),
  arrivalDateTime: z.string().optional().nullable(),
  baggageAllowance: z.string().optional().nullable(),
  ticketNumber: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
});

export type FlightTicketExtraction = z.infer<typeof flightTicketExtractionSchema>;

export const visaExtractionSchema = z.object({
  applicantName: z.string().min(2),
  country: z.string().min(2),
  visaCategory: z.string().default('TOURIST'),
  visaNumber: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().min(1),
  durationOfStayDays: z.number().int().optional().nullable(),
  entriesPermitted: z.enum(['SINGLE', 'MULTIPLE', 'DOUBLE']).default('SINGLE'),
  confidence: z.number().min(0).max(1),
});

export type VisaExtraction = z.infer<typeof visaExtractionSchema>;

export const verifyAiResultSchema = z.object({
  jobId: z.string().uuid(),
  verifiedData: z.record(z.any()),
  applyToCustomer: z.boolean().default(true),
});

export type VerifyAiResultDto = z.infer<typeof verifyAiResultSchema>;
